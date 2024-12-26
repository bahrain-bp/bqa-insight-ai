
import { useMemo } from 'react';
import { Bar, Scatter, Pie } from 'react-chartjs-2';
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
  ChartOptions,
  TooltipItem,
  ScatterDataPoint,
} from 'chart.js';
import { UniversityData } from './types';

// Register Chart.js components
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

// Define colors for each grade category
const GRADE_COLORS: Record<string, string> = {
  Outstanding: '#30C5A2', // Green
  Good: '#37B0FF',        // Blue
  Satisfactory: '#FFA600',// Orange
  Inadequate: '#D34F4F',  // Red
};

export function UniversityGeneralCharts({ data }: { data: UniversityData[] }) {
  // Helper function to parse numeric grade from strings like "(4) Inadequate"
  const parseGradeNumber = (grade: string): number | null => {
    if (!grade) return null;
    const match = grade.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : null;
  };

  // ==========================
  // 1) Scatter Chart: Institutes by Average Grade
  // ==========================
  function toScatterPoint(Universities: UniversityData) {
    let xVal = 4; // Default to 4 if invalid
    if (Universities.AverageGrade !== null && !isNaN(Universities.AverageGrade)) {
      xVal = Math.max(1, Math.min(4, Universities.AverageGrade)); // Clamp between 1 and 4
    }
    const yVal = Math.random() * 0.8 - 0.4; // Generate random Y value in the range [-0.4, 0.4]
    return {
      x: xVal,
      y: yVal,
      label: Universities.EnglishInstituteName,
      gradeCategory: getGradeCategory(xVal),
    };
  }
  
  function getGradeCategory(gradeNum: number) {
    if (gradeNum >= 1 && gradeNum < 2) return 'Outstanding';
    if (gradeNum >= 2 && gradeNum < 3) return 'Good';
    if (gradeNum >= 3 && gradeNum < 4) return 'Satisfactory';
    if (gradeNum >= 4) return 'Inadequate';
    return 'N/A';
  }
  
  const scatterChartData = useMemo(() => {
    const points = data.map(toScatterPoint);
  
    return {
      datasets: [
        {
          label: 'Universities',
          data: points,
          backgroundColor: points.map(
            (point) => GRADE_COLORS[point.gradeCategory] || '#999'
          ),
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };
  }, [data]);
  
  const scatterChartOptions: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false, // Allow the chart to fill its container
    scales: {
      x: {
        type: 'linear',
        reverse: true, 
        min: 1,
        max: 4,
        title: {
          display: true,
          text: 'Average Grade',
        },
        ticks: {
          stepSize: 0.5, // Increment by 0.5
          callback: (value) => {
            // Map numeric grade to category for better readability
            if (value === 1) return '1 - Outstanding';
            if (value === 2) return '2 - Good';
            if (value === 3) return '3 - Satisfactory';
            if (value === 4) return '4 - Inadequate';
            if (value === 1.5) return '1.5';
            if (value === 2.5) return '2.5';
            if (value === 3.5) return '3.5';
            return value;
          },
        },
      },
      y: {
        display: false, // Hide Y-axis since it is random
      },
    },
    plugins: {
      legend: { display: false }, // Hide legend since color represents grade
      title: {
        display: true,
        text: 'Universities by Average Grade',
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'scatter'>) => {
            const raw = ctx.raw as ScatterDataPoint & { label: string };
            return [
              raw.label,
              `Average Grade: ${raw.x}`,
            ].join('\n');
          },
        },
      },
      // @ts-ignore
      datalabels: false,
    },
  };
  

  // ==========================
  // 2) Average Grade Distribution (Bar Chart)
  // ==========================
  const barChartData = useMemo(() => {
    const gradeCounts: Record<string, number> = {
      Outstanding: 0,
      Good: 0,
      Satisfactory: 0,
      Inadequate: 0,
    };

    data.forEach((Universities) => {
      const avgGrade = Universities.AverageGrade;
      if (avgGrade >= 1 && avgGrade < 2) gradeCounts['Outstanding'] += 1;
      else if (avgGrade >= 2 && avgGrade < 3) gradeCounts['Good'] += 1;
      else if (avgGrade >= 3 && avgGrade < 4) gradeCounts['Satisfactory'] += 1;
      else if (avgGrade >= 4) gradeCounts['Inadequate'] += 1;
    });

    return {
      labels: Object.keys(gradeCounts),
      datasets: [
        {
          label: 'Number of Universities',
          data: Object.values(gradeCounts),
          backgroundColor: [
            GRADE_COLORS['Outstanding'],
            GRADE_COLORS['Good'],
            GRADE_COLORS['Satisfactory'],
            GRADE_COLORS['Inadequate'],
          ],
        },
      ],
    };
  }, [data]);

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false, // Allow the chart to fill its container
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        title: {
          display: true,
          text: 'Number of Universities',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Grade Category',
        },
      },
    },
    plugins: {
      legend: { display: false }, // Hide legend since each bar represents a category
      title: {
        display: true,
        text: 'Average Grade Distribution for all Institutes',
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}`,
        },
      },
    },
  };

  // ==========================
  // 3) Overall Grade Distribution (Pie Chart)
  // ==========================
  const pieChartData = useMemo(() => {
    const gradeCounts: Record<string, number> = {
      Outstanding: 0,
      Good: 0,
      Satisfactory: 0,
      Inadequate: 0,
    };

    data.forEach((University) => {
      University.Reviews.forEach((review) => {
        const gradeNum = parseGradeNumber(review.Grade);
        if (gradeNum === 1) gradeCounts['Outstanding'] += 1;
        else if (gradeNum === 2) gradeCounts['Good'] += 1;
        else if (gradeNum === 3) gradeCounts['Satisfactory'] += 1;
        else if (gradeNum === 4) gradeCounts['Inadequate'] += 1;
      });
    });

    return {
      labels: Object.keys(gradeCounts),
      datasets: [
        {
          label: 'Overall Grade Distribution',
          data: Object.values(gradeCounts),
          backgroundColor: [
            GRADE_COLORS['Outstanding'],
            GRADE_COLORS['Good'],
            GRADE_COLORS['Satisfactory'],
            GRADE_COLORS['Inadequate'],
          ],
        },
      ],
    };
  }, [data]);

  const pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false, // Allow the chart to fill its container
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Overall Grade Distribution For all Reviews',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            return `${label}: ${value}`;
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* 1. Scatter Chart: Institutes by Average Grade */}
      <div
        className="bg-white p-4 rounded shadow w-full h-96 relative"
        aria-label="Scatter Chart: Institutes by Average Grade"
      >
        <Scatter data={scatterChartData} options={scatterChartOptions} />
      </div>

      {/* 2. Average Grade Distribution (Bar Chart) */}
      <div
        className="bg-white p-4 rounded shadow w-full h-64 relative"
        aria-label="Bar Chart: Average Grade Distribution"
      >
        <Bar data={barChartData} options={barChartOptions} />
      </div>

      {/* 3. Overall Grade Distribution (Pie Chart) */}
      <div
        className="bg-white p-4 rounded shadow w-full h-64 relative"
        aria-label="Pie Chart: Overall Grade Distribution"
      >
        <Pie data={pieChartData} options={pieChartOptions} />
      </div>
    </div>
  );
}
