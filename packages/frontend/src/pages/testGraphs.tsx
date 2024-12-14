import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, ArcElement, LineElement, PointElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  LineElement,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = import.meta.env.VITE_API_URL;

interface Review {
  Cycle: string;
  Batch: string;
  BatchReleaseDate: string;
  ReviewType: string;
  Grade: string; 
}

interface SchoolData {
  InstitutionCode: string;
  EnglishSchoolName: string;
  ArabicSchoolName: string;
  Reviews: Review[];
}

export function TestGraphs() {
  const [data, setData] = useState<SchoolData[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<{ [grade: string]: number }>({});
  const [timeSeriesData, setTimeSeriesData] = useState<{ [yearMonth: string]: { [grade: string]: number } }>({});
  const [schoolBestGradeCounts, setSchoolBestGradeCounts] = useState<{ [grade: string]: number }>({});

  useEffect(() => {
    // Fetch data from the API
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/fetchGovernmentSchools`);
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          setData(json.data);
        } else {
          console.error("Invalid data format from API.");
        }
      } catch (error) {
        console.error("Error fetching government schools:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (data.length === 0) return;

    const gradeRegex = /\((\d)\)\s*(.*)/;
    const gradeDist: { [grade: string]: number } = {};
    const timeDist: { [yearMonth: string]: { [grade: string]: number } } = {};
    const bestGradePerSchool: { [grade: string]: number } = {};

    for (const school of data) {
      let bestGradeNum = Infinity;
      let bestGradeStr = "";

      for (const review of school.Reviews) {
        const match = review.Grade.match(gradeRegex);
        if (!match) continue;
        const gradeNum = parseInt(match[1], 10);
        const gradeName = match[2].trim();

        // Overall grade distribution
        gradeDist[gradeName] = (gradeDist[gradeName] || 0) + 1;

        // Time series distribution by year-month
        const date = parseDate(review.BatchReleaseDate);
        if (date) {
          const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!timeDist[ym]) timeDist[ym] = {};
          timeDist[ym][gradeName] = (timeDist[ym][gradeName] || 0) + 1;
        }

        // Check best grade for the school
        if (gradeNum < bestGradeNum) {
          bestGradeNum = gradeNum;
          bestGradeStr = gradeName;
        }
      }

      if (bestGradeStr) {
        bestGradePerSchool[bestGradeStr] = (bestGradePerSchool[bestGradeStr] || 0) + 1;
      }
    }

    setGradeDistribution(gradeDist);
    setTimeSeriesData(timeDist);
    setSchoolBestGradeCounts(bestGradePerSchool);
  }, [data]);

  // Pie Chart Data for overall grade distribution
  const pieData = {
    labels: Object.keys(gradeDistribution),
    datasets: [
      {
        label: 'Grade Distribution',
        data: Object.values(gradeDistribution),
        backgroundColor: ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854'],
      }
    ]
  };

  // Time series line chart data
  const allGrades = Array.from(new Set(Object.values(timeSeriesData).flatMap(obj => Object.keys(obj))));
  const allYearMonths = Object.keys(timeSeriesData).sort();

  const lineDatasets = allGrades.map((gradeName, i) => {
    return {
      label: gradeName,
      data: allYearMonths.map(ym => {
        const gradeCount = timeSeriesData[ym][gradeName] || 0;
        const totalCount = Object.values(timeSeriesData[ym]).reduce((a, b) => a + b, 0);
        const percentage = totalCount > 0 ? (gradeCount / totalCount) * 100 : 0;
        return percentage;
      }),
      borderColor: `hsl(${(i * 60) % 360},70%,50%)`,
      backgroundColor: `hsl(${(i * 60) % 360},70%,70%)`,
      tension: 0.1,
    };
  });

  const lineData = {
    labels: allYearMonths,
    datasets: lineDatasets
  };

  // Bar chart for best grade counts per school
  const barData = {
    labels: Object.keys(schoolBestGradeCounts),
    datasets: [
      {
        label: "Number of Schools Achieving This Best Grade",
        data: Object.values(schoolBestGradeCounts),
        backgroundColor: '#1f78b4'
      }
    ]
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Government Schools Reviews Analysis</h2>
      {data.length === 0 ? (
        <p>Loading data...</p>
      ) : (
        <>
          <div style={{ width: '400px', marginBottom: '50px' }}>
            <h3>Overall Grade Distribution</h3>
            <Pie data={pieData} />
          </div>
          <div style={{ width: '600px', marginBottom: '50px' }}>
            <h3>Grade Trends Over Time</h3>
            <p>Showing percentage of reviews per grade category by release date (Year-Month)</p>
            <Line data={lineData} />
          </div>
          <div style={{ width: '500px', marginBottom: '50px' }}>
            <h3>School Count by Best Grade Achieved</h3>
            <Bar data={barData} />
          </div>
        </>
      )}
    </div>
  );
}

// Helper function to parse dates like "Jun-09", "January 2010", "Mar-13", "July 2024", "October 2012"
function parseDate(str: string): Date | null {
  if (!str) return null;
  const shortMonthRegex = /^([A-Za-z]{3})-(\d{2})$/;
  const longMonthRegex = /^([A-Za-z]+)\s+(\d{4})$/;

  let year: number | undefined;
  let month: number | undefined;

  const shortMatch = str.match(shortMonthRegex);
  if (shortMatch) {
    const [_, mon, yy] = shortMatch;
    year = 2000 + parseInt(yy, 10); 
    month = shortMonthToNum(mon);
  }

  const longMatch = str.match(longMonthRegex);
  if (longMatch) {
    const [_, monFull, fullYear] = longMatch;
    year = parseInt(fullYear, 10);
    month = monthNameToNum(monFull);
  }

  if (year && month !== undefined) {
    return new Date(year, month, 1);
  }

  return null;
}

function shortMonthToNum(mon: string): number | undefined {
  const map: { [m: string]: number } = {
    Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5,
    Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11
  };
  return map[mon.slice(0,3)];
}

function monthNameToNum(mon: string): number | undefined {
  const lower = mon.toLowerCase();
  const months = ["january","february","march","april","may","june","july","august","september","october","november","december"];
  const idx = months.indexOf(lower);
  if (idx >= 0) return idx;
  return undefined;
}
