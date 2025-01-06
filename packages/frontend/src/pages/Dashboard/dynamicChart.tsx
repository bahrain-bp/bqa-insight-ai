import React, { useMemo } from "react";
import { Chart as ChartJS, ChartType, registerables } from "chart.js";
import { Chart } from "react-chartjs-2";

// Register all Chart.js components
ChartJS.register(...registerables);

// Define the structure for the JSON data used to configure the chart
export interface ChartJsonData {
  schoolName?: string; // Name of the school (if applicable)
  vocationalName?: string; // Name of the vocational institute (if applicable)
  schoolType?: string; // Type of school (e.g., Government, Private)
  universityName?: string; // Name of the university (if applicable)
  options?: object; // Custom options for the chart
  type: ChartType; // Chart type (e.g., line, bar, pie)
  data: {
    labels?: string[]; // Labels for pie charts
    datasets: Array<{
      data: Array<{ x: number | string; y: number } | number>; // Data points in either `{x, y}` or flat number format
      label: string; // Dataset label
      backgroundColor?: string[]; // Background colors for the dataset
      borderColor?: string[]; // Border colors for the dataset
    }>;
  };
}

// Define the props for the DynamicChart component
interface DynamicChartProps {
  jsonData: ChartJsonData | string; // Chart data passed as a JSON object or string
}

// Component to render dynamic charts based on the provided JSON data
const DynamicChart: React.FC<DynamicChartProps> = ({ jsonData }) => {
  console.log("DynamicChart jsonData:", jsonData);

  // Parse JSON data if it's a string; otherwise, use it as is
  const parsedData: ChartJsonData = useMemo(() => {
    return typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;
  }, [jsonData]);

  // Use default chart options if none are provided in the data
  const chartOptions = useMemo(() => {
    return (
      parsedData.options || {
        responsive: true, // Make the chart responsive
        plugins: {
          datalabels: {display: false}, // Disable data labels
          legend: { display: true, position: "top" }, // Display legend at the top
          title: {
            display: false, // Disable title by default
          },
        },
        scales: parsedData.type !== "pie" ? { // Scales are only applicable for non-pie charts
          x: {
            type: "category", // Set X-axis as a category
            position: "bottom",
            title: {
              display: true,
              text: "Review Cycles", // Label for the X-axis
            },
          },
          y: {
            title: {
              display: true,
              text: "Grades", // Label for the Y-axis
            },
            reverse: true, // Reverse the Y-axis
            min: 0, // Minimum value for Y-axis
            max: 5, // Maximum value for Y-axis
            ticks: {
              precision: 0, // Round to whole numbers
              stepSize: 1, // Steps between grades
              callback: (value: number) => { // Label mapping for grades
                switch(value) {
                  case 1: return "Outstanding - 1";
                  case 2: return "Good - 2";
                  case 3: return "Satisfactory - 3";
                  case 4: return "Inadequate - 4";
                  default: return "";
                }
            },
          },
        },
        } : undefined,
      }
    );
  }, [parsedData.options, parsedData.type]);
  
  // Define a color palette for chart elements
  const colorPalette : string[] = 
  [

    "rgba(102, 156, 86, 1)", // Green shade 1
    "rgba(83, 116, 156, 1)", // Blue shade 1
    "rgba(243, 187, 65, 1)", // Yellow shade 1
    "rgba(230, 65, 37, 1)", // Red shade 1
    "rgba(230, 136, 53, 1)", // Orange shade 1
  
    "rgba(184, 108, 41, 1)", // Orange shade 3
    "rgba(192, 140, 48, 1)", // Yellow shade 3
    "rgba(184, 51, 29, 1)", // Red shade 3
    "rgba(28, 70, 121, 1)", // Blue shade 3
    "rgba(57, 123, 38, 1)", // Green shade 3

    "rgba(92, 54, 20, 1)", // Orange shade 5
    "rgba(128, 93, 31, 1)", // Yellow shade 5
    "rgba(92, 25, 13, 1)", // Red shade 5
    "rgba(34, 74, 23, 1)", // Green shade 5
    "rgba(17, 42, 73, 1)", // Blue shade 5

    "rgba(138, 81, 30, 1)", // Orange shade 4
    "rgba(160, 116, 39, 1)", // Yellow shade 4
    "rgba(138, 38, 21, 1)", // Red shade 4
    "rgba(46, 98, 30, 1)", // Green shade 4
    "rgba(22, 56, 97, 1)", // Blue shade 4

    "rgba(207, 122, 47, 1)", // Orange shade 2
    "rgba(218, 163, 56, 1)", // Yellow shade 2
    "rgba(207, 58, 33, 1)", // Red shade 2
    "rgba(79, 139, 62, 1)", // Green shade 2
    "rgba(55, 93, 138, 1)", // Blue shade 2
  ]

  // Format datasets to ensure they match the new structure
  const formattedData = useMemo(() => {
    if (parsedData.type === "pie") {
      // Format for pie charts
      const labels = parsedData.data.labels || []; // Use provided labels or an empty array
      const datasets = parsedData.data.datasets.map((dataset) => ({
        label: dataset.label,
        data: dataset.data.map((point) =>
          typeof point === "number" ? point : point.y
        ), // Convert mixed formats to flat `number[]` for `y`
        backgroundColor: dataset.backgroundColor || colorPalette.slice(0, labels.length),
      }));
      return { labels, datasets };
    } else {
      // Format for other chart types (line, bar, etc.)
      const colors = [...colorPalette]; // copy color palette to ensure color uniqueness
      return {
        datasets: parsedData.data.datasets.map((dataset) => {
          const color = colors.pop() || "rgba(51, 118, 204, 1)";
          return {
            ...dataset,
            data: dataset.data.map((point) => 
              typeof point === "number" ? { x: "", y: point } : { x: point.x, y: point.y }
            ), // Ensure all points are in `{ x, y }` format
            backgroundColor: color, // Assign color
            borderColor: color, // Assign border color
          };
        }),
      };
    }
  }, [parsedData, colorPalette]);
  
  // Render the chart
  return (
    <Chart
      type={parsedData.type} // Specify chart type
      data={formattedData as any} // Cast as any to satisfy Chart.js type requirements (Pass formatted data)
      options={chartOptions}  // Pass chart options
      style={{ width: "100%", height: "100%", display: "block", margin: "auto" }} // Set chart dimensions and centering
    />
  );
};

export default DynamicChart;
