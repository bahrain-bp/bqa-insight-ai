import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register required Chart.js components
// These components are essential for rendering the bar chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

// Define constants for judgement types and assign each a unique color
// This ensures consistency in chart visualization for different judgement categories
const judgementTypes = ['Confidence', 'Limited Confidence', 'No Confidence'];
const JUDGEMENT_COLORS: Record<string, string> = {
  'Confidence': '#30C5A2',         // Green for positive judgement
  'Limited Confidence': '#FFA600', // Orange for moderate judgement
  'No Confidence': '#D34F4F',      // Red for negative judgement
};

// Define TypeScript interfaces to enforce type safety and structure
// These ensure that the data being passed to the component adheres to the required format
interface Review {
  Title: string;                 // Title of the review
  Program: string;               // Associated program name
  UnifiedStudyField: string;     // Broad field of study
  Cycle: string;                 // Cycle or round of the review
  Type: string;                  // Type of review
  Judgement: string;             // Judgement category
  ReportFile: string;            // Link to the report file
}

interface UniversityReview {
  InstitutionCode: string;       // Unique identifier for the institution
  InstitutionName: string;       // Name of the institution
  Reviews: Review[];             // List of reviews associated with the university
}

interface UniversityHistoryGraphProps {
  data: UniversityReview[];      // Array of university reviews passed as props
}

// Main component function
export function UniversityHistoryGraph({ data }: UniversityHistoryGraphProps) {
  // State for managing user search input
  const [searchTerm, setSearchTerm] = useState('');
  const [matchingUniversities, setMatchingUniversities] = useState<UniversityReview[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<UniversityReview[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Refs to manage DOM elements for dropdown and input behavior
  const dropdownRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Effect to handle search term changes and filter matching universities
  useEffect(() => {
    // If the search term is empty, clear matches and reset highlight index
    if (searchTerm.trim().length === 0) {
      setMatchingUniversities([]);
      setHighlightedIndex(-1);
      return;
    }

    // Convert search term to lowercase for case-insensitive matching
    const lower = searchTerm.toLowerCase();

    // Filter universities where the name includes the search term
    const matches = data.filter((university) => {
      const institutionName = university.InstitutionName?.toLowerCase() || '';
      return institutionName.includes(lower);
    });

    // Update state with matching universities and set highlight index
    setMatchingUniversities(matches);
    setHighlightedIndex(matches.length > 0 ? 0 : -1);
  }, [searchTerm, data]);

  // Function to add a university to the selected list
  const handleSelectUniversity = (university: UniversityReview) => {
    setSelectedUniversities((prev) => {
      // Avoid adding duplicates by checking if the university is already selected
      if (prev.find((u) => u.InstitutionCode === university.InstitutionCode)) {
        return prev;
      }
      return [...prev, university];
    });

    // Clear the search term and hide the suggestions after selection
    setSearchTerm('');
    setMatchingUniversities([]);
    setHighlightedIndex(-1);
  };

  // Function to remove a university from the selected list
  const removeUniversity = (institutionCode: string) => {
    setSelectedUniversities((prev) =>
      prev.filter((university) => university.InstitutionCode !== institutionCode)
    );
  };

  // Function to prepare bar chart data for a specific university
  const prepareBarData = (university: UniversityReview): ChartData<'bar', number[]> => {
    // Extract unique program names from reviews and sort them alphabetically
    const programs = [...new Set(university.Reviews.map(review => review.Program))].sort();

    // Initialize a mapping to count judgements for each program
    const programJudgements: Record<string, Record<string, number>> = {};
    programs.forEach(program => {
      programJudgements[program] = {
        'Confidence': 0,
        'Limited Confidence': 0,
        'No Confidence': 0
      };
    });

    // Populate the judgement counts for each program
    university.Reviews.forEach(review => {
      if (review.Program && review.Judgement) {
        programJudgements[review.Program][review.Judgement]++;
      }
    });

    // Format data for Chart.js consumption
    return {
      labels: programs, // X-axis labels (program names)
      datasets: judgementTypes.map(judgement => ({
        label: judgement, // Legend label for the dataset
        data: programs.map(program => programJudgements[program][judgement]), // Y-axis data points
        backgroundColor: JUDGEMENT_COLORS[judgement], // Bar color
        borderColor: JUDGEMENT_COLORS[judgement],     // Border color
        borderWidth: 1,                              // Border thickness
        barPercentage: 0.8,                          // Width of each bar relative to others
      }))
    };
  };

  // Configuration for Chart.js bar chart
  const options: ChartOptions<'bar'> = {
    responsive: true,             // Make chart responsive to window size
    maintainAspectRatio: false,   // Allow custom height/width
    scales: {
      x: {
        stacked: true,            // Stack bars for each program
        title: {
          display: true,
          text: 'Programs',       // X-axis title
          padding: { top: 80 }
        },
        ticks: {
          maxRotation: 45,        // Rotate labels for better readability
          minRotation: 45,
          autoSkip: false,        // Do not skip labels
          font: { size: 11 }      // Font size for X-axis labels
        }
      },
      y: {
        stacked: true,            // Stack values for Y-axis
        ticks: { precision: 0 },  // Show integer values only
        title: {
          display: true,
          text: 'Number of Reviews', // Y-axis title
        },
        beginAtZero: true         // Ensure Y-axis starts at zero
      }
    },
    plugins: {
      legend: {
        display: true,            // Display legend
        position: 'top'           // Position legend at the top
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y; // Y-axis value
            return `${label}: ${value} reviews`;
          }
        }
      },
      datalabels: {
        display: false // Hide data labels on bars
      }
    }
  };

  // Function to handle keyboard navigation in the search dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (matchingUniversities.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Move highlight down, loop to top if at the end
      setHighlightedIndex((prev) =>
        prev < matchingUniversities.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Move highlight up, loop to bottom if at the start
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : matchingUniversities.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Select highlighted university
      if (highlightedIndex >= 0 && highlightedIndex < matchingUniversities.length) {
        handleSelectUniversity(matchingUniversities[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Close the dropdown
      setMatchingUniversities([]);
      setHighlightedIndex(-1);
    }
  };

  // Render the component
  return (
    <div className="flex flex-col space-y-4 max-w-full">
      {/* Search bar for universities */}
      <div>
        <label className="font-semibold block mb-1">
          Search for a University
        </label>
        <input
          type="text"
          className="border border-gray-300 rounded px-3 py-1 w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter university name..."
          ref={inputRef}
        />
      </div>

      {/* Dropdown displaying matching universities */}
      {matchingUniversities.length > 0 && (
        <ul
          className="border border-gray-300 rounded bg-white w-full md:w-1/2 shadow-lg max-h-60 overflow-y-auto"
          ref={dropdownRef}
        >
          {matchingUniversities.map((univ, idx) => (
            <li
              key={univ.InstitutionCode}
              className={`px-3 py-2 cursor-pointer ${
                idx === highlightedIndex
                  ? 'bg-blue-500 text-white' // Highlighted item style
                  : 'hover:bg-gray-100'
              }`}
              onMouseEnter={() => setHighlightedIndex(idx)} // Highlight on hover
              onMouseDown={() => handleSelectUniversity(univ)} // Select on click
            >
              {univ.InstitutionName}
            </li>
          ))}
        </ul>
      )}

      {/* Display selected universities with their respective bar charts */}
      {selectedUniversities.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {selectedUniversities.map((university) => (
            <div
              key={university.InstitutionCode}
              className="p-4 border border-gray-200 rounded bg-white shadow flex flex-col space-y-4"
            >
              <div>
                <h3 className="text-lg font-bold mb-2">
                  {university.InstitutionName}
                </h3>
                <button
                  className="mt-2 text-red-500 underline"
                  onClick={() => removeUniversity(university.InstitutionCode)}
                >
                  Remove
                </button>
              </div>

              <div>
                <h4 className="font-semibold">Programs Reviewed:</h4>
                <ul className="list-disc list-inside">
                  {university.Reviews.map((review, idx) => (
                    <li key={idx}>
                      <strong>{review.Program}</strong>
                      <br />
                      Type: {review.Type} | 
                      Judgement: {review.Judgement}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ height: '800px' }}>
                {university.Reviews.length > 0 ? (
                  <Bar data={prepareBarData(university)} options={options} />
                ) : (
                  <p className="text-gray-500">No reviews found.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UniversityHistoryGraph;
