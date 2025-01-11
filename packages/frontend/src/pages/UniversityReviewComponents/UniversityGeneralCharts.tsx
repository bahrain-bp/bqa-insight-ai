// Import necessary dependencies from React and chart libraries
import { useMemo } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  ScatterController,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components and plugins required for visualization
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  ScatterController,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Define color scheme for different judgment categories
const COLORS = {
  'Confidence': '#30C5A2',      // Green for positive confidence
  'Limited Confidence': '#FFA600', // Orange for limited confidence
  'No Confidence': '#D34F4F',   // Red for no confidence
};

// TypeScript interface for individual review data structure
interface Review {
  Title: string;
  Program: string;
  UnifiedStudyField: string;
  Cycle: string;
  Type: string;
  Judgement: string;
  ReportFile: string;
}

// TypeScript interface for university data structure
interface UniversityData {
  InstitutionCode: string;
  InstitutionName: string;
  Reviews: Review[];
}

// Main component that renders three charts: two pie charts and one bar chart
export function UniversityGeneralCharts({ data }: { data: UniversityData[] }) {
  // Calculate data for the first pie chart: Programs by Cycle
  const cycleData = useMemo(() => {
    // Reduce the data to count programs per cycle
    const cycleCounts = data.reduce((acc, uni) => {
      uni.Reviews.forEach(review => {
        acc[review.Cycle] = (acc[review.Cycle] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Format data for Chart.js pie chart
    return {
      labels: Object.keys(cycleCounts),
      datasets: [{
        data: Object.values(cycleCounts),
        backgroundColor: ['#30C5A2', '#FFA600', '#D34F4F', '#E68835'],
        label: 'Programs by Cycle',
      }]
    };
  }, [data]); // Recalculate only when data changes

  // Calculate data for the second pie chart: Programs by Study Field
  const fieldData = useMemo(() => {
    // Reduce the data to count programs per study field
    const fieldCounts = data.reduce((acc, uni) => {
      uni.Reviews.forEach(review => {
        acc[review.UnifiedStudyField] = (acc[review.UnifiedStudyField] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Format data for Chart.js pie chart
    return {
      labels: Object.keys(fieldCounts),
      datasets: [{
        data: Object.values(fieldCounts),
        backgroundColor: ['#E68835', '#397B26', '#1C4679', '#F3BB41', '#E64125', '#3376CC', '#4CAF50', '#FFA726', '#EF5350', '#1B5E20'],
        label: 'Programs by Field',
      }]
    };
  }, [data]);

  // Calculate data for the stacked bar chart: Judgements by Study Field
  const judgementByFieldData = useMemo(() => {
    // Create a nested structure to store judgements per field
    const fieldJudgements: Record<string, Record<string, number>> = {};

    // Populate the structure with counts
    data.forEach(uni => {
      uni.Reviews.forEach(review => {
        if (!fieldJudgements[review.UnifiedStudyField]) {
          fieldJudgements[review.UnifiedStudyField] = {};
        }
        fieldJudgements[review.UnifiedStudyField][review.Judgement] =
          (fieldJudgements[review.UnifiedStudyField][review.Judgement] || 0) + 1;
      });
    });

    const fields = Object.keys(fieldJudgements);
    const judgementTypes = ['Confidence', 'Limited Confidence', 'No Confidence'];

    // Format data for Chart.js stacked bar chart
    return {
      labels: fields,
      datasets: judgementTypes.map(judgement => ({
        label: judgement,
        data: fields.map(field => fieldJudgements[field][judgement] || 0),
        backgroundColor: COLORS[judgement as keyof typeof COLORS],
      }))
    };
  }, [data]);

  // Configuration options for the first pie chart (Programs by Cycle)
  const cycleChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: { display: false },
      legend: { position: 'right' as const },
      title: { 
        display: true,
        text: 'Distribution of Programs by Cycle',
        font: { size: 16 },
      },
    },
  };

  // Configuration options for the second pie chart (Programs by Study Field)
  const fieldChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: { display: false },
      legend: { position: 'right' as const },
      title: { 
        display: true,
        text: 'Distribution of Programs by Study Field',
        font: { size: 16 },
      },
    },
  };

  // Configuration options for the stacked bar chart
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: { display: false },
      legend: { position: 'top' as const },
      title: { 
        display: true,
        text: 'Judgements by Study Field',
        font: { size: 16 },
      },
    },
    scales: {
      x: { stacked: true },         // Enable stacking on x-axis
      y: { stacked: true, beginAtZero: true }, // Enable stacking on y-axis and start at 0
    },
  };

  // Render the chart layout using Tailwind CSS classes for responsive design
  return (
    <div className="flex flex-col space-y-8">
      {/* Grid container for pie charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First pie chart: Programs by Cycle */}
        <div className="bg-white p-4 rounded-lg shadow h-80">
          <Pie data={cycleData} options={cycleChartOptions} />
        </div>
        {/* Second pie chart: Programs by Study Field */}
        <div className="bg-white p-4 rounded-lg shadow h-80">
          <Pie data={fieldData} options={fieldChartOptions} />
        </div>
      </div>
      {/* Stacked bar chart container */}
      <div className="bg-white p-4 rounded-lg shadow h-80">
        <Bar data={judgementByFieldData} options={barChartOptions} />
      </div>
    </div>
  );
}