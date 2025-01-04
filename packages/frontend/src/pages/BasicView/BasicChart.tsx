import { useContext, useEffect, useState } from "react";
import DynamicChart, { ChartJsonData } from "../Dashboard/dynamicChart";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { LexChartSlotsContext } from "../../components/RouterRoot";
import Fuse from "fuse.js"; // Import Fuse.js for fuzzy searching
import LogoIcon from '../../images/BQA.png';

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

    setCurrentChart(null);
    setProgramGradesList([]);

    if (chartSlots.AnalyzeSchoolSlot) {
      // Clear the list before starting a new operation
      setProgramGradesList([]);
      const slotValue = chartSlots.AnalyzeSchoolSlot;
      const schoolChart = performFuzzySearch(slotValue, allSchoolCharts, "schoolName");
      if (schoolChart) setCurrentChart(schoolChart);
      else console.error(`No chart found for school: ${chartSlots.AnalyzeSchoolSlot}`);
    } else if (chartSlots.CompareSpecificInstitutesSlot) {
      setProgramGradesList([]);
      const matchedCharts: ChartJsonData[] = [];
      const allCycles = new Set<string>(); // Collect all unique cycles
    
      chartSlots.CompareSpecificInstitutesSlot.split(",").map((s: string) => {
        const trimmed = s.trim();
        const result = performFuzzySearch(trimmed, allSchoolCharts, "schoolName");
        if (result && matchedCharts.indexOf(result) === -1) {
          matchedCharts.push(result);
    
          // Collect all cycles from the current chart
          result.data.datasets[0]?.data.forEach((dataPoint: any) => {
            if (typeof dataPoint === "object" && dataPoint.x) {
              allCycles.add(dataPoint.x);
            }
          });
        }
      });
    
      const comparisonChart: ChartJsonData = {
        schoolName: "Comparison Chart",
        type: "line",
        data: {
          datasets: matchedCharts.map((chart) => ({
            label: chart.schoolName || "Unnamed School",
            data: Array.from(allCycles).sort().map((cycle) => {
              // Find the data point for the current cycle
              const dataPoint = chart.data.datasets[0]?.data.find(
                (dp: any) => typeof dp === "object" && dp.x === cycle
              );
              return {
                x: cycle, // X-axis value (e.g., review cycle)
                y: dataPoint && typeof dataPoint === "object" ? dataPoint.y : NaN, // Use NaN for missing values
              };
            }),
            fill: false,
            borderWidth: 2,
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
        options: {
          plugins: {
            title: {
              display: true,
              text: "Overview of Judgments/Grades of All Government Schools", // Main title
            },
            subtitle: {
              display: true,
              text: "This chart illustrates the proportion/count of government schools rated as Outstanding, Good, Satisfactory, or Inadequate, based on the latest review cycle reports.", // Description
            },
            datalabels: {
              display: false,
            }
          },
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
          options: {
            plugins: {
              title: {
                display: true,
                text: "Overview of Judgments/Grades of All Private Schools", // Main title
              },
              subtitle: {
                display: true,
                text: "This chart illustrates the proportion/count of private schools rated as Outstanding, Good, Satisfactory, or Inadequate, based on the latest review cycle reports.", // Description
              },
              datalabels: {
                display: false,
              }
            },
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
    setProgramGradesList([]);
      const matchedCharts: ChartJsonData[] = [];
      const allCycles = new Set<string>(); // Collect all unique cycles
    
      chartSlots.CompareVocationalSlot.split(",").map((s: string) => {
        const trimmed = s.trim();
        const result = performFuzzySearch(trimmed, allVocationalCharts, "schoolName");
        if (result && matchedCharts.indexOf(result) === -1) {
          matchedCharts.push(result);
    
          // Collect all cycles from the current chart
          result.data.datasets[0]?.data.forEach((dataPoint: any) => {
            if (typeof dataPoint === "object" && dataPoint.x) {
              allCycles.add(dataPoint.x);
            }
          });
        }
      });
    
      const comparisonChart: ChartJsonData = {
        schoolName: "Comparison Chart",
        type: "line",
        data: {
          datasets: matchedCharts.map((chart) => ({
            label: chart.schoolName || "Unnamed Vocational Training Center",
            data: Array.from(allCycles).sort().map((cycle) => {
              // Find the data point for the current cycle
              const dataPoint = chart.data.datasets[0]?.data.find(
                (dp: any) => typeof dp === "object" && dp.x === cycle
              );
              return {
                x: cycle, // X-axis value (e.g., review cycle)
                y: dataPoint && typeof dataPoint === "object" ? dataPoint.y : NaN, // Use NaN for missing values
              };
            }),
            fill: false,
            borderWidth: 2,
          })),
        },
      };
      setCurrentChart(comparisonChart);
    } else if (chartSlots.AnalyzeUniversityNameSlot) {
      setProgramGradesList([]);
      const slotValue = chartSlots.AnalyzeUniversityNameSlot.trim().toLowerCase();
      const universityChart = performFuzzySearch(slotValue, allUniversityCharts, "universityName");
      if (universityChart) {
        // Modify the Y-axis to always display 1, 2, and 3
        const modifiedChart = {
          ...universityChart,
          options: {
            ...universityChart.options,
            scales: {
              ...((universityChart.options as any)?.scales || {}), // Fallback to empty object if scales is undefined
              y: {
                title: {
                  display: true,
                  text: "Judgement",
                },
                ...((universityChart.options as any)?.scales?.y || {}), // Fallback to empty object if y is undefined
                min: 0, // Start at 0
                max: 4, // End at 4
                reverse: true, // Reverse the Y-axis
                ticks: {
                  stepSize: 1, // Step by 1
                  callback: (value: number) => {
                    switch (value) {
                      case 1: return "Confidence";
                      case 2: return "Limited Confidence";
                      case 3: return "No Confidence";
                      default: return ""; // Empty label for other values
                    }
                  },
                },
              },
            },
            plugins: {
              ...((universityChart.options as any)?.plugins || {}), // Preserve existing plugins
              datalabels: {
                display: false, // Disable datalabels
              },
              tooltip: {
                callbacks: {
                  label: function (context: { raw: { y: any }; dataset: { label: any } }) {
                    console.log("Tooltip context:", context);
                    console.log("Raw data:", context.raw);
    
                    const university = context.dataset.label;
                    const weightedGrade = context.raw.y;
    
                    // Determine the confidence level based on the weighted grade
                    let confidenceLevel = "";
                    if (weightedGrade === 1) {
                      confidenceLevel = "Confidence";
                    } else if (weightedGrade === 2) {
                      confidenceLevel = "Limited Confidence";
                    } else if (weightedGrade === 3) {
                      confidenceLevel = "No Confidence";
                    } else {
                      confidenceLevel = "Unknown Confidence";
                    }
    
                    return `${university} - Judgement: ${confidenceLevel}`;
                  },
                },
              },
            },
          },
        };
        setCurrentChart(modifiedChart);
      } else {
        console.error(`No chart found for university: ${slotValue}`);
      }    
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
    
      // Extract university names from the slot
      const universityNames = chartSlots.CompareUniversityUniSlot
        .split(",")
        .map((name) => name.trim());
    
      console.log("University Names for Comparison:", universityNames);
    
      // Function to calculate weight for grades
      const calculateWeight = (grade: number): number => {
        switch (grade) {
          case 1: return 0.75;
          case 2: return 0.5;
          case 3: return 0.25;
          default: return 0;
        }
      };
    
      // Find matching universities using fuzzy search
      const matchedUniversities = universityNames
        .map(name => performFuzzySearch(name, allUniversityCharts, "universityName"))
        .filter((univ): univ is ChartJsonData => univ !== null);
    
      // Prepare data for the chart
      const programGradesMap: { [program: string]: { university: string; grade: number; originalGrade: number }[] } = {};
    
      matchedUniversities.forEach((universityChart) => {
        // Sort reviews to get the latest first
        const sortedReviews = [...(universityChart.data.datasets[0]?.data || [])].sort(
          (a: any, b: any) => new Date(b.x).getTime() - new Date(a.x).getTime()
        );
      
        console.log(`Processing university: ${universityChart.universityName}`);
        console.log(`Sorted reviews:`, sortedReviews);
      
        // Keep track of processed programs to ensure we only use the latest review
        const processedPrograms = new Set<string>();
      
        // Process reviews
        sortedReviews.forEach((review: any) => {
          console.log(`Review:`, review);
          const programName = review?.UnifiedStudyField?.trim();
          const grade = review?.y;
      
          if (!programName || processedPrograms.has(programName)) {
            console.log(`Skipping program: ${programName}`);
            return;
          }
      
          processedPrograms.add(programName);
      
          if (!programGradesMap[programName]) {
            programGradesMap[programName] = [];
          }
      
          console.log(`Adding program: ${programName}, Grade: ${grade}`);
          programGradesMap[programName].push({
            university: universityChart.universityName || "Unnamed University",
            grade: calculateWeight(grade),
            originalGrade: grade,
          });
        });
      });
      
      // Verify programGradesMap structure
      console.log(`Program Grades Map:`, programGradesMap);      
    
      // Get unique program names
      const programNames = Object.keys(programGradesMap);
    
      // Create datasets for each matched university
      const datasets = matchedUniversities.map(universityChart => ({
        label: universityChart.universityName || "Unnamed University",
        data: programNames.map(program => {
          const gradeInfo = programGradesMap[program]?.find(
            entry => entry.university === universityChart.universityName
          );
      
          console.log(`Program: ${program}, Grade Info:`, gradeInfo);
      
          return {
            x: program,
            y: gradeInfo?.grade || 0,
            originalGrade: gradeInfo?.originalGrade || "No grade",
          };
        }),
      }));      
    
      // Ensure we have data to display
      if (datasets.length === 0) {
        console.error(`No data found for universities: ${chartSlots.CompareUniversityUniSlot}`);
        return;
      }
    
      const programComparisonChart: ChartJsonData = {
        universityName: `Comparison of Universities by Programs Grades (Latest Reports)`,
        type: "bar",
        data: {
          labels: programNames,
          datasets: datasets,
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
              reverse: false,
              title: {
                display: true,
                text: "Grades",
              },
              ticks: {
                min: 0.25,
                max: 0.75,
                stepSize: 0.25,
                callback: (value: number) => {
                  switch (value) {
                    case 0.75: return "Confidence";
                    case 0.5: return "Limited Confidence";
                    case 0.25: return "No Confidence";
                    default: return "";
                  }
                },
              },
              suggestedMax: 0.751, // Dynamically add space above the highest bar
            },
          },
          plugins: {
            title: {
              display: true,
              text: "Comparison of Universities by Programs Grades (Latest Reports)",
              font: { size: 18 },
            },
            tooltip: {
              callbacks: {
                label: function (context: { raw: {  y: any; }; dataset: { label: any; }; }) {
                  console.log("Tooltip context:", context);
                  console.log("Raw data:", context.raw);
                  
                  const university = context.dataset.label;
                  const weightedGrade = context.raw.y;
              
                  // Determine the confidence level based on the weighted grade
                  let confidenceLevel = "";
                  if (weightedGrade === 0.75) {
                    confidenceLevel = "Confidence";
                  } else if (weightedGrade === 0.5) {
                    confidenceLevel = "Limited Confidence";
                  } else if (weightedGrade === 0.25) {
                    confidenceLevel = "No Confidence";
                  } else {
                    confidenceLevel = "Unknown Confidence";
                  }
              
                  return `${university} - Judgement: ${confidenceLevel}`;
                }
              }              
            },                               
            datalabels: {
              display: false,
            },
          },
        },
      };
    
      setCurrentChart(programComparisonChart);
    } else if (chartSlots.CompareUniversityWprogUniversityNameSlot && chartSlots.CompareUniversityWprogSlot) {
      setProgramGradesList([]);
    
      // Function to calculate weight for grades
      const calculateWeight = (grade: number): number => {
        switch (grade) {
          case 1: return 0.75; // Highest weight
          case 2: return 0.5;
          case 3: return 0.25;
          default: return 0;   // Invalid grade
        }
      };

      const universityNames = chartSlots.CompareUniversityWprogUniversityNameSlot
        .split(",")
        .map((university) => university.trim().toLowerCase());
      const programNames = chartSlots.CompareUniversityWprogSlot
        .split(",")
        .map((program) => program.trim().toLowerCase());
    
      console.log("University Names for Comparison:", universityNames);
      console.log("Program Names for Comparison:", programNames);
    
      const programGradesMap: {
        [university: string]: { program: string; grade: number; originalGrade: number | "No grade" }[];
      } = {};
    
      const matchedUniversities = universityNames
        .flatMap((name) => performFuzzySearch(name, allUniversityCharts, "universityName"))
        .filter((university): university is ChartJsonData => university !== null);
    
      console.log("Matched Universities with Fuzzy Search:", matchedUniversities.map((u) => u.universityName));
    
      matchedUniversities.forEach((universityChart) => {
        const universityName = universityChart.universityName || "Unnamed University";
    
        const sortedReviews = [...(universityChart.data.datasets[0]?.data || [])].sort(
          (a: any, b: any) => new Date(b.x).getTime() - new Date(a.x).getTime()
        );
    
        if (!programGradesMap[universityName]) {
          programGradesMap[universityName] = [];
        }
    
        programNames.forEach((programName) => {
          const review = sortedReviews.find(
            (review: any) =>
              typeof review === "object" &&
              review?.UnifiedStudyField?.trim()?.toLowerCase() === programName
          );
    
          if (review && typeof review === "object" && "y" in review) {
            const grade = review.y;
            programGradesMap[universityName].push({
              program: programName,
              grade: calculateWeight(grade),
              originalGrade: grade,
            });
          } else {
            programGradesMap[universityName].push({
              program: programName,
              grade: 0,
              originalGrade: "No grade",
            });
          }
        });
      });
    
      const universitiesFromData = Object.keys(programGradesMap);
    
      const datasets = programNames.map((program) => ({
        label: program.charAt(0).toUpperCase() + program.slice(1),
        data: universitiesFromData.map((university) => {
          const gradeInfo = programGradesMap[university]?.find((entry) => entry.program === program);
          return {
            x: university,
            y: gradeInfo?.grade || 0,
            originalGrade: gradeInfo?.originalGrade || "No grade",
          };
        }),
      }));
    
      if (datasets.length === 0) {
        console.error(
          `No data found for universities: ${chartSlots.CompareUniversityWprogUniversityNameSlot} and programs: ${chartSlots.CompareUniversityWprogSlot}`
        );
        return;
      }
    
      const programComparisonChart: ChartJsonData = {
        universityName: `Comparison of Selected Programs by Grades across Selected Universities (Latest Reports)`,
        type: "bar",
        data: {
          labels: universitiesFromData.map((name) => name.charAt(0).toUpperCase() + name.slice(1)),
          datasets: datasets.map((dataset) => ({
            label: dataset.label,
            data: dataset.data.map((d) => d as { x: string | number; y: number; originalGrade: number }),
          })),
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: "Universities",
              },
            },
            y: {
              reverse: false,
              title: {
                display: true,
                text: "Grades",
              },
              ticks: {
                min: 0.25,
                max: 0.75,
                stepSize: 0.25,
                callback: (value: number) => {
                  switch (value) {
                    case 0.75: return "Confidence";
                    case 0.5: return "Limited Confidence";
                    case 0.25: return "No Conifidence";
                    default: return "";
                  }
                },
              },
              suggestedMax: 0.751, // Dynamically add space above the highest bar
            },
          },
          plugins: {
            title: {
              display: true,
              text: "Comparison of Selected Programs by Grades across Selected Universities (Latest Reports)",
              font: { size: 18 },
            },
            tooltip: {
              callbacks: {
                label: function (context: { raw: {  y: any; }; dataset: { label: any; }; }) {
                  console.log("Tooltip context:", context);
                  console.log("Raw data:", context.raw);
                  
                  const university = context.dataset.label;
                  const weightedGrade = context.raw.y;
              
                  // Determine the confidence level based on the weighted grade
                  let confidenceLevel = "";
                  if (weightedGrade === 0.75) {
                    confidenceLevel = "Confidence";
                  } else if (weightedGrade === 0.5) {
                    confidenceLevel = "Limited Confidence";
                  } else if (weightedGrade === 0.25) {
                    confidenceLevel = "No Confidence";
                  } else {
                    confidenceLevel = "Unknown Confidence";
                  }
              
                  return `${university} - Judgement: ${confidenceLevel}`;
                }
              }  
            },
            datalabels: {
              display: false,
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
    if (!content) {
      console.error("No content found to export.");
      return;
    }
  
    try {
      // Clone the content for manipulation
      const clonedContent = content.cloneNode(true) as HTMLElement;
  
      // Create wrapper for PDF styling
      const pdfContainer = document.createElement("div");
      pdfContainer.className = "pdf-export";
  
      // Add PDF styles
      const style = document.createElement("style");
      style.textContent = `
        .pdf-export {
          padding: 20px;
          font-family: Arial, sans-serif;
          background-color: white;
        }
        .pdf-header {
          display: flex;
          justify-content: flex-end; /* Aligns logo to the right */
          align-items: center;
          margin-bottom: 60px;
          margin-right: 300px;
        }
        .pdf-header img {
          max-height: 60px;
          object-fit: contain;
        }
        .pdf-title {
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .pdf-export ul {
          list-style-type: disc;
          margin-left: 20px;
        }
        .pdf-export li {
          margin-bottom: 8px;
        }
      `;
      pdfContainer.appendChild(style);
  
      // Add logo header
      const header = document.createElement("div");
      header.className = "pdf-header";
      if (typeof LogoIcon !== "undefined") {
        const logo = document.createElement("img");
        logo.src = LogoIcon;
        header.appendChild(logo);
      }
      pdfContainer.appendChild(header);
  
      // Handle Chart.js canvas
      const originalCanvas = content.querySelector("canvas");
      if (originalCanvas) {
        const chartImage = document.createElement("img");
        chartImage.src = originalCanvas.toDataURL("image/png");
  
        // Adjust chart width based on programGradesList
        if (programGradesList && programGradesList.length > 0) {
          chartImage.style.width = "100%"; // Set width to 100% of the page
        } else {
          chartImage.style.width = "150%"; // Default width to 150% of the page
        }
        chartImage.style.height = "auto"; // Maintain aspect ratio
  
        // Replace the canvas in cloned content with the image
        const clonedCanvas = clonedContent.querySelector("canvas");
        if (clonedCanvas && clonedCanvas.parentNode) {
          clonedCanvas.parentNode.replaceChild(chartImage, clonedCanvas);
        }
      }
  
      pdfContainer.appendChild(clonedContent);
  
      // Temporarily add to DOM for rendering
      document.body.appendChild(pdfContainer);
  
      // Capture the content
      const canvas = await html2canvas(pdfContainer, {
        scale: 2, // Maintain high resolution
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY,
        windowWidth: pdfContainer.scrollWidth,
        windowHeight: pdfContainer.scrollHeight,
      } as any);
  
      // Remove temporary container
      document.body.removeChild(pdfContainer);
  
      // Generate PDF
      const imgData = canvas.toDataURL("image/jpeg");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
  
      // Calculate dimensions
    const margin = 10;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth * (programGradesList && programGradesList.length > 0 ? 1.0 : 1.5); // Adjust width dynamically
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Center the image horizontally
      const xOffset = (pageWidth - imgWidth) / 2;
  
      // Add image to PDF
      pdf.addImage(imgData, "JPEG", xOffset, margin, imgWidth, imgHeight);
  
      // Save the PDF
      pdf.save("generated-chart.pdf");
    } catch (error) {
      console.error("Error exporting content to PDF:", error);
    }
  };
     

  // Export chart content as PNG
  const exportContentAsPNG = async () => {
    const content = document.getElementById("export-content");
    if (!content) {
      console.error("No content found to export.");
      return;
    }

    try {
      // Capture the content as a canvas
      const canvas = await html2canvas(content, {
        scale: 2, // Increase the scale for better quality
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY, // Adjust for scroll position
      } as any);

      // Convert the canvas to a PNG image
      const imgData = canvas.toDataURL("image/png");

      // Create a link element for downloading the image
      const link = document.createElement("a");
      link.href = imgData;
      link.download = "generated-chart.png"; // File name for the downloaded image

      // Append the link to the document and trigger the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting content to PNG:", error);
    }
  };

  const isChartDataValid = (chart: ChartJsonData | null): boolean => {
    if (!chart || !chart.data || !chart.data.datasets) return false;
    
    return chart.data.datasets.some(dataset =>
      dataset.data.some(dataPoint => 
        // For pie charts, check if any value is non-zero
        (typeof dataPoint === "number" && dataPoint !== 0) ||
        // For scatter/line charts, keep original validation
        (typeof dataPoint === "object" &&
         "x" in dataPoint &&
         "y" in dataPoint &&
         dataPoint.x !== null &&
         dataPoint.y !== null &&
         dataPoint.y !== 0)
      )
    );
  };
  
  return (
    <div className="flex flex-col items-center w-full">
      <div className="p-5 w-full max-w-7xl mx-auto">
        {(isSchoolDataLoading || isVocationalDataLoading || isUniversityDataLoading)}

        {/* Export Button */}
        {!isSchoolDataLoading && !isVocationalDataLoading && currentChart && isChartDataValid(currentChart) && (
          <div className="mb-4 flex justify-center w-full gap-4">
          <button
            onClick={exportContentAsPDF}
            className="bg-lightblue hover:bg-primary text-white px-5 py-2.5 rounded-md transition-colors duration-300"
          >
            Export as PDF
          </button>
          <button
          onClick={exportContentAsPNG}
          className="text-white px-5 py-2.5 rounded-md transition-colors duration-300"
          style={{
            backgroundColor: 'rgba(184, 51, 29, 1)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(138, 38, 21, 1)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(184, 51, 29, 1)')}
          >
          Export as PNG
          </button>
        </div>       
        )}
        {/* <center><h2>Charts</h2></center> */}
        <div id="export-content" className="w-full">
          {!isSchoolDataLoading && !isVocationalDataLoading && !isUniversityDataLoading && currentChart && isChartDataValid(currentChart) && (
            <div className="flex justify-center w-full">
              <div className={`card bg-white rounded-md shadow-lg p-4 ${programGradesList.length > 0 ? 'w-full' : 'w-full max-w-4xl'}`}>
                <div className={`${programGradesList.length > 0 ? 'flex flex-row items-start justify-between gap-8' : 'flex justify-center'}`}>
                  <div className={`${programGradesList.length > 0 ? 'w-2/3' : 'w-full'}`}>
                    {currentChart && <DynamicChart jsonData={currentChart} />}
                  </div>

                  {programGradesList.length > 0 && (
                    <div className="w-1/3 mt-0">
                      {isprogramGradesListLoading ? (
                        <p>Loading program grades...</p>
                      ) : (
                        <div className="p-4">
                          <h2 className="font-bold underline mb-4 text-gray-700">
                            Latest Judgment of Program: {chartSlots.ProgramNameSlot}
                          </h2>
                          <ul className="space-y-2">
                            {programGradesList.map((item, index) => (
                              <li key={index} className="py-1 text-sm">
                                <span className="font-medium">{item.universityName}</span>: {item.latestJudgment}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicChart;