import { ChartContext } from "../../components/RouterRoot";
import DynamicChart, { ChartJsonData } from "./dynamicChart";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import React, { useContext, useEffect, useState } from "react";
import { Chart } from "react-chartjs-2";

const ECommerce: React.FC = () => {
  const { chartJson } = useContext(ChartContext);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentChart, setCurrentChart] = useState<ChartJsonData | null>(null);
  
  useEffect(() => {
    if (chartJson && chartJson.length > 0) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [chartJson]);

  useEffect(() => {
    if (chartJson.length) {
      const latestChart = chartJson[chartJson.length - 1];
      setCurrentChart(latestChart);

      // Get existing history and update with new chart
      try {
        const history = JSON.parse(sessionStorage.getItem('chartHistory') || '[]');
        const updatedHistory = [...history, latestChart];
        sessionStorage.setItem('chartHistory', JSON.stringify(updatedHistory));
      } catch (error) {
        console.error("Error updating chart history:", error);
      }
    }
  }, [chartJson]);

  const exportContentAsPDF = async () => {
    const content = document.getElementById("export-content");
    if (content) {
      try {
        const canvas = await html2canvas(content, { scale: 2 } as any);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
        // Check if the content height exceeds the page height
        const pageHeight = pdf.internal.pageSize.getHeight();
        if (pdfHeight > pageHeight) {
          // Optionally, you can scale down or adjust the content
          const scaleFactor = pageHeight / pdfHeight;
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth * scaleFactor, pdfHeight * scaleFactor);
        } else {
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        }
        pdf.save("charts-and-text.pdf");
      } catch (error) {
        console.error("Error exporting content to PDF:", error);
      }
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Charts Generated on Home Page</h2>
       {isLoading && <p>Loading charts...</p>} {/* Loading message */}
       {!isLoading && chartJson.length === 0 && <p>No charts available</p>} {/* Message for no charts */}

      <div id="export-content">
        <Chart
          type="line"
          data={{
            datasets: [
              {
                label: "Jidhafs Intermediate Boys School",
                data: [
                  {x: 2010, y: 2},
                  {x: 2012, y: 2},
                  {x: 2016, y: 2},
                  {x: 2018, y: 3},
                  {x: 2024, y: 3},
                ],
                borderColor: "#111177",
                fill: false,
              },
              {
                label: "Al Sehlah Intermediate Boys School",
                data: [
                  {x: 2011, y: 3},
                  {x: 2014, y: 3},
                  {x: 2016, y: 4},
                  {x: 2019, y: 3},
                  {x: 2023, y: 2},
                ],
                borderColor: "#771111",
                fill: false,
              },
              {
                label: "Hamad Town Intermediate Boys School",
                data: [
                  {x: 2013, y: 4},
                  {x: 2018, y: 3},
                  {x: 2021, y: 3},
                  {x: 2024, y: 4},
                ],
                borderColor: "#117711",
                fill: false,
              },
            ]
          }}
          options={{
            scales: {
              x: {
                type: "linear",

              },
              y: {
                type: "linear",
                min: 1,
                max: 4,
                reverse: true,
                ticks: {
                  stepSize: 1,
                },
              }
            }
          }}
        />
        {!isLoading && chartJson.length > 0 && (
          <div id="current-chart">
            {currentChart ? (
              <DynamicChart jsonData={currentChart} />
            ) : <p>No chart to display</p>} {/* Message if currentChart is null */}
          </div>
        )}
      </div>

      {!isLoading && chartJson.length > 0 && (
        <button
          onClick={exportContentAsPDF}
          style={{
            backgroundColor: '#1d4ed8',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1d4ed8';
          }}
        >
          Export as PDF
        </button>
      )}
    </div>
  );
};

export default ECommerce;
