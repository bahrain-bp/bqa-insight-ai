import React, { useMemo } from "react";
import {
    Chart as ChartJS,
    ChartType,
    ChartOptions,
    ChartData,
    registerables
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

// Register all Chart.js components
ChartJS.register(...registerables);

// Updated interface to match the specific JSON structure
interface ChartJsonData {
    title: string;
    chartType?: ChartType;
    data: Array<{
        reviewYear: string;
        score: string | number;
    }>;
}

interface DynamicChartProps {
    jsonData: string | ChartJsonData;
}

const DynamicChart: React.FC<DynamicChartProps> = ({ jsonData }) => {
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

    // Prepare chart data
    const chartData: ChartData = useMemo(() => ({
        labels: parsedData.data.map(item => item.reviewYear),
        datasets: [{
            label: parsedData.title || 'Review Scores',
            data: parsedData.data.map(item => parseFloat(item.score.toString())),
            borderColor: "rgba(75,192,192,1)",
            backgroundColor: "rgba(75,192,192,0.2)",
            tension: 0.1
        }]
    }), [parsedData]);

    // Prepare chart options
    const chartOptions: ChartOptions = useMemo(() => ({
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: "top",
            },
            title: {
                display: true,
                text: parsedData.title || "Dynamic Chart",
            },
        },
        scales: parsedData.chartType !== 'pie' ? {
            y: {
                beginAtZero: true,
            }
        } : undefined
    }), [parsedData]);

    // Determine chart type
    const chartType: ChartType = useMemo(() => {
        switch (parsedData.chartType) {
            case 'bar': return 'bar';
            case 'pie': return 'pie';
            default: return 'line';
        }
    }, [parsedData]);

    return (
        <div style={{ maxWidth: '100%', height: 'fit-content' }}>
            <Chart
                type={chartType}
                data={chartData}
                options={chartOptions}
            />
        </div>
    );
};

export default DynamicChart;