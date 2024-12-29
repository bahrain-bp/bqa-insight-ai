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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const judgementTypes = ['Confidence', 'Limited Confidence', 'No Confidence'];

const JUDGEMENT_COLORS: Record<string, string> = {
  'Confidence': '#30C5A2',
  'Limited Confidence': '#FFA600',
  'No Confidence': '#D34F4F',
};


interface Review {
  Title: string;
  Program: string;
  UnifiedStudyField: string;
  Cycle: string;
  Type: string;
  Judgement: string;
  ReportFile: string;
}

interface UniversityReview {
  InstitutionCode: string;
  InstitutionName: string;
  Reviews: Review[];
}

interface UniversityHistoryGraphProps {
  data: UniversityReview[];
}


export function UniversityHistoryGraph({ data }: UniversityHistoryGraphProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchingUniversities, setMatchingUniversities] = useState<UniversityReview[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<UniversityReview[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setMatchingUniversities([]);
      setHighlightedIndex(-1);
      return;
    }

    const lower = searchTerm.toLowerCase();
    
    const matches = data.filter((university) => {
      const institutionName = university.InstitutionName?.toLowerCase() || '';
      return institutionName.includes(lower);
    });

    setMatchingUniversities(matches);
    setHighlightedIndex(matches.length > 0 ? 0 : -1);
  }, [searchTerm, data]);

  const handleSelectUniversity = (university: UniversityReview) => {
    setSelectedUniversities((prev) => {
      if (prev.find((u) => u.InstitutionCode === university.InstitutionCode)) {
        return prev;
      }
      return [...prev, university];
    });
    setSearchTerm('');
    setMatchingUniversities([]);
    setHighlightedIndex(-1);
  };

  const removeUniversity = (institutionCode: string) => {
    setSelectedUniversities((prev) =>
      prev.filter((university) => university.InstitutionCode !== institutionCode)
    );
  };

  const prepareBarData = (university: UniversityReview): ChartData<'bar', number[]> => {
    const programs = [...new Set(university.Reviews.map(review => review.Program))].sort();
    
    // Create a mapping of program to judgement counts
    const programJudgements: Record<string, Record<string, number>> = {};
    
    programs.forEach(program => {
      programJudgements[program] = {
        'Confidence': 0,
        'Limited Confidence': 0,
        'No Confidence': 0
      };
    });

    // Count judgements for each program
    university.Reviews.forEach(review => {
      if (review.Program && review.Judgement) {
        programJudgements[review.Program][review.Judgement]++;
      }
    });
    return {
      labels: programs,
      datasets: judgementTypes.map(judgement => ({
        label: judgement,
        data: programs.map(program => programJudgements[program][judgement]),
        backgroundColor: JUDGEMENT_COLORS[judgement],
        borderColor: JUDGEMENT_COLORS[judgement],
        borderWidth: 1,
        barPercentage: 0.8,
      }))
    };
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Programs',
          padding: { top: 80 }
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          padding: 10,
          autoSkip: false,
          font: {
            size: 11
          }
        }
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Number of Reviews',
          padding: { bottom: 10 }
        },
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value} reviews`;
          }
        }
      },
      datalabels: {
        display: false
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (matchingUniversities.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < matchingUniversities.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : matchingUniversities.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < matchingUniversities.length) {
        handleSelectUniversity(matchingUniversities[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMatchingUniversities([]);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="flex flex-col space-y-4 max-w-full">
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
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100'
              }`}
              onMouseEnter={() => setHighlightedIndex(idx)}
              onMouseDown={() => handleSelectUniversity(univ)}
            >
              {univ.InstitutionName}
            </li>
          ))}
        </ul>
      )}

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