import React, {useMemo} from "react";
import {
    Chart as ChartJS,
    ChartType,
    // ChartOptions,
    ChartData,
    registerables
} from 'chart.js';
import {Chart} from 'react-chartjs-2';

// Register all Chart.js components
ChartJS.register(...registerables);

// Define the structure of chart JSON data
export interface ChartJsonData {
    title: string;
    chartType?: ChartType;
    // data: Array<{
    //     school: string;
    //     reviewYear?: string;
    //     year?: number;
    //     score: string | number;
    // }>;
    columns?: string[]; // Column names (e.g., labels for axes or categories)
    data: Array<{ [key: string]: string | number }>; // Row data
}

interface DynamicChartProps {
    jsonData: string | ChartJsonData; // Props must include chart data as JSON or a parsed object
}

// function generateRandomColor(alpha = 1) {
//     const r = Math.floor(Math.random() * 256); // Random red value
//     const g = Math.floor(Math.random() * 256); // Random green value
//     const b = Math.floor(Math.random() * 256); // Random blue value
//     return `rgba(${r},${g},${b},${alpha})`; // Combine with alpha transparency
// }

const processChartData = (rawData: { data: any[]; }) => {
    if (!rawData || !rawData.data || rawData.data.length === 0) return null;
  
    const allKeys = Object.keys(rawData.data[0]);
  
    // Find potential metric columns
    const metricColumns = allKeys.filter((key) => {
      const isTimeRelated = ["year", "reviewCycle"].includes(key); // Forced as metric
      const hasNonNumericValues = rawData.data.some(
        (item) => isNaN(parseFloat(item[key])) || typeof item[key] === "string"
      );
      return isTimeRelated || hasNonNumericValues;
    });
  
    // Find value columns (numeric data)
    const valueColumns = allKeys.filter(
      (key) =>
        !metricColumns.includes(key) &&
        rawData.data.every((item) => !isNaN(parseFloat(item[key])))
    );
  
    const primaryMetric = metricColumns[0];
    const secondaryMetric = metricColumns[1];
  
    const labels = [...new Set(rawData.data.map((item) => item[primaryMetric]))];
  
    const datasets: { label: string; data: (number | null)[]; backgroundColor: string; borderColor: string; }[] = [];
    if (secondaryMetric) {
      const uniqueSecondaryValues = [
        ...new Set(rawData.data.map((item) => item[secondaryMetric])),
      ];
  
      uniqueSecondaryValues.forEach((secondaryValue, index) => {
        valueColumns.forEach((valueColumn) => {
          const data = labels.map((label) => {
            const matchingItems = rawData.data.filter(
              (item) =>
                item[primaryMetric] === label &&
                item[secondaryMetric] === secondaryValue
            );
            const values = matchingItems.map((item) =>
              parseFloat(item[valueColumn])
            );
            return values.length > 0 ? values[0] : null;
          });
  
          datasets.push({
            label: `${secondaryValue} - ${valueColumn}`,
            data: data,
            backgroundColor: `rgba(${50 + index * 30}, ${
              100 + index * 20
            }, 255, 0.5)`,
            borderColor: `rgba(${50 + index * 30}, ${100 + index * 20}, 255, 1)`,
          });
        });
      });
    } else {
      valueColumns.forEach((valueColumn, index) => {
        const data = labels.map((label) => {
          const matchingItems = rawData.data.filter(
            (item) => item[primaryMetric] === label
          );
          const values = matchingItems.map((item) =>
            parseFloat(item[valueColumn])
          );
          return values.length > 0 ? values[0] : null;
        });
  
        datasets.push({
          label: valueColumn,
          data: data,
          backgroundColor: `rgba(${50 + index * 30}, ${100 + index * 20}, 255, 0.5)`,
          borderColor: `rgba(${50 + index * 30}, ${100 + index * 20}, 255, 1)`,
        });
      });
    }
  
    return { labels, datasets };
  };
  
const DynamicChart: React.FC<DynamicChartProps> = ({jsonData}) => {
    // Parse JSON and extract columns
    const parsedData: ChartJsonData = useMemo(() => {
        //const data = 
        return typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        /*
        // Automatically extract columns from the first data item
        const extractedColumns = data.data.length > 0 
            ? Object.keys(data.data[0])
            : [];

        return {
            ...data,
            columns: extractedColumns // Override or set columns based on data structure
        };
        */
    }, [jsonData]);

    const processedData = useMemo(() => processChartData(parsedData), [parsedData]);

    // Early return if no data
    if (!processedData) {
        return <p>No data available to generate chart.</p>;
    }

    //var chartData: ChartData | undefined;
    /*
    const {labels, scores} = useMemo(() => {
        const labels = parsedData.data.map(item => item.reviewYear || item.school || '');
        const scores = parsedData.data.map(item => parseFloat(item.score.toString()));
        return {labels, scores};
    }, [parsedData]);
    */

    // Dynamically compute labels and datasets based on extracted columns
    // const { labels, datasets } = useMemo(() => {
    //     const firstColumn = parsedData.columns![0]; // Use first column for labels
    //     const numericColumns = parsedData.columns!.filter(column => {
    //         // Check if the column contains numeric values
    //         return parsedData.data.some(row => 
    //             typeof row[column] === 'number' || 
    //             !isNaN(parseFloat(row[column] as string))
    //         );
    //     });

        // Get unique labels from the first column
        // const labels = [...new Set(parsedData.data.map(row => row[firstColumn] as string))];

        // Create datasets for each numeric column
        // const datasets = numericColumns.map((column, index) => {
        //     const data = labels.map(label => {
        //         const matchingRows = parsedData.data.filter(row =>
        //             row[firstColumn] === label
        //         );
                
        //         const values = matchingRows.map(row => 
        //             typeof row[column] === "string"
        //                 ? parseFloat(row[column] as string)
        //                 : (row[column] as number)
        //         );
        //         return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        //     });

            // return {
                // Style the dataset dynamically based on index and chart type
    //             label: column, // Use the column name as the dataset label
    //             data,
    //             backgroundColor: `rgba(${50 + index * 50}, ${100 + index * 50}, ${200 - index * 50}, 0.5)`,
    //             borderColor: `rgba(${50 + index * 50}, ${100 + index * 50}, ${200 - index * 50}, 0.8)`,
    //             tension: parsedData.chartType === "line" ? 0.3 : 0, // Apply tension for line charts
    //         };
    //     });

    //     return { labels, datasets };
    // }, [parsedData]);

    const { labels, datasets } = processedData;

    // Prepare chart data
    /*
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
    */

    // Prepare the data structure for Chart.js
    const chartData: ChartData = useMemo(
        () => ({
            labels,
            datasets,
        }),
        [labels, datasets]
    );

    // Default to a line chart if no type is specified
    const chartType: ChartType = parsedData.chartType as ChartType || 'line';

    // Configure chart options, including responsiveness, titles, and axes
    const chartOptions = {
        responsive: true,
        // maintainAspectRatio: chartType === "pie" ? false : true,
        plugins: {
            legend: {
                display: true,
                position: 'top'as const,
            },
            title: {
                display: true,
                text: parsedData.title || 'Dynamic Chart',
            },
        },
        scales: parsedData.chartType !== 'pie' ? {
            x: {
                title: {
                    display: true,
                    text: parsedData.columns![0],
                },
            },
            y: {
                beginAtZero: true, // Ensure the y-axis does not start at 0
                // min: 1, // Set the minimum value to 1
                ticks: {
                    stepSize: 1, // Ensure the steps are integer values
                }
            }
        } : undefined
    };

    if (chartData === undefined) {
        return <p>No data available to generate chart.</p>;
    }
    return (
      <div style={{
        maxWidth: '50vw', // Maximum width of 50% of the viewport width
        maxHeight: '50vh', // Maximum height of 50% of the viewport height
        margin: '20px auto', // Center the chart and add vertical margin
        display: 'flex', // Use flexbox to center the chart
        justifyContent: 'center', // Center horizontally
        alignItems: 'center', // Center vertically
    }}>
        <Chart
            type={chartType} // Specify chart type
            data={chartData} // Provide chart data
            options={{
                ...chartOptions,
                maintainAspectRatio: false, // Allow chart to resize based on container
            }} 
            style={{ width: '100%', height: '100%' }} // Ensure chart uses full container size
        />
    </div>
    );
};

export default DynamicChart;
