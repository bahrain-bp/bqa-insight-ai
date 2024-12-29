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

const COLORS = {
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

interface UniversityData {
  InstitutionCode: string;
  InstitutionName: string;
  Reviews: Review[];
}

export function UniversityGeneralCharts({ data }: { data: UniversityData[] }) {
  // 1. Programs by Cycle Distribution
  const cycleData = useMemo(() => {
    const cycleCounts = data.reduce((acc, uni) => {
      uni.Reviews.forEach(review => {
        acc[review.Cycle] = (acc[review.Cycle] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(cycleCounts),
      datasets: [{
        data: Object.values(cycleCounts),
        backgroundColor: [
          '#30C5A2',
          '#FFA600',
          '#D34F4F',
          '#E68835',
        ],
        label: 'Programs by Cycle'
      }]
    };
  }, [data]);

  // 2. Study Fields Distribution
  const fieldData = useMemo(() => {
    const fieldCounts = data.reduce((acc, uni) => {
      uni.Reviews.forEach(review => {
        acc[review.UnifiedStudyField] = (acc[review.UnifiedStudyField] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(fieldCounts),
      datasets: [{
        data: Object.values(fieldCounts),
        backgroundColor: [
          '#E68835',
          '#397B26',
          '#1C4679',
          '#F3BB41',
          '#E64125',
          '#3376CC',
          '#4CAF50', 
          '#FFA726', 
          '#EF5350',
          '#1B5E20',
        ],
        label: 'Programs by Field'
      }]
    };
  }, [data]);

  // 3. Judgement Distribution by Study Field
  const judgementByFieldData = useMemo(() => {
    const fieldJudgements: Record<string, Record<string, number>> = {};
    
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

    return {
      labels: fields,
      datasets: judgementTypes.map(judgement => ({
        label: judgement,
        data: fields.map(field => fieldJudgements[field][judgement] || 0),
        backgroundColor: COLORS[judgement as keyof typeof COLORS],
      }))
    };
  }, [data]);

  const chartOptions = {
    doughnut: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        datalabels: {display: false},
        legend: { position: 'right' as const },
        title: { 
          display: true,
          text: 'Distribution of Programs by Cycle',
          font: { size: 16 }
        }
      }
    },
    polar: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        datalabels: {display: false},
        legend: { position: 'right' as const },
        title: { 
          display: true,
          text: 'Distribution of Programs by Study Field',
          font: { size: 16 }
        }
      }
    },
    bar: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        datalabels: {display: false},
        legend: { position: 'top' as const },
        title: { 
          display: true,
          text: 'Judgements by Study Field',
          font: { size: 16 }
        }
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        font: {
          size: 12, // Adjust the font size here
        },
        formatter: (value: number) => value > 0 ? value : '', // Show labels only for non-zero values
        color: 'black', // Set a contrasting color for better readability
      },
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true,
          beginAtZero: true
        }
      }
    }
  };

  return (
    <div className="flex flex-col space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow h-80">
        <Pie data={cycleData} options={chartOptions.doughnut} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow h-80">
        <Pie data={fieldData} options={chartOptions.doughnut} />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow h-80">
        <Bar data={judgementByFieldData} options={chartOptions.bar} />
      </div>
    </div>
  );
}
