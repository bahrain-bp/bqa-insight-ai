import { ChartContext } from "../../components/RouterRoot";
import DynamicChart, { ChartJsonData } from "./dynamicChart";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import React, { useContext, useEffect, useState } from "react";

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