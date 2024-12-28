import React, { useMemo } from "react";
import { Chart as ChartJS, ChartType, registerables } from "chart.js";
import { Chart } from "react-chartjs-2";

// Register all Chart.js components
ChartJS.register(...registerables);

export interface ChartJsonData {
  schoolName?: string; // For schools
  vocationalName?: string; // For vocational institutes
  schoolType?: string; // For schools (Government, Private)
  options?: object;
  type: ChartType;
  data: {
    labels?: string[]; // Required for pie charts
    datasets: Array<{
      data: Array<{ x: number | string; y: number } | number>; // Allow both formats
      label: string;
      backgroundColor?: string[];
      borderColor?: string[];
    }>;
  };
}

interface DynamicChartProps {
  jsonData: ChartJsonData | string;
}

const DynamicChart: React.FC<DynamicChartProps> = ({ jsonData }) => {
  console.log("DynamicChart jsonData:", jsonData);
  const parsedData: ChartJsonData = useMemo(() => {
    return typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;
  }, [jsonData]);

  // Use default options if none are provided
  const chartOptions = useMemo(() => {
    return (
      parsedData.options || {
        responsive: true,
        plugins: {
          datalabels: {display: false},
          legend: { display: true, position: "top" },
          title: {
            display: true,
            text: "Dynamic Chart",
          },
        },
        scales: parsedData.type !== "pie" ? { // Scales are not used for pie charts
          x: {
            type: "category",
            position: "bottom",
            title: {
              display: true,
              text: "Cycles",
            },
          },
          y: {
            title: {
              display: true,
              text: "Grades",
            },
            reverse: true,
            min: 1,
            max: 4,
            ticks: {
              precision: 0,
            }
          },
        } : undefined,
      }
    );
  }, [parsedData.options, parsedData.type]);
  

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
      const labels = parsedData.data.labels || [];
      const datasets = parsedData.data.datasets.map((dataset) => ({
        label: dataset.label,
        data: dataset.data.map((point) =>
          typeof point === "number" ? point : point.y
        ), // Convert mixed formats to flat `number[]`
        backgroundColor: dataset.backgroundColor || colorPalette.slice(0, labels.length),
      }));
      return { labels, datasets };
    } else {
      // Format for other chart types (line, bar, etc.)
      const colors = [...colorPalette];
      return {
        datasets: parsedData.data.datasets.map((dataset) => {
          const color = colors.pop() || "rgba(51, 118, 204, 1)";
          return {
            ...dataset,
            data: dataset.data.map((point) => 
              typeof point === "number" ? { x: "", y: point } : { x: point.x, y: point.y }
            ), // Ensure all points are in `{ x, y }` format
            backgroundColor: color,
            borderColor: color,
          };
        }),
      };
    }
  }, [parsedData, colorPalette]);
  
  return (
    <Chart
      type={parsedData.type}
      data={formattedData as any} // Cast as any to satisfy Chart.js type requirements
      options={chartOptions}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default DynamicChart;
