// Import required hooks and components from React and react-chartjs-2
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

// Register necessary chart elements and plugins for Chart.js
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

// Define color mapping for Judgement categories
const COLORS = {
  'Confidence': '#30C5A2', // Green for Confidence
  'Limited Confidence': '#FFA600', // Orange for Limited Confidence
  'No Confidence': '#D34F4F', // Red for No Confidence
};

// Define the structure of a Review object
interface Review {
  Title: string;
  Program: string;
  UnifiedStudyField: string;
  Cycle: string;
  Type: string;
  Judgement: string;
  ReportFile: string;
}

// Define the structure of UniversityData, which includes multiple reviews
interface UniversityData {
  InstitutionCode: string;
  InstitutionName: string;
  Reviews: Review[];
}

// Main component to render charts for university data
export function UniversityGeneralCharts({ data }: { data: UniversityData[] }) {
  // Calculate data for Programs by Cycle Distribution
  const cycleData = useMemo(() => {
    // Reduce data to count reviews per cycle
    const cycleCounts = data.reduce((acc, uni) => {
      uni.Reviews.forEach(review => {
        acc[review.Cycle] = (acc[review.Cycle] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Format the data to be used in the chart
    return {
      labels: Object.keys(cycleCounts), // Cycles as labels
      datasets: [{
        data: Object.values(cycleCounts), // Review counts as data
        backgroundColor: ['#30C5A2', '#FFA600', '#D34F4F', '#E68835'], // Chart colors
        label: 'Programs by Cycle', // Chart label
      }]
    };
  }, [data]); // Dependency array ensures calculation only when data changes

  // Calculate data for Study Fields Distribution
  const fieldData = useMemo(() => {
    // Reduce data to count reviews per study field
    const fieldCounts = data.reduce((acc, uni) => {
      uni.Reviews.forEach(review => {
        acc[review.UnifiedStudyField] = (acc[review.UnifiedStudyField] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Format the data to be used in the chart
    return {
      labels: Object.keys(fieldCounts), // Study fields as labels
      datasets: [{
        data: Object.values(fieldCounts), // Review counts as data
        backgroundColor: ['#E68835', '#397B26', '#1C4679', '#F3BB41', '#E64125', '#3376CC', '#4CAF50', '#FFA726', '#EF5350', '#1B5E20'], // Chart colors
        label: 'Programs by Field', // Chart label
      }]
    };
  }, [data]);

  // Calculate data for Judgement Distribution by Study Field
  const judgementByFieldData = useMemo(() => {
    // Organize judgements by study field
    const fieldJudgements: Record<string, Record<string, number>> = {};

    data.forEach(uni => {
      uni.Reviews.forEach(review => {
        if (!fieldJudgements[review.UnifiedStudyField]) {
          fieldJudgements[review.UnifiedStudyField] = {};
        }
        // Increment judgement count
        fieldJudgements[review.UnifiedStudyField][review.Judgement] =
          (fieldJudgements[review.UnifiedStudyField][review.Judgement] || 0) + 1;
      });
    });

    // Extract fields and judgement types
    const fields = Object.keys(fieldJudgements);
    const judgementTypes = ['Confidence', 'Limited Confidence', 'No Confidence'];

    // Format data for stacked bar chart
    return {
      labels: fields, // Study fields as labels
      datasets: judgementTypes.map(judgement => ({
        label: judgement, // Judgement type
        data: fields.map(field => fieldJudgements[field][judgement] || 0), // Count of each judgement type per field
        backgroundColor: COLORS[judgement as keyof typeof COLORS], // Corresponding color
      }))
    };
  }, [data]);

  // Chart configuration options for different chart types
  const chartOptions = {
    doughnut: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        datalabels: { display: false },
        legend: { position: 'right' as const },
        title: { 
          display: true,
          text: 'Distribution of Programs by Cycle', // Chart title
          font: { size: 16 },
        },
      },
    },
    bar: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        datalabels: { display: false },
        legend: { position: 'top' as const },
        title: { 
          display: true,
          text: 'Judgements by Study Field', // Chart title
          font: { size: 16 },
        },
      },
      scales: {
        x: { stacked: true }, // Stack x-axis values
        y: { stacked: true, beginAtZero: true }, // Stack y-axis values and start at 0
      },
    },
  };

  // Render the charts
  return (
    <div className="flex flex-col space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie chart for Programs by Cycle */}
        <div className="bg-white p-4 rounded-lg shadow h-80">
          <Pie data={cycleData} options={chartOptions.doughnut} />
        </div>
        {/* Pie chart for Programs by Study Field */}
        <div className="bg-white p-4 rounded-lg shadow h-80">
          <Pie data={fieldData} options={chartOptions.doughnut} />
        </div>
      </div>
      {/* Bar chart for Judgements by Study Field */}
      <div className="bg-white p-4 rounded-lg shadow h-80">
        <Bar data={judgementByFieldData} options={chartOptions.bar} />
      </div>
    </div>
  );
}
