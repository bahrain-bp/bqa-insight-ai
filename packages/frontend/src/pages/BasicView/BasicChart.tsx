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
  const [isUniversityDataLoading, setIsUniversityDataLoading] = useState(true);
  const [isprogramGradesListLoading, setIsprogramGradesListLoading] = useState(false);
  const [currentChart, setCurrentChart] = useState<ChartJsonData | null>(null);
  const [allSchoolCharts, setAllSchoolCharts] = useState<ChartJsonData[]>([]);
  const [allVocationalCharts, setAllVocationalCharts] = useState<ChartJsonData[]>([]);
  const [allUniversityCharts, setAllUniversityCharts] = useState<ChartJsonData[]>([]);
  const [programGradesList, setProgramGradesList] = useState<{ universityName: string; latestJudgment: string }[]>([]);

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
      // Clear the list before starting a new operation
      setProgramGradesList([]);
      const slotValue = chartSlots.AnalyzeSchoolSlot;
      const schoolChart = performFuzzySearch(slotValue, allSchoolCharts, "schoolName");
      if (schoolChart) setCurrentChart(schoolChart);
      else console.error(`No chart found for school: ${chartSlots.AnalyzeSchoolSlot}`);
    } else if (chartSlots.CompareSpecificInstitutesSlot) {
      // Clear the list before starting a new operation
      setProgramGradesList([]);
      const matchedCharts: ChartJsonData[] = []
      chartSlots.CompareSpecificInstitutesSlot.split(",").map((s: string) => {
        const trimmed = s.trim()
        const result = performFuzzySearch(trimmed, allSchoolCharts, "schoolName")
        if (result && (matchedCharts.indexOf(result) === -1)) matchedCharts.push(result);
    });
    const comparisonChart: ChartJsonData = {
      schoolName: "Comparison Chart",
      type: "line", // Change the chart type to line
      data: {
        datasets: matchedCharts.map((chart) => ({
          label: chart.schoolName || "Unnamed School", // Use the school name for the label
          data: chart.data.datasets[0]?.data.map((dataPoint: any) => ({
            x: dataPoint.x || "Unknown Cycle", // X-axis value (e.g., review cycle)
            y: dataPoint.y || null, // Y-axis value (e.g., grade)
          })),
          fill: false, // Line charts typically don't fill below the line
          borderWidth: 2, // Line width
        })),
      },
    };    
      setCurrentChart(comparisonChart);
    } else if (chartSlots.CompareSchoolSlot === "All Government Schools") {
      // Clear the list before starting a new operation
      setProgramGradesList([]);
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
        // Clear the list before starting a new operation
        setProgramGradesList([]);
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
      // Clear the list before starting a new operation
      setProgramGradesList([]);
      const slotValue = chartSlots.AnalyzeVocationalSlot;
      const vocationalChart = performFuzzySearch(slotValue, allVocationalCharts, "schoolName");
      if (vocationalChart) setCurrentChart(vocationalChart);
      else console.error(`No chart found for institute: ${chartSlots.AnalyzeVocationalSlot}`);
  } else if (chartSlots.CompareVocationalSlot) {
    // Clear the list before starting a new operation
    setProgramGradesList([]);
    console.log("Checking compare vocational: " , chartSlots.CompareVocationalSlot)
    const matchedCharts: ChartJsonData[] = []
      chartSlots.CompareVocationalSlot.split(",").map((s: string) => {
        const trimmed = s.trim()
        const result = performFuzzySearch(trimmed, allVocationalCharts, "schoolName")
        if (result && (matchedCharts.indexOf(result) === -1)) matchedCharts.push(result);
      });
      const comparisonChart: ChartJsonData = {
        schoolName: "Comparison Chart", 
        type: "line", 
        data: {
          datasets: matchedCharts.map((chart) => ({
            label: chart.schoolName || "Unnamed Institute", // Label for each line
            data: chart.data.datasets[0]?.data.map((dataPoint: any) => ({
              x: dataPoint.x || "Unknown Cycle", // X-axis value (e.g., review cycle)
              y: dataPoint.y || null, // Y-axis value (e.g., grade)
            })),
          })),
        },
      };
      
      setCurrentChart(comparisonChart);
    } else if (chartSlots.AnalyzeUniversityNameSlot) {
      setProgramGradesList([]);
      const slotValue = chartSlots.AnalyzeUniversityNameSlot.trim().toLowerCase();
      const universityChart = performFuzzySearch(slotValue, allUniversityCharts, "universityName");
      if (universityChart) setCurrentChart(universityChart);
      else console.error(`No chart found for university: ${slotValue}`);
    } else if (chartSlots.ProgramNameSlot) {
      // Clear the list before starting a new operation
      setProgramGradesList([]);
      const slotValue = chartSlots.ProgramNameSlot.trim().toLowerCase();
      const programGrades: { universityName: string; latestJudgment: string }[] = [];
      const gradeCounts = { Confidence: 0, "Limited Confidence": 0, "No Confidence": 0 }; // For chart data
    
      // Set loading state to true
      setIsprogramGradesListLoading(true);
  
      allUniversityCharts.forEach((universityChart) => {
        // Ensure datasets exist and are valid
        const validDatasets = universityChart.data.datasets.filter(
          (dataset) => dataset?.data && Array.isArray(dataset.data)
        );
    
        let latestJudgment: string | null = null;
    
        validDatasets.forEach((dataset) => {
          const sortedData = [...dataset.data].sort((a: any, b: any) =>
            new Date((b as { x: string }).x).getTime() - new Date((a as { x: string }).x).getTime()
          );
    
          for (const review of sortedData) {
            if (
              review &&
              typeof review === "object" &&
              "UnifiedStudyField" in review &&
              "y" in review
            ) {
              const field = (review as { UnifiedStudyField: string }).UnifiedStudyField;
              const grade = (review as { y: number }).y;
    
              if (field.trim().toLowerCase() === slotValue) {
                if (grade === 1) {
                  latestJudgment = "Confidence";
                  gradeCounts.Confidence++;
                } else if (grade === 2) {
                  latestJudgment = "Limited Confidence";
                  gradeCounts["Limited Confidence"]++;
                } else if (grade === 3) {
                  latestJudgment = "No Confidence";
                  gradeCounts["No Confidence"]++;
                }
                break; // Only the latest report for the program is needed
              }
            }
          }
        });
    
        if (latestJudgment) {
          programGrades.push({
            universityName: universityChart.universityName || "Unnamed University",
            latestJudgment, // Only the latest judgment
          });
        }
      });
    
      if (programGrades.length === 0) {
        console.error(`No data found for program: ${slotValue}`);
        return;
      }
    
      // Construct the chart data
      const programComparisonChart: ChartJsonData = {
        universityName: `Analysis of Program: ${chartSlots.ProgramNameSlot}`,
        type: "pie", // Replace with "bar", "line", etc., if needed
        data: {
          labels: Object.keys(gradeCounts),
          datasets: [
            {
              label: `Grade Distribution for Program: ${chartSlots.ProgramNameSlot}`,
              data: Object.values(gradeCounts),
              backgroundColor: ["rgba(102, 156, 86, 1)", "rgba(83, 116, 156, 1)", "rgba(230, 65, 37, 1)"],
            },
          ],
        },
      };
    
      // Update the chart and list states
      setCurrentChart(programComparisonChart); // Render the chart
      setProgramGradesList(programGrades); // Display the list
      setIsprogramGradesListLoading(false); // End loading state
    } else if (chartSlots.CompareUniversityUniSlot) {
      // Clear the list before starting a new operation
      setProgramGradesList([]);
      const programNames = chartSlots.CompareUniversityUniSlot
        .split(",")
        .map((program) => program.trim().toLowerCase());
    
      // Function to calculate weight for grades
      const calculateWeight = (grade: number): number => {
        switch (grade) {
          case 1:
            return 1.0; // Highest weight
          case 2:
            return 0.75;
          case 3:
            return 0.5;
          case 4:
            return 0.25; // Lowest weight
          default:
            return 0; // Handle unexpected grades
        }
      };
    
      // Aggregate grades for comparison
      const datasets = allUniversityCharts.map((universityChart) => {
        const programGrades: { program: string; grade: number; originalGrade: number }[] = [];
    
        universityChart.data.datasets[0]?.data.forEach((review: any) => {
          const programName = review?.UnifiedStudyField?.trim().toLowerCase();
          const grade = review.y;
    
          if (programNames.includes(programName)) {
            programGrades.push({
              program: review.UnifiedStudyField,
              grade: calculateWeight(grade), // Weighted grade
              originalGrade: grade, // Store original grade
            });
          }
        });
    
        // Filter out universities with no matching programs
        if (programGrades.length === 0) return null;
    
        return {
          label: universityChart.universityName || "Unnamed University",
          data: programGrades.map((pg) => ({
            x: pg.program,
            y: pg.grade,
            originalGrade: pg.originalGrade, // Include original grade for tooltip
          })),
        };
      }).filter((dataset) => dataset !== null) as {
        label: string;
        data: { x: string; y: number; originalGrade: number }[];
      }[];
    
      // Ensure we have data to display
      if (datasets.length === 0) {
        console.error(`No data found for programs: ${chartSlots.CompareUniversityUniSlot}`);
        return;
      }
    
      const programComparisonChart: ChartJsonData = {
        universityName: `Comparison of Programs by Grades across Universities`,
        type: "bar", // Bar chart
        data: {
          labels: programNames.map((name) => name.charAt(0).toUpperCase() + name.slice(1)), // Capitalize program names
          datasets: datasets.map((dataset) => ({
            label: dataset.label,
            data: dataset.data.map((d) => d as { x: string | number; y: number; originalGrade: any }), // Ensure proper type
          })),
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: "Programs",
              },
            },
            y: {
              reverse: false, // Ensure Y-axis is not reversed
              title: {
                display: true,
                text: "Grades",
              },
              ticks: {
                min: 0.25, // Lowest weighted grade
                max: 1.0, // Highest weighted grade
                stepSize: 0.25, // Steps for each grade
                callback: (value: number) => {
                  // Map the weighted grades back to original grades
                  switch (value) {
                    case 1.0:
                      return "1"; // Original grade 1
                    case 0.75:
                      return "2"; // Original grade 2
                    case 0.5:
                      return "3"; // Original grade 3
                    case 0.25:
                      return "4"; // Original grade 4
                    default:
                      return ""; // For values outside expected range
                  }
                },
              },
            },
          },
          plugins: {
            title: {
              display: true, // Enable the title
              text: "Comparison of Programs by Grades across Universities", // Graph title text
              font: {
                size: 18,
              },
            },
            tooltip: {
              callbacks: {
                label: function (context: { raw: any; dataset: { label: any } }) {
                  const rawData = context.raw; // Access the raw data
                  const originalGrade = rawData?.originalGrade !== undefined ? rawData.originalGrade : "N/A"; // Access originalGrade
                  const weightedGrade = rawData?.y || "N/A"; // Access weighted grade
                  return `${context.dataset.label}: Original Grade: ${originalGrade}, Weighted Grade: ${weightedGrade}`;
                },
              },
            },
            datalabels: {
              display: false,
            },
          },
        },
      };
    
      setCurrentChart(programComparisonChart);
    } else if (chartSlots.CompareUniversityWprogUniversityNameSlot && chartSlots.CompareUniversityWprogSlot) {
      // Clear the list before starting a new operation
      setProgramGradesList([]);
    console.log("Chart slot university name in compare programs: " + chartSlots.CompareUniversityWprogUniversityNameSlot);
      // Parse university names and program names from slots
      const universityNames = chartSlots.CompareUniversityWprogUniversityNameSlot
        .split(",")
        .map((university) => university.trim().toLowerCase());
      const programNames = chartSlots.CompareUniversityWprogSlot
        .split(",")
        .map((program) => program.trim().toLowerCase());
    
      // Filter data for the specified universities and programs
      const datasets = allUniversityCharts
        .filter((universityChart) =>
          universityNames.includes(universityChart.universityName?.toLowerCase() || "")
        )
        .map((universityChart) => {
          const programGrades: { program: string; grade: number; originalGrade: number }[] = [];
    
          universityChart.data.datasets[0]?.data.forEach((review: any) => {
            const programName = review?.UnifiedStudyField?.trim().toLowerCase();
            const grade = review.y;
    
            // Include only programs specified in CompareUniversityWprogSlot
            if (programNames.includes(programName)) {
              programGrades.push({
                program: review.UnifiedStudyField,
                grade: grade,
                originalGrade: grade, // Store original grade
              });
            }
          });
    
          // Skip universities with no matching programs
          if (programGrades.length === 0) return null;
    
          return {
            label: universityChart.universityName || "Unnamed University",
            data: programGrades.map((pg) => ({
              x: pg.program,
              y: pg.grade,
              originalGrade: pg.originalGrade,
            })),
          };
        })
        .filter((dataset) => dataset !== null) as {
        label: string;
        data: { x: string; y: number; originalGrade: number }[];
      }[];
    
      // Ensure we have data to display
      if (datasets.length === 0) {
        console.error(
          `No data found for universities: ${chartSlots.CompareUniversityWprogUniversityNameSlot} and programs: ${chartSlots.CompareUniversityWprogSlot}`
        );
        return;
      }
    
      const programComparisonChart: ChartJsonData = {
        universityName: `Comparison of Selected Programs by Grades across Universities`,
        type: "bar", // Bar chart
        data: {
          labels: programNames.map((name) => name.charAt(0).toUpperCase() + name.slice(1)), // Capitalize program names
          datasets: datasets.map((dataset) => ({
            label: dataset.label,
            data: dataset.data.map((d) => d as { x: string | number; y: number; originalGrade: any }), // Ensure proper type
          })),
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: "Programs",
              },
            },
            y: {
              reverse: false, // Ensure Y-axis is not reversed
              title: {
                display: true,
                text: "Grades",
              },
              ticks: {
                min: 0.25, // Lowest weighted grade
                max: 1.0, // Highest weighted grade
                stepSize: 0.25, // Steps for each grade
                callback: (value: number) => {
                  // Map the weighted grades back to original grades
                  switch (value) {
                    case 1.0:
                      return "1"; // Original grade 1
                    case 0.75:
                      return "2"; // Original grade 2
                    case 0.5:
                      return "3"; // Original grade 3
                    case 0.25:
                      return "4"; // Original grade 4
                    default:
                      return ""; // For values outside expected range
                  }
                },
              },
            },
          },
          plugins: {
            legend: {
              position: "right", // Move legends to the right
              align: "center", // Align legends vertically
              labels: {
                boxWidth: 20, // Width of the color box
                font: {
                  size: 12, // Font size of legend labels
                },
              },
            },
            title: {
              display: true,
              text: "Comparison of Selected Programs by Grades across Universities", // Graph title
              font: {
                size: 18,
              },
            },
            tooltip: {
              callbacks: {
                label: function (context: { raw: any; dataset: { label: any } }) {
                  const rawData = context.raw;
                  const originalGrade = rawData?.originalGrade !== undefined ? rawData.originalGrade : "N/A"; // Access originalGrade
                  const weightedGrade = rawData?.y || "N/A"; // Access weighted grade
                  return `${context.dataset.label}: Original Grade: ${originalGrade}, Weighted Grade: ${weightedGrade}`;
                },
              },
            },
            datalabels: {
              display: false, // Disable data labels on bars
            },
          },
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
    <div className="flex flex-col items-center">
      <div className="p-5 w-full mx-auto">
        <h2>Charts</h2>
        {(isSchoolDataLoading || isVocationalDataLoading || isUniversityDataLoading) && <p>Loading charts...</p>}
  
        {/* Export Button */}
        {!isSchoolDataLoading && !isVocationalDataLoading && currentChart && (
          <div className="mb-4 flex justify-end">
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
          </div>
        )}
  
        <div id="export-content">
          {!isSchoolDataLoading && !isVocationalDataLoading && !isUniversityDataLoading && currentChart && (
            <div className="flex">
              {/* Chart Section */}
              <div className="w-2/3">
                {currentChart && <DynamicChart jsonData={currentChart} />}
              </div>
  
              {/* List Section */}
              <div className="w-1/3 pl-5">
                {isprogramGradesListLoading ? (
                  <p>Loading program grades...</p>
                ) : (
                  programGradesList.length > 0 && ( // Ensure list and title appear only when data is available
                    <>
                      <h2 style={{ fontWeight: "bold", textDecoration: "underline" }}>
                        Latest Judgment of Program: {chartSlots.ProgramNameSlot}
                      </h2>
                      <ul>
                        {programGradesList.map((item, index) => (
                          <li key={index}>
                            <strong>{item.universityName}</strong>: {item.latestJudgment}
                          </li>
                        ))}
                      </ul>
                    </>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );      
};

export default BasicChart;
