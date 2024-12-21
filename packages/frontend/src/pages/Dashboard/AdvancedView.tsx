import { useState, useEffect, useContext } from "react";
import DynamicChart, { ChartJsonData } from "./dynamicChart";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ChartContext } from "../../components/RouterRoot";

export const ChartHistory = () => {
  const [charts, setCharts] = useState<ChartJsonData[]>([]);
  const { chartJson } = useContext(ChartContext);

  useEffect(() => {
    // Load initial charts from sessionStorage
    const loadCharts = () => {
      try {
        const storedCharts = sessionStorage.getItem("chartHistory");
        if (storedCharts) {
          setCharts(JSON.parse(storedCharts));
        }
      } catch (error) {
        console.error("Error loading charts:", error);
      }
    };

    loadCharts();
  }, []);

  // Update charts when chartJson changes
  useEffect(() => {
    if (chartJson && chartJson.length > 0) {
      const latestChart = chartJson[chartJson.length - 1];

      // Update state with new chart
      setCharts(prevCharts => {
        const newCharts = [latestChart, ...prevCharts]; // Newest chart at the top

        // Update sessionStorage
        try {
          sessionStorage.setItem("chartHistory", JSON.stringify(newCharts));
        } catch (error) {
          console.error("Error saving to sessionStorage:", error);
        }

        return newCharts;
      });
    }
  }, [chartJson]);

  const exportHistoryAsPDF = async () => {
    const historyEl = document.getElementById("chart-history");
    if (historyEl && charts.length > 0) {
      try {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let currentHeight = 0;

        for (const chartEl of Array.from(historyEl.children)) {
          const canvas = await html2canvas(chartEl as HTMLElement, { 
            scale: 2,
            logging: false,
            useCORS: true,
          } as any);
          
          const imgData = canvas.toDataURL("image/png");
          const imgProps = pdf.getImageProperties(imgData);
          const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

          // Check if the current chart fits on the current page
          if (currentHeight + imgHeight > pageHeight) {
            pdf.addPage(); // Start a new page if it doesn't fit
            currentHeight = 0; // Reset current height for the new page
          }

          pdf.addImage(imgData, "PNG", 0, currentHeight, pageWidth, imgHeight);
          currentHeight += imgHeight + 10; // Update height for the next chart
        }

        pdf.save("chart-history.pdf");
      } catch (error) {
        console.error("Error exporting PDF:", error);
      }
    }
  };

  return (
    <div className="p-4">
      {charts.length > 0 ? (
        <>
          <button 
            onClick={exportHistoryAsPDF}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Export History
          </button>
          <div id="chart-history" className="space-y-4">
          {charts.map((chart, idx) => (
            <div 
              key={`chart-${idx}-${Date.now()}`} // Generate a unique key on the fly
              className="p-4 border border-gray-200 rounded shadow-sm"
            >
              <DynamicChart jsonData={chart} />
            </div>
          ))}
          </div>
        </>
      ) : (
        <p className="text-gray-500">No chart history available</p>
      )}
    </div>
  );
};