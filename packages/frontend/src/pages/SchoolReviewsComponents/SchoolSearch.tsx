import { useState, useEffect, useMemo } from 'react';
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
import { SchoolData} from './types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function parseGradeNumber(grade: string): number | null {
  if (!grade) return null;
  const match = grade.match(/\((\d+)\)/);
  return match ? parseInt(match[1], 10) : null;
}

interface SchoolSearchProps {
  data: SchoolData[];
}

/** We'll store numeric grades or null, using the index to figure out which review is which. */
export function SchoolSearch({ data }: SchoolSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchingSchools, setMatchingSchools] = useState<SchoolData[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolData | null>(null);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setMatchingSchools([]);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setMatchingSchools(
      data.filter((school) =>
        school.EnglishSchoolName.toLowerCase().includes(lower)
      )
    );
  }, [searchTerm, data]);

  // All reviews from the selected school
  const reviews = useMemo(() => {
    if (!selectedSchool?.Reviews) return [];
    return selectedSchool.Reviews;
  }, [selectedSchool]);

  // Build X-axis labels => ["Review 1", "Review 2", ...]
  const xLabels = reviews.map((_, i) => `Review ${i + 1}`);

  // We'll create 2 datasets: "Review Report" and "Other"
  const reviewReportData: (number | null)[] = [];
  const otherData: (number | null)[] = [];

  reviews.forEach((r, i) => {
    const g = parseGradeNumber(r.Grade); // [1..4]
    if (r.ReviewType === 'Review Report') {
      reviewReportData[i] = g;  // place numeric grade here
      otherData[i] = null;      // none in 'other' dataset
    } else {
      reviewReportData[i] = null;
      otherData[i] = g;
    }
  });

  // Build typed chart data
  const lineData: ChartData<'line', (number | null)[], string> = {
    labels: xLabels, // same length as datasets
    datasets: [
      {
        type: 'line',
        label: 'Review Reports',
        data: reviewReportData,
        borderColor: 'blue',
        backgroundColor: 'blue',
        tension: 0,
        pointRadius: 5,
      },
      {
        type: 'line',
        label: 'Other Reviews',
        data: otherData,
        borderColor: 'red',
        backgroundColor: 'red',
        tension: 0,
        pointRadius: 5,
      },
    ],
  };

  // Tooltip: show info from each review
  const tooltipCallback = (ctx: TooltipItem<'line'>) => {
    // dataIndex is which X, i.e. which "Review #"
    const index = ctx.dataIndex;
    const review = reviews[index];
    if (!review) return '';
    return [
      `Review Type: ${review.ReviewType}`,
      `Grade: ${review.Grade}`,
      review.Cycle ? `Cycle: ${review.Cycle}` : '',
      review.Batch ? `Batch: ${review.Batch}` : '',
      review.BatchReleaseDate ? `BatchReleaseDate: ${review.BatchReleaseDate}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'category',
        title: { display: true, text: 'Review Count' },
      },
      y: {
        reverse: true, // so 4 at bottom, 1 at top
        min: 1,
        max: 4,
        ticks: { stepSize: 1 },
        title: {
          display: true,
          text: '(4) Inadequate => (1) Outstanding',
        },
      },
    },
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: tooltipCallback,
        },
      },
    },
  };

  return (
    <div className="flex flex-col space-y-4">
      <div>
        <label className="font-semibold block mb-1">
          Search for a School by English Name (min 2 letters)
        </label>
        <input
          type="text"
          className="border border-gray-300 rounded px-3 py-1 w-full md:w-1/2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* matching schools list */}
      {matchingSchools.length > 0 && (
        <ul className="border border-gray-300 rounded bg-white w-full md:w-1/2 shadow-lg max-h-60 overflow-y-auto">
          {matchingSchools.map((sch) => (
            <li
              key={sch.InstitutionCode}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                setSelectedSchool(sch);
                setSearchTerm('');
                setMatchingSchools([]);
              }}
            >
              {sch.EnglishSchoolName}
            </li>
          ))}
        </ul>
      )}

      {selectedSchool && (
        <div className="p-4 border border-gray-200 rounded bg-white shadow space-y-4">
          <div>
            <h3 className="text-lg font-bold mb-2">
              {selectedSchool.EnglishSchoolName}
            </h3>
            <p>Arabic Name: {selectedSchool.ArabicSchoolName}</p>
            <p>Institution Code: {selectedSchool.InstitutionCode}</p>
            <p>School Type: {selectedSchool.SchoolType}</p>
            <p>School Gender: {selectedSchool.SchoolGender}</p>
            <p>School Level: {selectedSchool.SchoolLevel}</p>
          </div>

          {/* limit width with e.g. "max-w-xl" */}
          <div className="max-w-xl h-80">
            {reviews.length > 0 ? (
              // Use type="line" rather than <Line<'line', ...>>
              <Line
                data={lineData}
                options={options}
              />
            ) : (
              <p className="text-gray-500">No reviews found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
