import { useContext, useEffect, useState } from "react";
import DynamicChart, { ChartJsonData } from "../Dashboard/dynamicChart";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ChartContext, LexChartSlotsContext } from "../../components/RouterRoot";
import { Chart } from "react-chartjs-2";

const BasicChart = () => {
    const { chartJson } = useContext(ChartContext);
  const {chartSlots} = useContext(LexChartSlotsContext)
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentChart, setCurrentChart] = useState<ChartJsonData | null>(null);

  useEffect(() => {
        console.log("Lex Slots updated: ", chartSlots)
    }, [chartSlots])
  
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
  
        const pageHeight = pdf.internal.pageSize.getHeight();
        if (pdfHeight > pageHeight) {
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
        <div style={{ padding: "20px", width: "70%" }}>
      <h2>Charts</h2>
      {isLoading && <p>Loading charts...</p>}
        <br></br>
      <div id="export-content">
        {/* Intermediate Schools Performance Chart */}
        {/* <div className="chart-container" style={{ marginBottom: "2rem" }}>
          <h3>Intermediate Schools Performance Over Time</h3>
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
        </div> */}

        {/* Latest Performance Comparison Bar Chart */}
        <div className="chart-container" style={{ marginBottom: "2rem" }}>
          <h3>Latest School Performance Scores</h3>
          <Chart
            type="bar"
            data={{
              datasets: [
                {
                        label: "Primary Schools",
                        data: [
                          {x: "Al Andalus", y: 4},
                          {x: "Al Noor", y: 4},
                          {x: "Al Wafa", y: 3},
                          {x: "Al Hedaya", y: 2},
                          {x: "Al Nahda", y: 3}
                        ],
                        backgroundColor: [
                          //Blue shades
                          "rgba(83, 116, 156, 1)",
                          "rgba(55, 93, 138, 1)",
                          "rgba(28, 70, 121, 1)",
                          "rgba(22, 56, 97, 1)",
                          "rgba(17, 42, 73, 1)",

                          //Green shades
                          "rgba(102, 156, 86, 1)",
                          "rgba(79, 139, 62, 1)",
                          "rgba(57, 123, 38, 1)",
                          "rgba(46, 98, 30, 1)",
                          "rgba(34, 74, 23, 1)"
                        ],
                        borderColor: "#111177"
                      }
              ],
            }}
            options={{
              scales: {
                y: {
                  type: "linear",
                  min: 1,
                  max: 4,
                  ticks: {
                    stepSize: 1
                  }
                }
              }
            }}
          />
        </div>

        {/* Performance vs Student Count Scatter Chart */}
        {/* <div className="chart-container" style={{ marginBottom: "2rem" }}>
          <h3>Performance vs Student Count</h3>
          <Chart
            type="scatter"
            data={{
              datasets: [
                {
                  label: "Primary Schools",
                  data: [
                    {x: 250, y: 2},
                    {x: 420, y: 3},
                    {x: 380, y: 3},
                    {x: 520, y: 4},
                    {x: 320, y: 2}
                  ],
                  backgroundColor: "#111177",
                  borderColor: "#111177"
                },
                {
                  label: "Secondary Schools",
                  data: [
                    {x: 450, y: 3},
                    {x: 580, y: 4},
                    {x: 620, y: 3},
                    {x: 480, y: 2},
                    {x: 550, y: 3}
                  ],
                  backgroundColor: "#771111",
                  borderColor: "#771111"
                }
              ]
            }}
          />
        </div> */}

        {/* Multi-Year Grade Performance Chart */}
        {/* <div className="chart-container" style={{ marginBottom: "2rem" }}>
          <h3>Multi-Year Grade Performance</h3>
          <Chart
            type="pie"
            data={{
              labels: ['Grade 1', 'Grade 2', 'Grade 3'],
              datasets: [{
                data: [4, 3, 3], // Latest values for each grade
                backgroundColor: [
                  "#111177",
                  "#771111",
                  "#117711"
                ]
              }]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top'
                }
              }
            }}
          />
        </div> */}

        {!isLoading && chartJson.length > 0 && (
          <div id="current-chart">
            {currentChart ? (
              <DynamicChart jsonData={currentChart} />
            ) : <p>No chart to display</p>}
          </div>
        )}
      </div>

      {!isLoading && chartJson.length === 0 && (
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
}

export default BasicChart;
