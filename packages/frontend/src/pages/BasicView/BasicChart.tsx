import { useContext, useEffect, useState } from "react";
import DynamicChart, { ChartJsonData } from "./dynamicChart";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { LexChartSlotsContext } from "../../components/RouterRoot";
import Fuse from "fuse.js"; // Import Fuse.js for fuzzy searching

const BasicChart = () => {
  const { chartSlots } = useContext(LexChartSlotsContext); // Context for dynamic filtering
  const [isSchoolDataLoading, setIsSchoolDataLoading] = useState(true);
  const [isVocationalDataLoading, setIsVocationalDataLoading] = useState(true);
  const [isUniversityDataLoading, setIsUniversityDataLoading] = useState(true);
  const [currentChart, setCurrentChart] = useState<ChartJsonData | null>(null);
  const [allSchoolCharts, setAllSchoolCharts] = useState<ChartJsonData[]>([]);
  const [allVocationalCharts, setAllVocationalCharts] = useState<ChartJsonData[]>([]);
  const [allUniversityCharts, setAllUniversityCharts] = useState<ChartJsonData[]>([]);

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

  // Fetch university reviews
  useEffect(() => {
    const fetchUniversityReviews = async () => {
      setIsUniversityDataLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/fetchUniversityReviews`);
        if (!response.ok) throw new Error(`Failed to fetch university reviews: ${response.statusText}`);
        const data = await response.json();
        const reviews = data?.data || [];

        // Transform the reviews into chart data
        const transformedCharts = reviews.map((university: any): ChartJsonData => {
          const latestReview = university.Reviews.sort((a: any, b: any) =>
            new Date(b.Cycle).getTime() - new Date(a.Cycle).getTime()
          )[0];

          return {
            universityName: university.InstitutionName,
            type: "line",
            data: {
              datasets: latestReview
                ? [
                    {
                      data: university.Reviews.map((review: any) => ({
                        x: review.Cycle,
                        y: review.Judgement === "Confidence" ? 1 : review.Judgement === "Limited Confidence" ? 2 : 3,
                        UnifiedStudyField: review.UnifiedStudyField,
                      })),
                      label: university.InstitutionName,
                    },
                  ]
                : [],
            },
          };
        });

        setAllUniversityCharts(transformedCharts);
      } catch (error) {
        console.error("Error fetching university reviews:", error);
      } finally {
        setIsUniversityDataLoading(false);
      }
    };

    fetchUniversityReviews();
  }, []);
  
  // Perform fuzzy search based on LexSlot for only one name
  const performFuzzySearch = (slotValue: string, dataset: ChartJsonData[], searchKey: "schoolName" | "universityName") => {
    const fuse = new Fuse(dataset, { keys: [searchKey], threshold: 0.25 });
    const result = fuse.search(slotValue);
    console.log("Search results for " + slotValue + ": ", result);
    return result.length > 0 ? result[0].item as ChartJsonData : null;
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
      const schoolChart = performFuzzySearch(slotValue, allSchoolCharts, "schoolName");
      if (schoolChart) setCurrentChart(schoolChart);
      else console.error(`No chart found for school: ${chartSlots.AnalyzeSchoolSlot}`);
    } else if (chartSlots.CompareSpecificInstitutesSlot) {
      const matchedCharts: ChartJsonData[] = []
      chartSlots.CompareSpecificInstitutesSlot.split(",").map((s: string) => {
        const trimmed = s.trim()
        const result = performFuzzySearch(trimmed, allSchoolCharts, "schoolName")
        if (result && (matchedCharts.indexOf(result) === -1)) matchedCharts.push(result);
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
      const vocationalChart = performFuzzySearch(slotValue, allSchoolCharts, "schoolName");

    if (vocationalChart) setCurrentChart(vocationalChart);
    else console.error(`No chart found for institute: ${chartSlots.AnalyzeVocationalSlot}`);
  } else if (chartSlots.CompareVocationalSlot) {
    console.log("Checking compare vocational: " , chartSlots.CompareVocationalSlot)
    const matchedCharts: ChartJsonData[] = []
      chartSlots.CompareVocationalSlot.split(",").map((s: string) => {
        const trimmed = s.trim()
        const result = performFuzzySearch(trimmed, allVocationalCharts, "schoolName")
        if (result && (matchedCharts.indexOf(result) === -1)) matchedCharts.push(result);
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
    // Inside the useEffect handling chartSlots
    else if (chartSlots.UniNameSlot) {
      const slotValue = chartSlots.UniNameSlot.trim().toLowerCase();
      const universityChart = performFuzzySearch(slotValue, allUniversityCharts, "universityName");
  
      if (universityChart) {
        setCurrentChart(universityChart);
      } else {
        console.error(`No chart found for university: ${slotValue}`);
      }
    } else if (chartSlots.ProgramNameSlot) {
      const slotValue = chartSlots.ProgramNameSlot.trim().toLowerCase();
      const gradeCounts = { Confidence: 0, "Limited Confidence": 0, "No Confidence": 0 };
    
      allUniversityCharts.forEach((universityChart) => {
        universityChart.data.datasets.forEach((dataset) => {
          dataset.data.forEach((review: any) => {
            if (
              review &&
              review.UnifiedStudyField &&
              review.UnifiedStudyField.trim().toLowerCase() === slotValue
            ) {
              if (review.y === 1) {
                gradeCounts.Confidence++;
              } else if (review.y === 2) {
                gradeCounts["Limited Confidence"]++;
              } else if (review.y === 3) {
                gradeCounts["No Confidence"]++;
              }
            }
          });
        });
      });
    
      const totalGrades = Object.values(gradeCounts).reduce((sum, count) => sum + count, 0);
      if (totalGrades === 0) {
        console.error(`No data found for program: ${slotValue}`);
        return;
      }
    
      const programComparisonChart: ChartJsonData = {
        universityName: `Analysis of Program: ${chartSlots.ProgramNameSlot}`,
        type: "pie",
        data: {
          labels: Object.keys(gradeCounts),
          datasets: [
            {
              label: `Grade Distribution for Program: ${chartSlots.ProgramNameSlot}`,
              data: Object.values(gradeCounts),
              backgroundColor: ["rgba(102, 156, 86, 1)", "rgba(83, 116, 156, 1)", "rgba(230, 65, 37, 1)"]
            },
          ],
        },
      };
    
      setCurrentChart(programComparisonChart);
    }    
  }, [chartSlots, allSchoolCharts, allVocationalCharts, allUniversityCharts]);

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
        {(isSchoolDataLoading || isVocationalDataLoading || isUniversityDataLoading) && <p>Loading charts...</p>}
        <div id="export-content">
          {!isSchoolDataLoading && !isVocationalDataLoading && !isUniversityDataLoading && currentChart && (
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
