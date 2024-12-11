import React, {useMemo} from "react";
import {
    Chart as ChartJS,
    ChartType,
    ChartOptions,
    ChartData,
    registerables
} from 'chart.js';
import {Chart} from 'react-chartjs-2';

// Register all Chart.js components
ChartJS.register(...registerables);

// Updated interface to match the specific JSON structure
export interface ChartJsonData {
    title: string;
    chartType?: ChartType;
    data: Array<{
        school: string;
        reviewYear?: string;
        year?: number;
        score: string | number;
    }>;
}

interface DynamicChartProps {
    jsonData: string | ChartJsonData;
}

// function generateRandomColor(alpha = 1) {
//     const r = Math.floor(Math.random() * 256); // Random red value
//     const g = Math.floor(Math.random() * 256); // Random green value
//     const b = Math.floor(Math.random() * 256); // Random blue value
//     return `rgba(${r},${g},${b},${alpha})`; // Combine with alpha transparency
// }

const DynamicChart: React.FC<DynamicChartProps> = ({jsonData}) => {
    // Parse JSON if it's a string
    const parsedData: ChartJsonData = useMemo(() =>
            typeof jsonData === 'string'
                ? JSON.parse(jsonData)
                : jsonData
        , [jsonData]);

    // Early return if no data
    if (!parsedData || !parsedData.data || parsedData.data.length === 0) {
        return <p>No data available to generate chart.</p>;
    }
    //var chartData: ChartData | undefined;
    const {labels, scores} = useMemo(() => {
        const labels = parsedData.data.map(item => item.reviewYear || item.school || '');
        const scores = parsedData.data.map(item => parseFloat(item.score.toString()));
        return {labels, scores};
    }, [parsedData]);
    // Prepare chart data
    const chartData: ChartData = useMemo(() => ({
        labels,
        datasets: [
            {
                label: parsedData.title || 'Generated Graph',
                data: scores,
                borderColor: 'rgba(75, 192, 192, 0.8)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: parsedData.chartType === 'line' ? 0.1 : 0 // Line charts use tension for smooth curves
            }
        ]
    }), [labels, scores, parsedData]);

    // Prepare chart options
    const chartOptions: ChartOptions = useMemo(() => ({
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: 'top',
            },
            title: {
                display: true,
                text: parsedData.title || 'Dynamic Chart',
            },
        },
        scales: parsedData.chartType !== 'pie' ? {
            y: {
                beginAtZero: false, // Ensure the y-axis does not start at 0
                min: 1, // Set the minimum value to 1
                ticks: {
                    stepSize: -1, // Ensure the steps are integer values
                }
            }
        } : undefined
    }), [parsedData]);

    // Determine chart type
    const chartType: ChartType = parsedData.chartType as ChartType || 'line';


    if (chartData === undefined) {
        return <p>No data available to generate chart.</p>;
    }
    return (
        <div style={{maxWidth: '100%', height: 'fit-content'}}>
            <Chart
                type={chartType}
                data={chartData}
                options={chartOptions}
            />
        </div>
    );
};

export default DynamicChart;
