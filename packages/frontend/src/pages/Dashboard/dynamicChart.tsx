import React, { useMemo } from "react";
import { Chart as ChartJS, ChartType, registerables } from "chart.js";
import { Chart } from "react-chartjs-2";

// Register all Chart.js components
ChartJS.register(...registerables);

export interface ChartJsonData {
  type: ChartType;
  data: {
    datasets: Array<{
      label: string;
      data: Array<{ x: string | number; y: number }>;
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      fill?: boolean;
      tension?: number;
      hoverOffset?: number;
    }>;
  };
  options?: object;
}

interface DynamicChartProps {
  jsonData: ChartJsonData | string;
}

const DynamicChart: React.FC<DynamicChartProps> = ({ jsonData }) => {
  const parsedData: ChartJsonData = useMemo(() => {
    return typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;
  }, [jsonData]);

  // Use default options if none are provided
  const chartOptions = useMemo(() => {
    return (
      parsedData.options || {
        responsive: true,
        plugins: {
          legend: { display: true, position: "top" },
          title: {
            display: true,
            text: "Dynamic Chart",
          },
        },
        scales: {
          x: {
            type: "linear",
            position: "bottom",
          },
        },
      }
    );
  }, [parsedData.options]);

  const colorPalette : string[] = 
  [
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

    "rgba(184, 108, 41, 1)", // Orange shade 3
    "rgba(192, 140, 48, 1)", // Yellow shade 3
    "rgba(184, 51, 29, 1)", // Red shade 3
    "rgba(28, 70, 121, 1)", // Blue shade 3
    "rgba(57, 123, 38, 1)", // Green shade 3
    

    "rgba(207, 122, 47, 1)", // Orange shade 2
    "rgba(218, 163, 56, 1)", // Yellow shade 2
    "rgba(207, 58, 33, 1)", // Red shade 2
    "rgba(79, 139, 62, 1)", // Green shade 2
    "rgba(55, 93, 138, 1)", // Blue shade 2

    "rgba(230, 136, 53, 1)", // Orange shade 1
    "rgba(243, 187, 65, 1)", // Yellow shade 1
    "rgba(230, 65, 37, 1)", // Red shade 1
    "rgba(102, 156, 86, 1)", // Green shade 1
    "rgba(83, 116, 156, 1)", // Blue shade 1
  ]

  // Format datasets to ensure they match the new structure
  const formattedData = useMemo(() => {
  const colors = [...colorPalette]; // Create a copy of the color palette
  return {
    datasets: parsedData.data.datasets.map((dataset) => {
      const color = colors.pop() || "rgba(51, 118, 204, 1)"; // Use and remove a color from the end
      return {
        ...dataset,
        data: dataset.data.map((point) => ({
          x: typeof point.x === "string" ? parseFloat(point.x) : point.x,
          y: point.y,
        })),
        backgroundColor: color,
        borderColor: color,
      };
    }),
  };
}, [parsedData.data]);


  return (
    // <div style={{
    //   maxWidth: '50vw', 
    //   maxHeight: '50vh',
    //   margin: '20px auto',
    //   display: 'flex',
    //   justifyContent: 'center',
    //   alignItems: 'center', 
    // }}>
    <Chart
      type={parsedData.type}
      data={formattedData}
      options={chartOptions}
      style={{ width: "100%", height: "100%" }}
    />
    // </div>
  );
};

export default DynamicChart;
