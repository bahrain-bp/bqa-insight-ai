import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Import the plugin
import { SchoolData, Review } from './types';

// Register only the necessary components plus the datalabels plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels // Register the plugin locally
);

// Define colors for each grade
const GRADE_COLORS: Record<number, string> = {
  1: '#30C5A2', // Outstanding
  2: '#37B0FF', // Good
  3: '#FFA600', // Satisfactory
  4: '#D34F4F', // Inadequate
};

// Helper function to parse numeric grade from strings like "(4) Inadequate"
function parseGradeNumber(grade: string): number | null {
  if (!grade) return null;
  const match = grade.match(/\((\d+)\)/);
  return match ? parseInt(match[1], 10) : null;
}

interface SchoolSearchProps {
  data: SchoolData[];
}

export function SchoolHistoryGraph({ data }: SchoolSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchingSchools, setMatchingSchools] = useState<SchoolData[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<SchoolData[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ----------------------------
  // 1) Filter Logic: Remove the 2-letter minimum
  // ----------------------------
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setMatchingSchools([]); // Show no matches when search term is empty
      setHighlightedIndex(-1);
      return;
    }
    const lower = searchTerm.toLowerCase();
    const matches = data.filter((school) =>
      school.EnglishSchoolName.toLowerCase().includes(lower)
    );
    setMatchingSchools(matches);
    setHighlightedIndex(matches.length > 0 ? 0 : -1);
  }, [searchTerm, data]);

  // ----------------------------
  // 2) Handle Selection of Multiple Schools
  // ----------------------------
  const handleSelectSchool = (school: SchoolData) => {
    setSelectedSchools((prev) => {
      // Prevent adding duplicates
      if (prev.find((s) => s.InstitutionCode === school.InstitutionCode)) {
        return prev;
      }
      return [...prev, school];
    });
    setSearchTerm('');
    setMatchingSchools([]);
    setHighlightedIndex(-1);
  };

  const removeSchool = (institutionCode: string) => {
    setSelectedSchools((prev) =>
      prev.filter((school) => school.InstitutionCode !== institutionCode)
    );
  };

  // ----------------------------
  // 3) Prepare Chart Data for a School
  // ----------------------------
  const prepareLineData = (school: SchoolData): ChartData<'line'> => {
    // Filter only Review Reports
    const reviewReports = school.Reviews.filter(
      (r) => r.ReviewType === 'Review Report'
    );

    // Prepare data points
    const points = reviewReports.map((r) => {
      const gradeNum = parseGradeNumber(r.Grade);
      const cycle = r.Cycle || 'N/A';
      return {
        x: cycle,
        y: gradeNum,
        date: r.BatchReleaseDate || '',
        review: r,
      };
    });

    return {
      labels: [], // Not using string labels; relying on data.x
      datasets: [
        {
          type: 'line',
          label: 'Review Report',
          // @ts-ignore
          data: points,
          showLine: false, // Only show points, no connecting lines
          clip: false, // Allow points and labels to render outside the chart area
          pointRadius: 6,
          pointHoverRadius: 8,
          borderColor: '#999', // Line color (if showLine is true)
          // Dynamically set point colors based on grade
          pointBackgroundColor: (ctx) => {
            const idx = ctx.dataIndex;
            const item = points[idx];
            if (!item.y || item.y < 1 || item.y > 4) return '#999';
            return GRADE_COLORS[item.y] || '#999';
          },
        },
      ],
    };
  };

  // ----------------------------
  // 4) Chart Options
  // ----------------------------
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      // Add extra padding for top/bottom/left/right so edges are visible
      padding: {
        top: 30,
        bottom: 30,
        left: 20,
        right: 30,
      },
    },
    scales: {
      x: {
        type: 'category',
        title: {
          display: true,
          text: 'Cycle',
        },
      },
      y: {
        min: 1,
        max: 4,
        reverse: true, // So 4 is bottom, 1 is top
        ticks: {
          stepSize: 1,
          callback: function (value) {
            switch (value) {
              case 1:
                return '(1) Outstanding';
              case 2:
                return '(2) Good';
              case 3:
                return '(3) Satisfactory';
              case 4:
                return '(4) Inadequate';
              default:
                return '';
            }
          },
        },
        title: {
          display: true,
          text: '(4) Inadequate => (1) Outstanding',
        },
      },
    },
    plugins: {
      legend: {
        display: false, 
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const review = (context.raw as any).review as Review;
            return [
              `Grade: ${review.Grade}`,
              `Cycle: ${review.Cycle}`,
              `Date: ${review.BatchReleaseDate}`,
            ].join('\n');
          },
        },
      },
      // chartjs-plugin-datalabels => display date near each point
      datalabels: {
        clip: false, // Allow labels to render outside the chart area
        align: 'top',
        anchor: 'end',
        offset: 4,
        color: '#333',
        font: {
          size: 10,
        },
        formatter: (_val, ctx) => {
          const idx = ctx.dataIndex;
          const item = (ctx.chart.data.datasets[0].data[idx] as any).review as Review;
          return item.BatchReleaseDate;
        },
      },
    },
  };

  // ----------------------------
  // 5) Handle Keyboard Navigation
  // ----------------------------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (matchingSchools.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < matchingSchools.length - 1 ? prev + 1 : 0
      );
      scrollIntoView(highlightedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : matchingSchools.length - 1
      );
      scrollIntoView(highlightedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < matchingSchools.length) {
        const selected = matchingSchools[highlightedIndex];
        handleSelectSchool(selected);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMatchingSchools([]);
      setHighlightedIndex(-1);
    }
  };

  // Helper to ensure the highlighted item is visible in the dropdown
  const scrollIntoView = (index: number) => {
    const dropdown = dropdownRef.current;
    if (dropdown && index >= 0 && index < dropdown.children.length) {
      const item = dropdown.children[index] as HTMLElement;
      item.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  };

  // ----------------------------
  // 6) Render the Component
  // ----------------------------
  return (
    <div className="flex flex-col space-y-4">
      {/* === Search Input === */}
      <div>
        <label className="font-semibold block mb-1">
          Search for a School by English Name
        </label>
        <input
          type="text"
          className="border border-gray-300 rounded px-3 py-1 w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. 'Al Orouba Primary Girls School'"
          ref={inputRef}
        />
      </div>

      {/* === Matching Schools Dropdown === */}
      {matchingSchools.length > 0 && (
        <ul
          className="border border-gray-300 rounded bg-white w-full md:w-1/2 shadow-lg max-h-60 overflow-y-auto"
          ref={dropdownRef}
        >
          {matchingSchools.map((sch, idx) => (
            <li
              key={sch.InstitutionCode}
              className={`px-3 py-2 cursor-pointer ${
                idx === highlightedIndex
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100'
              }`}
              onMouseEnter={() => setHighlightedIndex(idx)}
              onMouseDown={() => handleSelectSchool(sch)} // Use the selection handler
            >
              {sch.EnglishSchoolName}
            </li>
          ))}
        </ul>
      )}

      {/* === Selected Schools Information and Charts === */}
      {selectedSchools.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedSchools.map((school) => {
            // Separate Review Reports and Other Reports
            const reviewReports = school.Reviews.filter(
              (r) => r.ReviewType === 'Review Report'
            );
            const otherReports = school.Reviews.filter(
              (r) => r.ReviewType !== 'Review Report'
            );
            return (
              <div
                key={school.InstitutionCode}
                className="p-4 border border-gray-200 rounded bg-white shadow flex flex-col space-y-4 h-full"
              >
                {/* Basic School Information */}
                <div>
                  <h3 className="text-lg font-bold mb-2">
                    {school.EnglishSchoolName}
                  </h3>
                  <p>Arabic Name: {school.ArabicSchoolName}</p>
                  <p>Institution Code: {school.InstitutionCode}</p>
                  <p>School Type: {school.SchoolType}</p>
                  {/* Conditional Rendering: Hide Gender and Level for Private Schools */}
                  {school.SchoolType !== 'Private' && (
                    <>
                      <p>School Gender: {school.SchoolGender}</p>
                      <p>School Level: {school.SchoolLevel}</p>
                    </>
                  )}
                  {/* Display Average Grade */}
                  {school.AverageGrade !== null && (
                    <p className="mt-2 text-md font-semibold">
                      Average Grade: {school.AverageGrade}
                    </p>
                  )}
                  {/* Remove Button */}
                  <button
                    className="mt-2 text-red-500 underline"
                    onClick={() => removeSchool(school.InstitutionCode)}
                  >
                    Remove
                  </button>
                </div>
            
                {/* Other Reports */}
                <div>
                  {otherReports.length > 0 && (
                    <>
                      <h4 className="font-semibold">Other Reports:</h4>
                      <ul className="list-disc list-inside">
                        {otherReports.map((report, idx) => (
                          <li key={idx}>
                            <strong>Type:</strong> {report.ReviewType} |{' '}
                            <strong>Grade:</strong> {report.Grade} |{' '}
                            <strong>Cycle:</strong> {report.Cycle} |{' '}
                            <strong>Date:</strong> {report.BatchReleaseDate}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
            
                {/* Spacer to ensure chart alignment */}
                <div className="flex-grow"></div>
            
                {/* Chart Container */}
                <div className="max-w-xl h-96">
                  {reviewReports.length > 0 ? (
                    <Line data={prepareLineData(school)} options={options} />
                  ) : (
                    <p className="text-gray-500">No review reports found.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
