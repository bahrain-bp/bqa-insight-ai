import { useState, useEffect, useMemo, useRef } from 'react';
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
  TooltipItem,
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
  const [selectedSchool, setSelectedSchool] = useState<SchoolData | null>(null);
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

  // Extract reviews from selected school
  const reviews = useMemo<Review[]>(() => {
    return selectedSchool?.Reviews || [];
  }, [selectedSchool]);

  // ----------------------------
  // 2) Build Points for the Chart
  // ----------------------------
  const points = useMemo(() => {
    return reviews.map((r) => {
      const gradeNum = parseGradeNumber(r.Grade);
      const cycle = r.Cycle || 'N/A';
      return {
        x: cycle,
        y: gradeNum,
        date: r.BatchReleaseDate || '',
        review: r,
      };
    });
  }, [reviews]);

  // ----------------------------
  // 3) Prepare Chart Data
  // ----------------------------
  const lineData: ChartData<'line', typeof points> = {
    labels: [], // Not using string labels; relying on data.x
    datasets: [
      {
        type: 'line',
        label: 'All Reviews',
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

  // ----------------------------
  // 4) Tooltip Callback
  // ----------------------------
  const tooltipCallback = (ctx: TooltipItem<'line'>) => {
    const idx = ctx.dataIndex;
    const item = points[idx];
    if (!item) return '';
    const r = item.review;
    return [
      `Grade: ${r.Grade}`,
      `Cycle: ${r.Cycle}`,
      `Date: ${r.BatchReleaseDate}`,
    ].join('\n');
  };

  // ----------------------------
  // 5) Calculate Average Grade
  // ----------------------------
  const averageGrade = selectedSchool?.AverageGrade || null;

  // ----------------------------
  // 6) Chart Options
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
          text: 'Cycle (C1, C2, ...)',
        },
      },
      y: {
        min: 1,
        max: 4,
        reverse: true, // So 4 is bottom, 1 is top
        ticks: {
          stepSize: 1,
        },
        title: {
          display: true,
          text: '(4) Inadequate => (1) Outstanding',
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Hide the legend if not needed
      },
      tooltip: {
        callbacks: {
          label: tooltipCallback,
        },
      },
      // chartjs-plugin-datalabels => display date near each point
      datalabels: {
        clip: false, // Allow labels to render outside the chart area
        // We'll do dynamic alignment based on y=1 or y=4
        align: (ctx) => {
          const item = points[ctx.dataIndex];
          if (!item.y) return 'center';
          if (item.y === 4) return 'end'; // Align above for grade 4
          if (item.y === 1) return 'start'; // Align below for grade 1
          return 'end'; // Default alignment
        },
        anchor: (ctx) => {
          const item = points[ctx.dataIndex];
          if (!item.y) return 'center';
          if (item.y === 4) return 'end'; // Anchor to end for grade 4
          if (item.y === 1) return 'start'; // Anchor to start for grade 1
          return 'end'; // Default anchor
        },
        offset: 4,
        color: '#333',
        font: {
          size: 10,
        },
        formatter: (_val, ctx) => {
          const idx = ctx.dataIndex;
          const item = points[idx];
          return item.date; // Display the batch release date
        },
      },
    },
  };

  // ----------------------------
  // 7) Handle Keyboard Navigation
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
        setSelectedSchool(selected);
        setSearchTerm('');
        setMatchingSchools([]);
        setHighlightedIndex(-1);
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
  // 8) Render the Component
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
          placeholder="e.g. 'Saar Primary Boys School'"
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
              onMouseDown={() => {
                // Use onMouseDown instead of onClick to handle selection before input loses focus
                setSelectedSchool(sch);
                setSearchTerm('');
                setMatchingSchools([]);
                setHighlightedIndex(-1);
              }}
            >
              {sch.EnglishSchoolName}
            </li>
          ))}
        </ul>
      )}

      {/* === Selected School Information and Chart === */}
      {selectedSchool && (
        <div className="p-4 border border-gray-200 rounded bg-white shadow space-y-4">
          {/* Basic School Information */}
          <div>
            <h3 className="text-lg font-bold mb-2">
              {selectedSchool.EnglishSchoolName}
            </h3>
            <p>Arabic Name: {selectedSchool.ArabicSchoolName}</p>
            <p>Institution Code: {selectedSchool.InstitutionCode}</p>
            <p>School Type: {selectedSchool.SchoolType}</p>
            {/* Conditional Rendering: Hide Gender and Level for Private Schools */}
            {selectedSchool.SchoolType !== 'Private' && (
              <>
                <p>School Gender: {selectedSchool.SchoolGender}</p>
                <p>School Level: {selectedSchool.SchoolLevel}</p>
              </>
            )}
            {/* Display Average Grade */}
            {averageGrade !== null && (
              <p className="mt-2 text-md font-semibold">
                Average Grade: {averageGrade}
              </p>
            )}
          </div>

          {/* Chart Container with Controlled Width */}
          <div className="max-w-xl h-96">
            {reviews.length > 0 ? (
              <Line data={lineData} options={options} />
            ) : (
              <p className="text-gray-500">No reviews found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
