import { useContext, useEffect, useState } from "react";
import DynamicChart, { ChartJsonData } from "../Dashboard/dynamicChart";  // Component for rendering dynamic charts
import html2canvas from "html2canvas"; // Library for capturing HTML content as a canvas
import jsPDF from "jspdf"; // Library for generating PDFs
import { LexChartSlotsContext } from "../../components/RouterRoot"; // Context for managing chart slot data
import Fuse from "fuse.js"; // Import Fuse.js for fuzzy searching
import LogoIcon from '../../images/BQA.png'; // Importing the logo for export

// Define the props interface for the component
interface BasicChartProps {
  activeTab: number; // Indicates the currently active tab
}

// Main component for rendering and managing charts
const BasicChart: React.FC<BasicChartProps> = ({ activeTab }) => {
  const { chartSlots } = useContext(LexChartSlotsContext);  // Get chart slot data from context

  // State variables for loading status
  const [isSchoolDataLoading, setIsSchoolDataLoading] = useState(true);
  const [isVocationalDataLoading, setIsVocationalDataLoading] = useState(true);
  const [isUniversityDataLoading, setIsUniversityDataLoading] = useState(true);
  const [isprogramGradesListLoading, setIsprogramGradesListLoading] = useState(false);

  // State variables for chart data and program grades list
  const [currentChart, setCurrentChart] = useState<ChartJsonData | null>(null); // Current chart to display
  const [allSchoolCharts, setAllSchoolCharts] = useState<ChartJsonData[]>([]); // Charts for schools
  const [allVocationalCharts, setAllVocationalCharts] = useState<ChartJsonData[]>([]); // Charts for vocational institutes
  const [allUniversityCharts, setAllUniversityCharts] = useState<ChartJsonData[]>([]); // Charts for universities
  const [programGradesList, setProgramGradesList] = useState<{ universityName: string; latestJudgment: string }[]>([]);

  // Clear charts when the active tab changes
  useEffect(() => {
    setCurrentChart(null);
    setProgramGradesList([]);
    console.log("Cleared charts due to tab change.");
  }, [activeTab]);

  // Fetch school reviews and process them into chart data
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
                  x: review.Cycle, // X-axis value (review cycle)
                  y: parseFloat(review.Grade.replace(/[^\d.]/g, "")) || null, // Y-axis value (numeric grade)
                })),
                label: school.EnglishSchoolName, // Dataset label
              },
            ],
          },
        }));

        setAllSchoolCharts(transformedCharts); // Store transformed chart data
      } catch (error) {
        console.error("Error fetching school reviews:", error);
      } finally {
        setIsSchoolDataLoading(false);
      }
    };

    fetchSchoolReviews();
  }, []);

  // Fetch vocational institute reviews and process them into chart data
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
                  x: review.Cycle, // X-axis value (review cycle)
                  y: parseFloat(review.Grade.replace(/[^\d.]/g, "")) || null, // Y-axis value (numeric grade)
                })),
                label: institute.EnglishInstituteName, // Dataset label
              },
            ],
          },
        }));

        setAllVocationalCharts(transformedCharts); // Store transformed chart data
      } catch (error) {
        console.error("Error fetching vocational reviews:", error);
      } finally {
        setIsVocationalDataLoading(false);
      }
    };

    fetchVocationalReviews();
  }, []);

  // Fetch university reviews and process them into chart data
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
          )[0]; // Sort reviews by cycle to get the latest review

          return {
            universityName: university.InstitutionName,
            type: "line",
            data: {
              datasets: latestReview
                ? [
                    {
                      data: university.Reviews.map((review: any) => ({
                        x: review.Cycle,
                        y: review.Judgement === "Confidence" ? 1 : review.Judgement === "Limited Confidence" ? 2 : 3, // Map judgments to numeric values
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
  
  // Perform fuzzy search for a names in the datasets
  const performFuzzySearch = (slotValue: string, dataset: ChartJsonData[], searchKey: "schoolName" | "universityName") => {
    const fuse = new Fuse(dataset, { keys: [searchKey], threshold: 0.25 }); // Initialize Fuse.js with search options
    const result = fuse.search(slotValue); // Perform fuzzy search
    console.log("Search results for " + slotValue + ": ", result);
    return result.length > 0 ? result[0].item as ChartJsonData : null; // Return the first matched item
  };
  
  // Update current chart based on chart slots
  useEffect(() => {
    if (!chartSlots) return; // If chartSlots is undefined, exit early.

    // Reset the current chart and program grades list
    setCurrentChart(null);
    setProgramGradesList([]);

    // Handle AnalyzeSchoolSlot
    if (chartSlots.AnalyzeSchoolSlot) {
      const slotValue = chartSlots.AnalyzeSchoolSlot; // Get the school name from the slot
      const schoolChart = performFuzzySearch(slotValue, allSchoolCharts, "schoolName");  // Search for the corresponding school chart data from retrieved array using fuzzy search method
      if (schoolChart) setCurrentChart(schoolChart); // Set the chart if found
      else console.error(`No chart found for school: ${chartSlots.AnalyzeSchoolSlot}`); // Log error if not found
    
    // Handle CompareSpecificInstitutesSlot
    } else if (chartSlots.CompareSpecificInstitutesSlot) {
      const matchedCharts: ChartJsonData[] = []; // Store matched charts in array
      const allCycles = new Set<string>(); // Set to collect all unique review cycles across matched charts
    
      // Split the input string to process each institute
      chartSlots.CompareSpecificInstitutesSlot.split(",").map((s: string) => {
        const trimmed = s.trim(); // Trim whitespace
        const result = performFuzzySearch(trimmed, allSchoolCharts, "schoolName"); // Search for the institutes' chart data from retrieved array using fuzzy search method
        if (result && matchedCharts.indexOf(result) === -1) { // Ensure the result is valid and not already in the matchedCharts array to avoid duplicates.
          matchedCharts.push(result); // Add the unique matched chart to the matchedCharts array
    
          // Collect all unique review cycles from the matched chart
          result.data.datasets[0]?.data.forEach((dataPoint: any) => {
            if (typeof dataPoint === "object" && dataPoint.x) {
              allCycles.add(dataPoint.x); // Add the cycle (x-axis value) to the Set
            }
          });
        }
      });
    
      // Create a comparison chart
      const comparisonChart: ChartJsonData = {
        schoolName: "Comparison Chart", // Chart title
        type: "line", // Chart type
        data: {
          datasets: matchedCharts.map((chart) => ({
            label: chart.schoolName || "Unnamed School", // Dataset label
            data: Array.from(allCycles).sort().map((cycle) => {
              // Find the data point for the current cycle
              const dataPoint = chart.data.datasets[0]?.data.find(
                (dp: any) => typeof dp === "object" && dp.x === cycle
              );
              return {
                x: cycle, // X-axis value (e.g., review cycle)
                y: dataPoint && typeof dataPoint === "object" ? dataPoint.y : NaN, // Y-axis value or NaN for missing data
              };
            }),
            fill: false, // Disable fill
            borderWidth: 2, // Line thickness
          })),
        },
      };
      setCurrentChart(comparisonChart); // Set the comparison chart

      // Handle CompareSchoolSlot for all government schools
    } else if (chartSlots.CompareSchoolSlot === "All Government Schools") {
      const governmentSchools = allSchoolCharts.filter(
        (chart) => chart.schoolType === "Government"
      ); // Filter government schools from retrieved array

      // Grade categories and counts
      const gradeCounts = { Outstanding: 0, Good: 0, Satisfactory: 0, Inadequate: 0 };
      governmentSchools.forEach((school) => {
        // Calculate the average grade
        const averageGrade =
          school.data.datasets[0].data.reduce(
            (sum: number, point: any) => sum + (point.y || 0),
            0
          ) / school.data.datasets[0].data.length;
    
        // Increment the corresponding grade count
        if (averageGrade <= 1) gradeCounts.Outstanding++;
        else if (averageGrade <= 2) gradeCounts.Good++;
        else if (averageGrade <= 3) gradeCounts.Satisfactory++;
        else gradeCounts.Inadequate++;
      });
    
      // Create a pie chart for grade distribution
      const comparisonChart: ChartJsonData = {
        schoolName: "All Government Schools", // Chart title
        type: "pie", // Chart type
        data: {
          labels: Object.keys(gradeCounts), // Grade categories
          datasets: [
            {
              label: "Government Schools Grade Distribution", // Dataset label
              data: Object.values(gradeCounts), // Grade counts
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
              display: false, // Disable data labels
            }
          },
        },
      };
    
      setCurrentChart(comparisonChart); // Set the pie chart

      // Handle CompareSchoolSlot for all private schools
      } else if (chartSlots.CompareSchoolSlot === "All Private Schools") {

        const privateSchools = allSchoolCharts.filter(
          (chart) => chart.schoolType === "Private"
        ); // Filter private schools from retrieved array
      
        // Grade categories and counts
        const gradeCounts = { Outstanding: 0, Good: 0, Satisfactory: 0, Inadequate: 0 };
        privateSchools.forEach((school) => {
          // Calculate the average grade
          const averageGrade =
            school.data.datasets[0].data.reduce(
              (sum: number, point: any) => sum + (point.y || 0),
              0
            ) / school.data.datasets[0].data.length;
      
          // Increment the corresponding grade count
          if (averageGrade <= 1) gradeCounts.Outstanding++;
          else if (averageGrade <= 2) gradeCounts.Good++;
          else if (averageGrade <= 3) gradeCounts.Satisfactory++;
          else gradeCounts.Inadequate++;
        });
      
        // Create a pie chart for grade distribution
        const comparisonChart: ChartJsonData = {
          schoolName: "All Private Schools", // Chart title
          type: "pie", // Chart type
          data: {
            labels: Object.keys(gradeCounts), // Grade categories
            datasets: [
              {
                label: "Private Schools Grade Distribution", // Dataset label
                data: Object.values(gradeCounts), // Grade counts
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
                display: false, // Disable data labels
              }
            },
          },
        };
      
        setCurrentChart(comparisonChart); // Set the pie chart

        // Handle AnalyzeVocationalSlot
      } else if (chartSlots.AnalyzeVocationalSlot) {
      const slotValue = chartSlots.AnalyzeVocationalSlot; // Get the vocational institute name from slot
      const vocationalChart = performFuzzySearch(slotValue, allVocationalCharts, "schoolName"); // Search for the corresponding vocational center chart data from retrieved array using fuzzy search method
      if (vocationalChart) setCurrentChart(vocationalChart); // Set the chart if found
      else console.error(`No chart found for institute: ${chartSlots.AnalyzeVocationalSlot}`); // Log error if not found

      // Handle CompareVocationalSlot
  } else if (chartSlots.CompareVocationalSlot) {
      const matchedCharts: ChartJsonData[] = []; // Store matched charts in array
      const allCycles = new Set<string>(); // Set to collect all unique review cycles across matched charts
    
      // Split the CompareVocationalSlot string into individual names and process each one
      chartSlots.CompareVocationalSlot.split(",").map((s: string) => {
        const trimmed = s.trim(); // Remove leading and trailing whitespace from the name
        const result = performFuzzySearch(trimmed, allVocationalCharts, "schoolName"); // Perform a fuzzy search to find a matching vocational chart
        if (result && matchedCharts.indexOf(result) === -1) { // Ensure the result is valid and not already in the matchedCharts array to avoid duplicates.
          matchedCharts.push(result); // Add the unique matched chart to the matchedCharts array
    
          // Collect all unique review cycles from the matched chart
          result.data.datasets[0]?.data.forEach((dataPoint: any) => {
            if (typeof dataPoint === "object" && dataPoint.x) {
              allCycles.add(dataPoint.x); // Add the cycle (x-axis value) to the Set
            }
          });
        }
      });
    
      // Construct a comparison chart using the matched vocational charts
      const comparisonChart: ChartJsonData = {
        schoolName: "Comparison Chart", // Chart title
        type: "line", // Line chart type
        data: {
          datasets: matchedCharts.map((chart) => ({
            label: chart.schoolName || "Unnamed Vocational Training Center", // Use the school name as the dataset label
            data: Array.from(allCycles).sort().map((cycle) => {
               // For each unique cycle, find the corresponding data point from the current chart
              const dataPoint = chart.data.datasets[0]?.data.find(
                (dp: any) => typeof dp === "object" && dp.x === cycle
              );
              return {
                x: cycle, // X-axis value (e.g., review cycle)
                y: dataPoint && typeof dataPoint === "object" ? dataPoint.y : NaN, // Y-axis value or NaN for missing data
              };
            }),
            fill: false, // Disable fill
            borderWidth: 2, // Line thickness
          })),
        },
      };
      setCurrentChart(comparisonChart); // Set the comparison chart

      // Handle AnalyzeUniversityNameSlot
    } else if (chartSlots.AnalyzeUniversityNameSlot) {
      const slotValue = chartSlots.AnalyzeUniversityNameSlot.trim().toLowerCase(); // Get and normalize the university name from the slot
      const universityChart = performFuzzySearch(slotValue, allUniversityCharts, "universityName"); // Perform a fuzzy search to find the matching university chart
      if (universityChart) {
        // Modify the chart to configure the Y-axis for judgments (Confidence, Limited Confidence, No Confidence)
        const modifiedChart = {
          ...universityChart, // Spread the existing chart properties
          options: {
            ...universityChart.options, // Copy and modify operations property
            scales: {
              ...((universityChart.options as any)?.scales || {}), // Fallback to empty object if scales is undefined
              y: {
                title: {
                  display: true,
                  text: "Judgement", // Label for the Y-axis
                },
                ...((universityChart.options as any)?.scales?.y || {}), // Retain existing Y-axis properties if any
                min: 0, // Set the minimum Y-axis value as 0
                max: 4, // Set the minimum Y-axis value as 4 for "margin" for clearer chart display
                reverse: true, // Reverse the Y-axis to display judgments in descending order
                ticks: {
                  stepSize: 1, // Step by 1 (interval)
                  callback: (value: number) => {
                    switch (value) {
                      // Map the numeric values to their respective judgment labels
                      case 1: return "Confidence";
                      case 2: return "Limited Confidence";
                      case 3: return "No Confidence";
                      default: return ""; // Return an empty label for other values
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
                  // Customize the tooltip to display judgment levels
                  label: function (context: { raw: { y: any }; dataset: { label: any } }) {
                    console.log("Tooltip context:", context);
                    console.log("Raw data:", context.raw);
    
                    const university = context.dataset.label; // Get the university label
                    const weightedGrade = context.raw.y; // Get the grade value
    
                    // Determine the confidence level based on the grade
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
    
                    return `${university} - Judgement: ${confidenceLevel}`; // Return the formatted tooltip label
                  },
                },
              },
            },
          },
        };
        setCurrentChart(modifiedChart); // Set the current chart
      } else {
        console.error(`No chart found for university: ${slotValue}`); // Log an error if no matching university chart is found
      }
      
      // Handle ProgramNameSlot
    } else if (chartSlots.ProgramNameSlot) {
      const slotValue = chartSlots.ProgramNameSlot.trim().toLowerCase(); // Get and normalize the program name from the slot
      const programGrades: { universityName: string; latestJudgment: string }[] = []; // Initialize an array to store program grades
      const gradeCounts = { Confidence: 0, "Limited Confidence": 0, "No Confidence": 0 }; // Initialize grade counters
    
      setIsprogramGradesListLoading(true); // Set loading state to true
  
      allUniversityCharts.forEach((universityChart) => {
         // Filter valid datasets to ensure proper data processing
        const validDatasets = universityChart.data.datasets.filter(
          (dataset) => dataset?.data && Array.isArray(dataset.data)
        );
    
        let latestJudgment: string | null = null; // Store the latest judgment for the program
    
        validDatasets.forEach((dataset) => {
          // Sort the dataset reviews in descending order of their cycle dates
          const sortedData = [...dataset.data].sort((a: any, b: any) =>
            new Date((b as { x: string }).x).getTime() - new Date((a as { x: string }).x).getTime()
          );
    
          // Process each review to find the relevant program data
          for (const review of sortedData) {
            if (
              review &&
              typeof review === "object" &&
              "UnifiedStudyField" in review &&
              "y" in review
            ) {
              const field = (review as { UnifiedStudyField: string }).UnifiedStudyField; // Extract the program name
              const grade = (review as { y: number }).y; // Extract the grade
    
              // Check if the program matches the slot value
              if (field.trim().toLowerCase() === slotValue) {
                // Map the grade to a judgment and update the counters
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
                break; // Exit the loop as only the latest report is needed
              }
            }
          }
        });
    
        // If a judgment is found, add it to the program grades list
        if (latestJudgment) {
          programGrades.push({
            universityName: universityChart.universityName || "Unnamed University", // Use the university name or a default value
            latestJudgment, // Store the latest judgment
          });
        }
      });
    
      // Log an error if no program data is found
      if (programGrades.length === 0) {
        console.error(`No data found for program: ${slotValue}`);
        return;
      }
    
      // Construct the chart data for the program analysis
      const programComparisonChart: ChartJsonData = {
        universityName: `Analysis of Program: ${chartSlots.ProgramNameSlot}`, // Set the chart title
        type: "pie", // Use a pie chart for the analysis
        data: {
          labels: Object.keys(gradeCounts), // Use the grade categories as labels
          datasets: [
            {
              label: `Grade Distribution for Program: ${chartSlots.ProgramNameSlot}`, // Set the dataset label
              data: Object.values(gradeCounts), // Use the grade counts as data points
              backgroundColor: ["rgba(102, 156, 86, 1)", "rgba(83, 116, 156, 1)", "rgba(230, 65, 37, 1)"], // Set colors for the slices
            },
          ],
        },
      };
    
      // Update the chart and list states with the program data
      setCurrentChart(programComparisonChart); // Set the current chart to the program comparison chart
      setProgramGradesList(programGrades); // Display the list
      setIsprogramGradesListLoading(false); // End loading state

      // Handle CompareUniversityUniSlot
    } else if (chartSlots.CompareUniversityUniSlot) {
    
      // Extract university names from the slot by splitting the input string and trimming whitespace
      const universityNames = chartSlots.CompareUniversityUniSlot
        .split(",")
        .map((name) => name.trim());
    
      console.log("University Names for Comparison:", universityNames);
    
      // Function to calculate a weight for each grade
      // Higher grades (e.g., "Confidence") have higher weights
      const calculateWeight = (grade: number): number => {
        switch (grade) {
          case 1: return 0.75; // "Confidence"
          case 2: return 0.5;  // "Limited Confidence"
          case 3: return 0.25; // "No Confidence"
          default: return 0;   // Invalid grade
        }
      };
    
       // Perform fuzzy search to match university names in the chart data
        const matchedUniversities = universityNames
        .map(name => performFuzzySearch(name, allUniversityCharts, "universityName"))
        .filter((univ): univ is ChartJsonData => univ !== null); // Filter out null results
    
       // Prepare an object to map programs to their corresponding grades for each university
      const programGradesMap: { [program: string]: { university: string; grade: number }[] } = {};
    
      matchedUniversities.forEach((universityChart) => {
        // Sort reviews to get the most recent ones first
        const sortedReviews = [...(universityChart.data.datasets[0]?.data || [])].sort(
          (a: any, b: any) => new Date(b.x).getTime() - new Date(a.x).getTime()
        );
      
        console.log(`Processing university: ${universityChart.universityName}`);
        console.log(`Sorted reviews:`, sortedReviews);
      
        // Use a Set to keep track of already processed programs (avoid duplicates)
        const processedPrograms = new Set<string>();
      
        // Process each review and map it to its corresponding program
        sortedReviews.forEach((review: any) => {
          console.log(`Review:`, review);
          const programName = review?.UnifiedStudyField?.trim(); // Program name
          const grade = review?.y; // Grade for the review
          
          // Skip if program is already processed or the name is invalid
          if (!programName || processedPrograms.has(programName)) {
            console.log(`Skipping program: ${programName}`);
            return;
          }
          
          // Mark the program as processed
          processedPrograms.add(programName);
      
          // Initialize the map entry for the program if it doesn't exist
          if (!programGradesMap[programName]) {
            programGradesMap[programName] = [];
          }
      
          console.log(`Adding program: ${programName}, Grade: ${grade}`);

          // Add the program-grade mapping for the current university
          programGradesMap[programName].push({
            university: universityChart.universityName || "Unnamed University",
            grade: calculateWeight(grade),  // Weighted grade
          });
        });
      });
      
      // Log the final mapping of programs and grades for verification
      console.log(`Program Grades Map:`, programGradesMap);      
    
      // Extract unique program names for the X-axis of the chart
      const programNames = Object.keys(programGradesMap);
    
      // Create datasets for each matched university
      const datasets = matchedUniversities.map(universityChart => ({
        label: universityChart.universityName || "Unnamed University", // University label
        data: programNames.map(program => {
          const gradeInfo = programGradesMap[program]?.find(
            entry => entry.university === universityChart.universityName
          );
      
          console.log(`Program: ${program}, Grade Info:`, gradeInfo);
      
          return {
            x: program,                    // Program name for the X-axis
            y: gradeInfo?.grade || 0,      // Weighted grade for the Y-axis
          };
        }),
      }));      
    
      // Ensure there is data to display; if not, log an error and exit
      if (datasets.length === 0) {
        console.error(`No data found for universities: ${chartSlots.CompareUniversityUniSlot}`);
        return;
      }
    
      // Construct the chart data for comparing universities by program grades
      const programComparisonChart: ChartJsonData = {
        universityName: `Comparison of Universities by Programs Grades (Latest Reports)`,
        type: "bar", // Bar chart for comparison
        data: {
          labels: programNames, // X-axis labels (program names)
          datasets: datasets,   // Datasets for each university
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: "Programs", // Label for the X-axis
              },
            },
            y: {
              reverse: false,
              title: {
                display: true,
                text: "Grades", // Label for the Y-axis
              },
              ticks: {
                min: 0.25,
                max: 0.75,
                stepSize: 0.25, // Steps
                callback: (value: number) => {
                  // Map tick values to grade labels
                  switch (value) {
                    case 0.75: return "Confidence";
                    case 0.5: return "Limited Confidence";
                    case 0.25: return "No Confidence";
                    default: return "";
                  }
                },
              },
              suggestedMax: 0.751, // Add slight padding above the highest bar
            },
          },
          plugins: {
            title: {
              display: true,
              text: "Comparison of Universities by Programs Grades (Latest Reports)", // Chart title
              font: { size: 18 },
            },
            tooltip: {
              callbacks: {
                label: function (context: { raw: {  y: any; }; dataset: { label: any; }; }) {
                  console.log("Tooltip context:", context);
                  console.log("Raw data:", context.raw);
                  
                  const university = context.dataset.label; // University name
                  const weightedGrade = context.raw.y;      // Weighted grade
              
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
              
                  return `${university} - Judgement: ${confidenceLevel}`; // Tooltip text
                }
              }              
            },                               
            datalabels: {
              display: false, // Disable data labels
            },
          },
        },
      };
      // Set current chart
      setCurrentChart(programComparisonChart);

      // Handle CompareUniversityWprogUniversityNameSlot and CompareUniversityWprogSlot
    } else if (chartSlots.CompareUniversityWprogUniversityNameSlot && chartSlots.CompareUniversityWprogSlot) {
    
      // Function to assign weights to grades for consistent chart scaling
      const calculateWeight = (grade: number): number => {
        switch (grade) {
          case 1: return 0.75; // Highest weight "Confidence"
          case 2: return 0.5; // "Limited Confidence"
          case 3: return 0.25; // "No Confidence"
          default: return 0;   // Invalid grade
        }
      };

      // Parse university names from the slot and normalize them for comparison
      const universityNames = chartSlots.CompareUniversityWprogUniversityNameSlot
        .split(",")
        .map((university) => university.trim().toLowerCase());

      // Parse program names from the slot and normalize them for comparison
      const programNames = chartSlots.CompareUniversityWprogSlot
        .split(",")
        .map((program) => program.trim().toLowerCase());
    
      console.log("University Names for Comparison:", universityNames);
      console.log("Program Names for Comparison:", programNames);
    
      // Initialize a mapping structure to hold grades by university and program
      const programGradesMap: {
        [university: string]: { program: string; grade: number }[];
      } = {};
    
      // Perform fuzzy search to match universities in the chart data
      const matchedUniversities = universityNames
        .flatMap((name) => performFuzzySearch(name, allUniversityCharts, "universityName"))
        .filter((university): university is ChartJsonData => university !== null); // Filter valid matches
    
      console.log("Matched Universities with Fuzzy Search:", matchedUniversities.map((u) => u.universityName));
    
      // Process each matched university
      matchedUniversities.forEach((universityChart) => {
        const universityName = universityChart.universityName || "Unnamed University";
    
        // Sort reviews to get the most recent ones first
        const sortedReviews = [...(universityChart.data.datasets[0]?.data || [])].sort(
          (a: any, b: any) => new Date(b.x).getTime() - new Date(a.x).getTime()
        );
    
        // Initialize an entry in the programGradesMap for the current university
        if (!programGradesMap[universityName]) {
          programGradesMap[universityName] = [];
        }
    
         // Process each program for the current university
        programNames.forEach((programName) => {
          // Find the most recent review for the specified program
          const review = sortedReviews.find(
            (review: any) =>
              typeof review === "object" &&
              review?.UnifiedStudyField?.trim()?.toLowerCase() === programName
          );
    
          if (review && typeof review === "object" && "y" in review) {
            const grade = review.y;
            // Add the program and grade to the map
            programGradesMap[universityName].push({
              program: programName,
              grade: calculateWeight(grade), // Weighted grade
            });
          } else {
            // Handle cases where no grade is available
            programGradesMap[universityName].push({
              program: programName,
              grade: 0,                   // No grade means no weight
            });
          }
        });
      });
    
      // Extract unique universities from the map
      const universitiesFromData = Object.keys(programGradesMap);
    
      // Create datasets for each program
      const datasets = programNames.map((program) => ({
        label: program.charAt(0).toUpperCase() + program.slice(1), // Capitalize program names
        data: universitiesFromData.map((university) => {
          const gradeInfo = programGradesMap[university]?.find((entry) => entry.program === program);
          return {
            x: university,                  // X-axis: University name
            y: gradeInfo?.grade || 0,       // Y-axis: Weighted grade
          };
        }),
      }));
    
      // Ensure that there is data to display
      if (datasets.length === 0) {
        console.error(
          `No data found for universities: ${chartSlots.CompareUniversityWprogUniversityNameSlot} and programs: ${chartSlots.CompareUniversityWprogSlot}`
        );
        return;
      }
    
      // Construct the chart data for comparison
      const programComparisonChart: ChartJsonData = {
        universityName: `Comparison of Selected Programs by Grades across Selected Universities (Latest Reports)`,
        type: "bar", // Bar chart for program comparison
        data: {
          labels: universitiesFromData.map((name) => name.charAt(0).toUpperCase() + name.slice(1)), // Capitalized university names
          datasets: datasets.map((dataset) => ({
            label: dataset.label, // Program name as the label
            data: dataset.data.map((d) => d as { x: string | number; y: number }), // Dataset
          })),
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: "Universities", // Label for X-axis
              },
            },
            y: {
              reverse: false,
              title: {
                display: true,
                text: "Grades", // Label for Y-axis
              },
              ticks: {
                min: 0.25,
                max: 0.75,
                stepSize: 0.25, // Steps for Y-axis
                callback: (value: number) => {
                  // Map tick values to grade levels
                  switch (value) {
                    case 0.75: return "Confidence";
                    case 0.5: return "Limited Confidence";
                    case 0.25: return "No Conifidence";
                    default: return "";
                  }
                },
              },
              suggestedMax: 0.751, // Add slight padding above the highest bar
            },
          },
          plugins: {
            title: {
              display: true,
              text: "Comparison of Selected Programs by Grades across Selected Universities (Latest Reports)", // Chart title
              font: { size: 18 },
            },
            tooltip: {
              callbacks: {
                label: function (context: { raw: {  y: any; }; dataset: { label: any; }; }) {
                  console.log("Tooltip context:", context);
                  console.log("Raw data:", context.raw);
                  
                  const university = context.dataset.label; // University name
                  const weightedGrade = context.raw.y;      // Weighted grade
              
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
              
                  return `${university} - Judgement: ${confidenceLevel}`; // Tooltip text
                }
              }  
            },
            datalabels: {
              display: false, // Disable data labels
            },
          },
        },
      };
      // Set current chart
      setCurrentChart(programComparisonChart);
    }    

    // Dependency array for the `useEffect` hook.
    // Ensures that the effect runs whenever `chartSlots`, `allSchoolCharts`, `allVocationalCharts`, or `allUniversityCharts` change.
  }, [chartSlots, allSchoolCharts, allVocationalCharts, allUniversityCharts]);

  // Export chart content as PDF
  const exportContentAsPDF = async () => {
    const content = document.getElementById("export-content");
    if (!content) {
      console.error("No content found to export.");
      return;
    }
  
    try {
      // Clone the chart content to manipulate it without altering the DOM
      const clonedContent = content.cloneNode(true) as HTMLElement;
  
      // Create a container for the PDF with styling
      const pdfContainer = document.createElement("div");
      pdfContainer.className = "pdf-export";
  
       // Add custom styles to the PDF content
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
  
      // Add a header with a logo to the PDF
      const header = document.createElement("div");
      header.className = "pdf-header";
      if (typeof LogoIcon !== "undefined") {
        const logo = document.createElement("img");
        logo.src = LogoIcon; 
        header.appendChild(logo);
      }
      pdfContainer.appendChild(header);
  
      // Handle converting Chart.js canvas to an image
      const originalCanvas = content.querySelector("canvas");
      if (originalCanvas) {
        const chartImage = document.createElement("img");
        chartImage.src = originalCanvas.toDataURL("image/png");
  
        // Adjust chart width based on programGradesList's existence
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
  
      // Temporarily append the PDF content to the DOM for rendering
      document.body.appendChild(pdfContainer);
  
      // Render the content into a canvas using `html2canvas`
      const canvas = await html2canvas(pdfContainer, {
        scale: 2, // Maintain high resolution
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY, // Adjust for scroll position
        windowWidth: pdfContainer.scrollWidth,
        windowHeight: pdfContainer.scrollHeight,
      } as any);
  
      // Remove the temporary container from the DOM
      document.body.removeChild(pdfContainer);
  
      // Generate the PDF using `jsPDF`
      const imgData = canvas.toDataURL("image/jpeg");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
  
    // Dynamically calculate image dimensions for the PDF
    const margin = 10;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth * (programGradesList && programGradesList.length > 0 ? 1.0 : 1.5); // Adjust width dynamically
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Center the image horizontally on the PDF page
      const xOffset = (pageWidth - imgWidth) / 2;
  
      // Add image to PDF
      pdf.addImage(imgData, "JPEG", xOffset, margin, imgWidth, imgHeight);
  
      // Save the generated PDF
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
      // Render the content into a canvas using `html2canvas`
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

      // Trigger the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting content to PNG:", error);
    }
  };

  // Validate chart data before displaying or exporting
  const isChartDataValid = (chart: ChartJsonData | null): boolean => {
    if (!chart || !chart.data || !chart.data.datasets) return false;
    
    return chart.data.datasets.some(dataset =>
      dataset.data.some(dataPoint => 
        // Check for non-zero values in pie charts
        (typeof dataPoint === "number" && dataPoint !== 0) ||
        // Check for valid `x` and `y` values in scatter/line charts
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
      {/* Outer container for the chart section */}
      <div className="p-5 w-full max-w-7xl mx-auto">
        {/* Display export buttons if data is loaded and chart is valid */}
        {!isSchoolDataLoading && !isVocationalDataLoading && currentChart && isChartDataValid(currentChart) && (
          <div className="mb-4 flex justify-center w-full gap-4">
          {/* Button to export the chart content as a PDF */}
          <button
            onClick={exportContentAsPDF}
            className="bg-lightblue hover:bg-primary text-white px-5 py-2.5 rounded-md transition-colors duration-300"
          >
            Export as PDF
          </button>
          {/* Button to export the chart content as a PNG */}
          <button
          onClick={exportContentAsPNG}
          className="text-white px-5 py-2.5 rounded-md transition-colors duration-300"
          style={{
            backgroundColor: 'rgba(184, 51, 29, 1)', // Initial background color
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(138, 38, 21, 1)')} // Change color on hover
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(184, 51, 29, 1)')} // Revert color on hover leave
          >
          Export as PNG
          </button>
        </div>       
        )}
        {/* Main content container for charts and additional data */}
        <div id="export-content" className="w-full">
          {/* Render the chart and related data only if data is loaded and the chart is valid */}
          {!isSchoolDataLoading && !isVocationalDataLoading && !isUniversityDataLoading && currentChart && isChartDataValid(currentChart) && (
            <div className="flex justify-center w-full">
              {/* Card container for the chart */}
              <div className={`card bg-white rounded-md shadow-lg p-4 ${programGradesList.length > 0 ? 'w-full' : 'w-full max-w-4xl'}`}>
                <div className={`${programGradesList.length > 0 ? 'flex flex-row items-start justify-between gap-8' : 'flex justify-center'}`}>
                  {/* Chart rendering container */}
                  <div className={`${programGradesList.length > 0 ? 'w-2/3' : 'w-full'}`}>
                    {currentChart && <DynamicChart jsonData={currentChart} />}
                  </div>
                  {/* Render program grades list if available */}
                  {programGradesList.length > 0 && (
                    <div className="w-1/3 mt-0">
                      {isprogramGradesListLoading ? (
                        <p>Loading program grades...</p>
                      ) : (
                        <div className="p-4">
                          {/* Section header for program grades */}
                          <h2 className="font-bold underline mb-4 text-gray-700">
                            Latest Judgment of Program: {chartSlots.ProgramNameSlot}
                          </h2>
                          {/* List of program grades */}
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