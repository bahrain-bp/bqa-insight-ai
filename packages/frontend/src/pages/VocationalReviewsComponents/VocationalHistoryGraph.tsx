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
import { VocationalData, Review } from './types'; // Updated import

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

interface VocationalSearchProps {
  data: VocationalData[]; // Updated prop type
}

export function VocationalHistoryGraph({ data }: VocationalSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchingInstitutes, setMatchingInstitutes] = useState<VocationalData[]>([]);
  const [selectedInstitutes, setSelectedInstitutes] = useState<VocationalData[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ----------------------------
  // 1) Filter Logic: Show matches based on search term
  // ----------------------------
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setMatchingInstitutes([]); // Show no matches when search term is empty
      setHighlightedIndex(-1);
      return;
    }
    const lower = searchTerm.toLowerCase();
    const matches = data.filter((institute) =>
      institute.EnglishInstituteName.toLowerCase().includes(lower)
    );
    setMatchingInstitutes(matches);
    setHighlightedIndex(matches.length > 0 ? 0 : -1);
  }, [searchTerm, data]);

  // ----------------------------
  // 2) Handle Selection of Multiple Institutes
  // ----------------------------
  const handleSelectInstitute = (institute: VocationalData) => {
    setSelectedInstitutes((prev) => {
      // Prevent adding duplicates
      if (prev.find((s) => s.InstitutionCode === institute.InstitutionCode)) {
        return prev;
      }
      return [...prev, institute];
    });
    setSearchTerm('');
    setMatchingInstitutes([]);
    setHighlightedIndex(-1);
  };

  const removeInstitute = (institutionCode: string) => {
    setSelectedInstitutes((prev) =>
      prev.filter((institute) => institute.InstitutionCode !== institutionCode)
    );
  };

  // ----------------------------
  // 3) Prepare Chart Data for an Institute
  // ----------------------------
  const prepareLineData = (institute: VocationalData): ChartData<'line'> => {
    // Filter reviews that include 'Review' in ReviewType (case-insensitive)
    const reviewReports = institute.Reviews.filter(
      (r) => r.ReviewType.toLowerCase().includes('review')
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
      labels: points.map((p) => p.x), // Using cycle as labels
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
        grid: {
          display: true,
          // @ts-ignore
          borderColor: '#e0e0e0',
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
        grid: {
          display: true,
          // @ts-ignore
          borderColor: '#e0e0e0',
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
    if (matchingInstitutes.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < matchingInstitutes.length - 1 ? prev + 1 : 0
      );
      scrollIntoView(highlightedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : matchingInstitutes.length - 1
      );
      scrollIntoView(highlightedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < matchingInstitutes.length) {
        const selected = matchingInstitutes[highlightedIndex];
        handleSelectInstitute(selected);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMatchingInstitutes([]);
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
          Search for an Institute by English Name
        </label>
        <input
          type="text"
          className="border border-gray-300 rounded px-3 py-1 w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. 'Tech Vocational Institute'"
          ref={inputRef}
        />
      </div>

      {/* === Matching Institutes Dropdown === */}
      {matchingInstitutes.length > 0 && (
        <ul
          className="border border-gray-300 rounded bg-white w-full md:w-1/2 shadow-lg max-h-60 overflow-y-auto"
          ref={dropdownRef}
        >
          {matchingInstitutes.map((inst, idx) => (
            <li
              key={inst.InstitutionCode}
              className={`px-3 py-2 cursor-pointer ${
                idx === highlightedIndex
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100'
              }`}
              onMouseEnter={() => setHighlightedIndex(idx)}
              onMouseDown={() => handleSelectInstitute(inst)} // Use the selection handler
            >
              {inst.EnglishInstituteName}
            </li>
          ))}
        </ul>
      )}

      {/* === Selected Institutes Information and Charts === */}
      {selectedInstitutes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedInstitutes.map((institute) => {
            // Separate Review Reports and Other Reports
            const reviewReports = institute.Reviews.filter(
              (r) => r.ReviewType.toLowerCase().includes('review')
            );
            const otherReports = institute.Reviews.filter(
              (r) => !r.ReviewType.toLowerCase().includes('review')
            );
            return (
              <div
                key={institute.InstitutionCode}
                className="p-4 border border-gray-200 rounded bg-white shadow flex flex-col space-y-4 h-full"
              >
                {/* Basic Institute Information */}
                <div>
                  <h3 className="text-lg font-bold mb-2">
                    {institute.EnglishInstituteName}
                  </h3>
                  <p>Arabic Name: {institute.ArabicInstituteName}</p>
                  <p>Institution Code: {institute.InstitutionCode}</p>
                  {/* Display Average Grade */}
                  {institute.AverageGrade !== null && (
                    <p className="mt-2 text-md font-semibold">
                      Average Grade: {institute.AverageGrade}
                    </p>
                  )}
                  {/* Remove Button */}
                  <button
                    className="mt-2 text-red-500 underline"
                    onClick={() => removeInstitute(institute.InstitutionCode)}
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
                    <Line data={prepareLineData(institute)} options={options} />
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
