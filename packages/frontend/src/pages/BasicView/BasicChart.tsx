import { useContext, useEffect, useState } from "react";
import DynamicChart, { ChartJsonData } from "../Dashboard/dynamicChart";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { LexChartSlotsContext } from "../../components/RouterRoot";
import Fuse from "fuse.js"; // Import Fuse.js for fuzzy searching

const BasicChart = () => {
  const { chartSlots } = useContext(LexChartSlotsContext); // Context for dynamic filtering
  const [isSchoolDataLoading, setIsSchoolDataLoading] = useState(true);
  const [isVocationalDataLoading, setIsVocationalDataLoading] = useState(true);
  const [currentChart, setCurrentChart] = useState<ChartJsonData | null>(null);
  const [allSchoolCharts, setAllSchoolCharts] = useState<ChartJsonData[]>([]);
  const [allVocationalCharts, setAllVocationalCharts] = useState<ChartJsonData[]>([]);

  // Fetch school reviews
  useEffect(() => {
    const fetchSchoolReviews = async () => {
      setIsSchoolDataLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/fetchSchoolReviews`);
        if (!response.ok) throw new Error(`Failed to fetch school reviews: ${response.statusText}`);
        const data = await response.json();
        const reviews = data?.data || [];

        const transformedCharts = reviews.map((school: any): ChartJsonData => ({
          schoolName: school.EnglishSchoolName,
          schoolType: school.SchoolType,
          type: "line",
          data: {
            datasets: [
              {
                data: school.Reviews.map((review: any) => ({
                  x: review.Cycle,
                  y: parseFloat(review.Grade.replace(/[^\d.]/g, "")) || null,
                })),
                label: school.EnglishSchoolName,
              },
            ],
          },
        }));

        setAllSchoolCharts(transformedCharts);
      } catch (error) {
        console.error("Error fetching school reviews:", error);
      } finally {
        setIsSchoolDataLoading(false);
      }
    };

    fetchSchoolReviews();
  }, []);

  // Fetch vocational institute reviews
  useEffect(() => {
    const fetchVocationalReviews = async () => {
      setIsVocationalDataLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/fetchVocationalReviews`);
        if (!response.ok) throw new Error(`Failed to fetch vocational reviews: ${response.statusText}`);
        const data = await response.json();
        const reviews = data?.data || [];

        const transformedCharts = reviews.map((institute: any): ChartJsonData => ({
          schoolName: institute.EnglishInstituteName,
          type: "line",
          data: {
            datasets: [
              {
                data: institute.Reviews.map((review: any) => ({
                  x: review.Cycle,
                  y: parseFloat(review.Grade.replace(/[^\d.]/g, "")) || null,
                })),
                label: institute.EnglishInstituteName,
              },
            ],
          },
        }));

        setAllVocationalCharts(transformedCharts);
      } catch (error) {
        console.error("Error fetching vocational reviews:", error);
      } finally {
        setIsVocationalDataLoading(false);
      }
    };

    fetchVocationalReviews();
  }, []);

  // Perform fuzzy search based on LexSlot for only one name
  const performFuzzySearchForSlot = (slotValue: string, dataset: ChartJsonData[]) => {
    const fuse = new Fuse(dataset, { keys: ["schoolName"], threshold: 0.25 });
    const result = fuse.search(slotValue);
    console.log("Search results for " + slotValue + ": ", result)
    return result.length > 0 ? result[0].item : null;
  };

  // Perform fuzzy search for one or more names
  // const performFuzzySearchForNames = (names: string[], dataset: ChartJsonData[]): ChartJsonData[] => {
  //   const fuse = new Fuse(dataset, { keys: ["schoolName"], threshold: 0.2 });
  //   return names
  //     .flatMap((name) => fuse.search(name).map((result) => result.item))
  //     .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
  // };
  
  // Update current chart based on chart slots
  useEffect(() => {
    if (!chartSlots) return;

    if (chartSlots.AnalyzeSchoolSlot) {
      const slotValue = chartSlots.AnalyzeSchoolSlot;
      const schoolChart = performFuzzySearchForSlot(slotValue, allSchoolCharts);
      if (schoolChart) setCurrentChart(schoolChart);
      else console.error(`No chart found for school: ${chartSlots.AnalyzeSchoolSlot}`);
    } else if (chartSlots.CompareSpecificInstitutesSlot) {
      const matchedCharts: ChartJsonData[] = []
      chartSlots.CompareSpecificInstitutesSlot.split(", ").map((s: string) => {
        const trimmed = s.trim()
        const result = performFuzzySearchForSlot(trimmed, allSchoolCharts)
        if (result) matchedCharts.push(result);
    });
      const comparisonChart: ChartJsonData = {
        schoolName: "Comparison Chart",
        type: "bar",
        data: {
          datasets: matchedCharts.map((chart) => ({
            label: chart.schoolName || "Unnamed School",
            data: chart.data.datasets[0].data,
          })),
        },
      };
      setCurrentChart(comparisonChart);
    } else if (chartSlots.CompareSchoolSlot === "All Government Schools") {
      const governmentSchools = allSchoolCharts.filter(
        (chart) => chart.schoolType === "Government"
      );
      const gradeCounts = { Outstanding: 0, Good: 0, Satisfactory: 0, Inadequate: 0 };
      governmentSchools.forEach((school) => {
        const averageGrade =
          school.data.datasets[0].data.reduce(
            (sum: number, point: any) => sum + (point.y || 0),
            0
          ) / school.data.datasets[0].data.length;
    
        if (averageGrade <= 1) gradeCounts.Outstanding++;
        else if (averageGrade <= 2) gradeCounts.Good++;
        else if (averageGrade <= 3) gradeCounts.Satisfactory++;
        else gradeCounts.Inadequate++;
      });
    
      const comparisonChart: ChartJsonData = {
        schoolName: "All Government Schools",
        type: "pie",
        data: {
          labels: Object.keys(gradeCounts),
          datasets: [
            {
              label: "Government Schools Grade Distribution",
              data: Object.values(gradeCounts),
            },
          ],
        },
      };
    
      setCurrentChart(comparisonChart);
      } else if (chartSlots.CompareSchoolSlot === "All Private Schools") {
        const privateSchools = allSchoolCharts.filter(
          (chart) => chart.schoolType === "Private"
        );
      
        // Grade categories and counts
        const gradeCounts = { Outstanding: 0, Good: 0, Satisfactory: 0, Inadequate: 0 };
        privateSchools.forEach((school) => {
          const averageGrade =
            school.data.datasets[0].data.reduce(
              (sum: number, point: any) => sum + (point.y || 0),
              0
            ) / school.data.datasets[0].data.length;
      
          if (averageGrade <= 1) gradeCounts.Outstanding++;
          else if (averageGrade <= 2) gradeCounts.Good++;
          else if (averageGrade <= 3) gradeCounts.Satisfactory++;
          else gradeCounts.Inadequate++;
        });
      
        const comparisonChart: ChartJsonData = {
          schoolName: "All Private Schools",
          type: "pie",
          data: {
            labels: Object.keys(gradeCounts),
            datasets: [
              {
                label: "Private Schools Grade Distribution",
                data: Object.values(gradeCounts),
              },
            ],
          },
        };
      
        setCurrentChart(comparisonChart);
      } else if (chartSlots.AnalyzeVocationalSlot) {
      const slotValue = chartSlots.AnalyzeVocationalSlot;
      const vocationalChart = performFuzzySearchForSlot(slotValue, allSchoolCharts);

    if (vocationalChart) setCurrentChart(vocationalChart);
    else console.error(`No chart found for institute: ${chartSlots.AnalyzeVocationalSlot}`);
  } else if (chartSlots.CompareVocationalSlot) {
    console.log("Checking compare vocational: " , chartSlots.CompareVocationalSlot)
    const matchedCharts: ChartJsonData[] = []
      chartSlots.CompareVocationalSlot.split(", ").map((s: string) => {
        const trimmed = s.trim()
        const result = performFuzzySearchForSlot(trimmed, allVocationalCharts)
        if (result) matchedCharts.push(result);
      });
      const comparisonChart: ChartJsonData = {
      schoolName: "Comparison Chart",
      type: "bar",
      data: {
        datasets: matchedCharts.map((chart) => ({
          label: chart.schoolName || "Unnamed Institute",
          data: chart.data.datasets[0].data,
        })),
      },
    };
      setCurrentChart(comparisonChart);
    }  
  }, [chartSlots, allSchoolCharts, allVocationalCharts]);

  // Export chart content as PDF
  const exportContentAsPDF = async () => {
    const content = document.getElementById("export-content");
    if (content) {
      try {
        const canvas = await html2canvas(content);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("charts-and-text.pdf");
      } catch (error) {
        console.error("Error exporting content to PDF:", error);
      }
    }
  };
  return (
    <div className="flex flex-col md:flex-row">
      <div className="p-5 w-full md:w-[70%]">
        <h2>Charts</h2>
        {(isSchoolDataLoading || isVocationalDataLoading) && <p>Loading charts...</p>}
        <div id="export-content">
          {!isSchoolDataLoading && !isVocationalDataLoading && currentChart && (
            <div id="current-chart">
              <DynamicChart jsonData={currentChart} />
            </div>
          )}
        </div>
      </div>
      <div className="w-full md:w-[30%] py-4 md:py-20 flex flex-col items-center">
        {!isSchoolDataLoading && !isVocationalDataLoading && currentChart && (
          <button
            onClick={exportContentAsPDF}
            className="bg-lightblue hover:bg-primary"
            style={{
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
              transition: "background-color 0.3s ease",
            }}
          >
            Export as PDF
          </button>
        )}
      </div>
    </div>
  );
};

export default BasicChart;
