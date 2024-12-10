import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const DynamicChart = ({ jsonData }) => {
    if (!jsonData || jsonData.length === 0) return <p>No data available to generate chart.</p>;
  
    const labels = Object.keys(jsonData[0]); // Dynamically fetch column names
    const xAxisLabel = labels[0]; // First column for X-axis labels
    const dataColumns = labels.slice(1); // Other columns for datasets
  
    const datasets = dataColumns.map((column) => ({
      label: column,
      data: jsonData.map((row) => row[column]),
      borderColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 1)`,
      backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, 0.5)`,
      tension: 0.4, // Add smooth curves for line
    }));
  
    const chartData = {
      labels: jsonData.map((row) => row[xAxisLabel]),
      datasets,
    };
  
    // Determine chart type dynamically
    const chartType = () => {
      if (datasets.length === 1) {
        // Single dataset: Line or Pie
        const isCategorical = typeof jsonData[0][xAxisLabel] === "string";
        return isCategorical ? Pie : Line;
      }
      return datasets.length > 2 ? Bar : Line; // Multiple datasets
    };
  
    const ChartComponent = chartType();
  
    const chartOptions = {
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