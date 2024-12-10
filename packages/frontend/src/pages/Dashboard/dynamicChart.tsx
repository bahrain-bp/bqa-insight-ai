import React from "react";
import { Chart as ChartJS, ChartOptions } from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

// Register all necessary chart components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Define a generic type for JSON data
interface JsonDataItem {
    [key: string]: string | number;
}

interface DynamicChartProps {
    jsonData: JsonDataItem[];
}

const DynamicChart: React.FC<DynamicChartProps> = ({ jsonData }) => {
    // Early return if no data
    if (!jsonData || jsonData.length === 0) {
        return <p>No data available to generate chart.</p>;
    }

    // Dynamically fetch column names
    const labels = Object.keys(jsonData[0]);
    const xAxisLabel = labels[0]; // First column for X-axis labels
    const dataColumns = labels.slice(1); // Other columns for datasets

    // Generate random color with alpha
    const generateColor = () => {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        return {
            borderColor: `rgba(${r}, ${g}, ${b}, 1)`,
            backgroundColor: `rgba(${r}, ${g}, ${b}, 0.5)`
        };
    };

    // Create datasets with random colors
    const datasets = dataColumns.map((column) => ({
            label: column,
            data: jsonData.map((row) => row[column] as number),
        ...generateColor(),
        tension: 0.4, // Smooth curves for line
}));

    // Prepare chart data
    const chartData = {
        labels: jsonData.map((row) => row[xAxisLabel]),
        datasets,
    };

    // Determine chart type dynamically
    const determineChartType = (): React.ComponentType<any> => {
        if (datasets.length === 1) {
            // Single dataset: Line or Pie
            const isCategorical = typeof jsonData[0][xAxisLabel] === "string";
            return isCategorical ? Pie : Line;
        }
        return datasets.length > 2 ? Bar : Line;
    };

    // Select appropriate chart component
    const ChartComponent = determineChartType();

    // Chart options
    const chartOptions: ChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: "top",
            },
            title: {
                display: true,
                text: "Dynamic Chart Generated from JSON",
            },
        },
    };

    return <ChartComponent data={chartData} options={chartOptions} />;
};

export default DynamicChart;