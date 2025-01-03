import React, { useState, useEffect, useContext } from "react";
import { LexChartSlotsContext } from "../components/RouterRoot";

const Filter = () => {
  const [mode, setMode] = useState<"Compare" | "Analyze" | "">("");
  const [educationType, setEducationType] = useState<"schools" | "universities" | "vocational" | "">("");
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [bedrockResponse, setBedrockResponse] = useState<string | null>(null);
  const [latestYear, setLatestYear] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const { setChartSlots } = useContext(LexChartSlotsContext);

  const [vocationalFilters, setVocationalFilters] = useState<VocationalFilters>({
    "Vocational Center Name": [],
    "Center Location": [],
    "Report Year": []
  });
  
  const [universityFilters, setUniversityFilters] = useState<UniversityFilters>({
    "University Name": [],
    "Programme Name": [],
    "Programme Judgment": []
  });
  
  const [filterOptions, setFilterOptions] = useState<SchoolFilters>({
    "Institute Classification": [],
    "Institute Level": [],
    "Location": [],
    "Institute Name": [],
    "Report Year": [],
  });
  interface UniversityFilters {
    "University Name": string[];
    "Programme Name": string[];
    "Programme Judgment": string[];
  }
  
  interface SchoolFilters {
    "Institute Classification": string[];
    "Institute Level": string[];
    "Location": string[];
    "Institute Name": string[];
    "Report Year": string[];
  }

  interface VocationalFilters {
    "Vocational Center Name": string[];
    "Center Location": string[];
    "Report Year": string[];
  }

  

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(
    Object.keys(filterOptions).reduce((acc, header) => {
      acc[header] = [];
      return acc;
    }, {} as Record<string, string[]>)
  );

  const [editableSentence, setEditableSentence] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [userModifiedSentence, setUserModifiedSentence] = useState(false);
  const [userAdditions, setUserAdditions] = useState<string>("");
  const [lastGeneratedSentence, setLastGeneratedSentence] = useState<string>("");

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const prompt = new URLSearchParams();
        if (selectedOptions["Institute Classification"]?.length) {
          prompt.append("classification", selectedOptions["Institute Classification"][0]);
        }
        if (selectedOptions["Institute Level"]?.length) {
          prompt.append("level", selectedOptions["Institute Level"][0]);
        }
        if (selectedOptions["Location"]?.length) {
          prompt.append("location", selectedOptions["Location"][0]);
        }
        if (selectedOptions["University Name"]?.length) {
          prompt.append("universityName", selectedOptions["University Name"][0]);
        }
        if (selectedOptions["Programme Name"]?.length) {
          prompt.append("programmeName", selectedOptions["Programme Name"][0]);
        }
        if (selectedOptions["Vocational Center Name"]?.length) {
          prompt.append("vocationalCenterName", selectedOptions["Vocational Center Name"][0]);
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/fetchfilters?${prompt.toString()}`);
    
        if (!response.ok) {
          // Log the actual error message from the server
          const errorText = await response.text();
          console.error('Server error:', errorText);
          throw new Error(`Server returned ${response.status}: ${errorText}`);
        }
    
        const data = await response.json();
        switch(educationType) {
          case "schools":
            setFilterOptions(data.filters || {
              "Institute Classification": [],
              "Institute Level": [],
              "Location": [],
              "Institute Name": [],
              "Report Year": [],
            });
            if (data.filters?.["Report Year"]?.length > 0) {
              const years = data.filters["Report Year"].map(Number);
              const maxYear = Math.max(...years).toString();
              setLatestYear(maxYear);
            }
            break;
          case "universities":
            setUniversityFilters(data.universityFilters || {
              "University Name": [],
              "Programme Name": [],
              "Programme Judgment": []
            });
            break;
          case "vocational":
            setVocationalFilters(data.vocationalFilters || {
              "Vocational Center Name": [],
              "Center Location": [],
              "Report Year": []
            });
            break;
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
        // Reset to default values on error
        setFilterOptions({
          "Institute Classification": [],
          "Institute Level": [],
          "Location": [],
          "Institute Name": [],
          "Report Year": [],
        });
      }
    };
  
    if (educationType) {
      fetchFilterOptions();
    }
  }, [selectedOptions, educationType]);

  useEffect(() => {
    if (!userModifiedSentence) {
      const newSentence = generateSentence();
      setEditableSentence(newSentence + userAdditions);
      setLastGeneratedSentence(newSentence);
    } else {
      const newSentence = generateSentence();
      const updatedSentence = editableSentence.replace(lastGeneratedSentence, newSentence);
      setEditableSentence(updatedSentence);
      setLastGeneratedSentence(newSentence);
    }
  }, [selectedOptions, mode]);

   function isSchoolFilterKey(key: string): key is keyof SchoolFilters {
    return ["Institute Classification", "Institute Level", "Location", "Institute Name", "Report Year"].includes(key);
  }
  
  function isUniversityFilterKey(key: string): key is keyof UniversityFilters {
    return ["University Name", "Programme Name", "Programme Judgment"].includes(key);
  }

  function isVocationalFilterKey(key: string): key is keyof VocationalFilters {
    return ["Vocational Center Name", "Center Location", "Report Year"].includes(key);
  }
  
  function isSchoolFilters(filters: SchoolFilters | UniversityFilters | VocationalFilters): filters is SchoolFilters {
    return "Institute Classification" in filters;
  }

  function isVocationalFilters(filters: SchoolFilters | UniversityFilters | VocationalFilters): filters is VocationalFilters {
    return "Vocational Center Name" in filters;
  }
  
  const getCurrentFilters = () => {
    switch(educationType) {
      case "universities":
        return {
          "University Name": universityFilters["University Name"] || [],
          "Programme Name": universityFilters["Programme Name"] || [],
          "Programme Judgment": universityFilters["Programme Judgment"] || [],
        };
      case "vocational":
        return {
          "Vocational Center Name": vocationalFilters["Vocational Center Name"] || [],
          "Center Location": vocationalFilters["Center Location"] || [],
          "Report Year": vocationalFilters["Report Year"] || [],
        };
      default:
        return {
          "Institute Classification": filterOptions["Institute Classification"] || [],
          "Institute Level": filterOptions["Institute Level"] || [],
          "Location": filterOptions["Location"] || [],
          "Institute Name": filterOptions["Institute Name"] || [],
          "Report Year": filterOptions["Report Year"] || [],
        };
    }
  };

  const getFilterValues = (header: string): string[] => {
    const filters = getCurrentFilters();
  
    if (isSchoolFilters(filters)) {
      if (isSchoolFilterKey(header)) {
        return filters[header];
      }
    } else if (isVocationalFilters(filters)) {
      if (isVocationalFilterKey(header)) {
        if (header === "Vocational Center Name" && mode === "Compare") {
          return filters[header].filter((name) => !selectedOptions[header].includes(name));
        }
        return filters[header];
      }
    } else {
      if (isUniversityFilterKey(header)) {
        if (header === "University Name" && mode === "Compare") {
          return filters[header].filter((name) => !selectedOptions[header].includes(name));
        }
        return filters[header];
      }
    }
    return [];
  };

  const handleEducationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as "schools" | "universities" | "vocational" | "";
    setEducationType(type);
    
    const currentFilters = type === "universities" 
      ? universityFilters 
      : type === "vocational"
        ? vocationalFilters
        : filterOptions;
      
    setSelectedOptions(
      Object.keys(currentFilters).reduce((acc, header) => {
        acc[header] = [];
        return acc;
      }, {} as Record<string, string[]>)
    );
    
    setIsFilterActive(false);
    setEditableSentence("");
    setUserModifiedSentence(false);
    setUserAdditions("");
    setLastGeneratedSentence("");
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, header: string) => {
    const value = e.target.value;

    if (value && value !== "Select...") {
      setSelectedOptions((prevState) => {
        if (!isFilterActive) {
          setIsFilterActive(true);
        }

        let updatedState = { ...prevState };

        if ((header === "Institute Name" && educationType === "schools" && mode === "Compare") ||
            (header === "University Name" && educationType === "universities" && mode === "Compare") ||
            (header === "Vocational Center Name" && educationType === "vocational" && mode === "Compare")) {
          if (!updatedState[header]) {
            updatedState[header] = [];
          }
          if (!updatedState[header].includes(value)) {
            updatedState[header] = [...updatedState[header], value];
          }
        } else {
          updatedState = {
            ...prevState,
            [header]: [value],
          };
          
          if (educationType === "schools" && header === "Institute Classification") {
            updatedState["Institute Level"] = [];
            updatedState["Location"] = [];
            updatedState["Institute Name"] = [];
            updatedState["Report Year"] = [];
          } else if (header === "Institute Level") {
            updatedState["Institute Name"] = [];
          } else if (educationType === "vocational" && header === "Center Classification") {
            updatedState["Center Location"] = [];
            updatedState["Vocational Center Name"] = [];
            updatedState["Report Year"] = [];
          }
        }

        return updatedState;
      });
    }
  };



  const removeTag = (header: string, value: string) => {
    setSelectedOptions((prevState) => {
      const updatedOptions = {
        ...prevState,
        [header]: prevState[header].filter((v) => v !== value),
      };

      if (educationType === "schools") {
        if (header === "Institute Classification") {
          updatedOptions["Institute Level"] = [];
          updatedOptions["Location"] = [];
          updatedOptions["Institute Name"] = [];
          updatedOptions["Report Year"] = [];
        } else if (header === "Institute Level") {
          updatedOptions["Institute Name"] = [];
        }
      }

      const isStillActive = Object.values(updatedOptions).some((selections) => selections.length > 0);
      setIsFilterActive(isStillActive);

      if (!isStillActive) {
        setEditableSentence("");
        setUserModifiedSentence(false);
        setUserAdditions("");
        setLastGeneratedSentence("");
      }

      return updatedOptions;
    });
  };

  const generateSentence = () => {
    const parts: string[] = [];
    if (mode) parts.push(`${mode} insights for`);
    
    if (educationType === "schools") {
      if (selectedOptions["Institute Classification"]?.length > 0)
        parts.push(`classification ${selectedOptions["Institute Classification"].join(", ")}`);
      if (selectedOptions["Institute Level"]?.length > 0)
        parts.push(`institute level is ${selectedOptions["Institute Level"].join(", ")}`);
      if (selectedOptions["Location"]?.length > 0)
        parts.push(`location is in ${selectedOptions["Location"].join(", ")}`);
      if (selectedOptions["Institute Name"]?.length > 0)
        parts.push(`institute name is ${selectedOptions["Institute Name"].join(", ")}`);
      if (selectedOptions["Report Year"]?.length > 0)
        parts.push(`report year is ${selectedOptions["Report Year"].join(", ")}`);
    } else if (educationType === "universities") {
      if (selectedOptions["University Name"]?.length > 0)
        parts.push(`university name is ${selectedOptions["University Name"].join(", ")}`);
      if (selectedOptions["Programme Name"]?.length > 0)
        parts.push(`programme name is ${selectedOptions["Programme Name"].join(", ")}`);
      if (selectedOptions["Programme Judgment"]?.length > 0)
        parts.push(`programme judgment is ${selectedOptions["Programme Judgment"].join(", ")}`);
    } else if (educationType == "vocational"){
      if (selectedOptions["Vocational Center Name"]?.length > 0)
        parts.push(`Vocational Training Center name is ${selectedOptions["Vocational Center Name"].join(", ")}`);
      if (selectedOptions["Center Location"]?.length > 0)
        parts.push(`Vocational Training Center location is ${selectedOptions["Center Location"].join(", ")}`);
      if (selectedOptions["Report Year"]?.length > 0)
        parts.push(`report year is ${selectedOptions["Report Year"].join(", ")}`);
    }
    
    return parts.length > 0 ? `Insights for: ${parts.join(", ")}.` : "";
  };

  const handleSentenceEdit = () => {
    if (!editableSentence) {
      setEditableSentence(generateSentence());
    }
    setIsEditing(true);
  };

  const handleSentenceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newSentence = e.target.value;
    setEditableSentence(newSentence);
    setUserModifiedSentence(true);
    const addition = newSentence.replace(lastGeneratedSentence, "");
    setUserAdditions(addition);
  };

  const handleSentenceSave = () => {
    setIsEditing(false);
    setLastGeneratedSentence(generateSentence());
    showMessage("Sentence updated successfully", "success");
  };

  const showMessage = (message: string, type: "success" | "error") => {
    setSubmittedMessage(message);
    setMessageType(type);
    setTimeout(() => {
      setSubmittedMessage(null);
      setMessageType(null);
    }, 3000);
  };


  

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const sentence = editableSentence;

    if (mode === "Compare") {
      const comparisonKey = educationType === "schools" ? "Institute Name" : "University Name";
      if (!selectedOptions[comparisonKey] || selectedOptions[comparisonKey].length < 2) {
        showMessage(`Please select at least two ${educationType === "schools" ? "institutes" : "universities"} to compare.`, "error");
        return;
      }
    
      if (!Array.isArray(selectedOptions[comparisonKey]) || selectedOptions[comparisonKey].length < 2) {
        if (educationType === "schools" && (!Array.isArray(selectedOptions["Institute Name"]) || selectedOptions["Institute Name"].length < 2)) {
          showMessage("Please select at least two institutes in Compare mode.", "error");
          return;
        } else if (educationType === "universities" && (!Array.isArray(selectedOptions["University Name"]) || selectedOptions["University Name"].length < 2)) {
          showMessage("Please select at least two universities in Compare mode.", "error");
          return;
        }
      }
    }

    const requiredFilters = educationType === "schools" ? ["Institute Name"] : ["University Name"];
    const missingFilters = requiredFilters.filter((filter) => selectedOptions[filter].length === 0);

    if (missingFilters.length > 0) {
      showMessage(`Please select options for: ${missingFilters.join(", ")}`, "error");
      return;
    }

    if (sentence) {
      try {
        setLoading(true); // Set loading state to true when starting the request
        
        let submissionOptions = { ...selectedOptions };
        
        if (educationType === "schools" && (!selectedOptions["Report Year"]?.length) && latestYear) {
          submissionOptions = {
            ...submissionOptions,
            "Report Year": [latestYear]
          };
        }

        const prompt = {
          userMessage: sentence,
          educationType,
          ...(educationType === "schools" ? {
            classification: submissionOptions["Institute Classification"],
            level: submissionOptions["Institute Level"],
            location: submissionOptions["Location"],
            instituteName: submissionOptions["Institute Name"],
            reportYear: submissionOptions["Report Year"]
          } : {
            universityName: submissionOptions["University Name"],
            programmeName: submissionOptions["Programme Name"],
            programmeJudgment: submissionOptions["Programme Judgment"]
          })
        };

        const response = await fetch(`${import.meta.env.VITE_API_URL}/invokeBedrockAgent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(prompt),
        });

        const body = await response.json();
        setBedrockResponse(body.response);
        showMessage("Data successfully received!", "success");

//-------------------- chart generation connection logic Start -----------------------------------------------------------------------
        if (educationType === "schools" && selectedOptions["Institute Name"].length > 0) {
          const slots = {
            AnalyzeSchoolSlot:
              mode === "Analyze" && educationType === "schools" ? selectedOptions["Institute Name"][0] : undefined,
            CompareSpecificInstitutesSlot:
              mode === "Compare" && educationType === "schools" ? selectedOptions["Institute Name"].join(", ") : undefined,
            CompareSchoolSlot: undefined,
            AnalyzeVocationalSlot: undefined,
            CompareUniversityWUniSlot: undefined,
            CompareUniversityWProgramsSlot: undefined,
            CompareVocationalSlot: undefined,
            ProgramNameSlot: undefined,
          };
        
          setChartSlots(slots);
          console.log("Updated chart slots:", slots);
        } else if (educationType === "universities" && selectedOptions["University Name"].length > 0) {
          const slots = {
            AnalyzeUniversityNameSlot:
              mode === "Analyze" && educationType === "universities" ? selectedOptions["University Name"][0] : undefined,
            CompareUniversityWprogUniversityNameSlot:
              mode === "Compare" && educationType === "universities" ? selectedOptions["University Name"].join(", ") : undefined,
            CompareUniversityWprogSlot:
              mode === "Compare" && educationType === "universities" && selectedOptions["Programme Name"].length > 0
                ? selectedOptions["Programme Name"].join(", ")
                : undefined,
            AnalyzeSchoolSlot: undefined,
            CompareSpecificInstitutesSlot: undefined,
            CompareSchoolSlot: undefined,
            CompareVocationalSlot: undefined,
            ProgramNameSlot:
              mode === "Analyze" && educationType === "universities" && selectedOptions["Programme Name"].length > 0
                ? selectedOptions["Programme Name"][0]
                : undefined,
          };
        
          setChartSlots(slots);
          console.log("Updated chart slots:", slots);
        } else if (educationType === "vocational" && selectedOptions["Institute Name"].length > 0) {
          const slots = {
            AnalyzeVocationalSlot:
              mode === "Analyze" && educationType === "vocational" ? selectedOptions["Institute Name"][0] : undefined,
            CompareVocationalSlot:
              mode === "Compare" && educationType === "vocational" ? selectedOptions["Institute Name"].join(", ") : undefined,
            AnalyzeSchoolSlot: undefined,
            CompareSpecificInstitutesSlot: undefined,
            CompareSchoolSlot: undefined,
            CompareUniversityWUniSlot: undefined,
            CompareUniversityWProgramsSlot: undefined,
            ProgramNameSlot: undefined,
          };
        
          setChartSlots(slots);
          console.log("Updated chart slots:", slots);
        }        
//-------------------- chart generation connection logic End -----------------------------------------------------------------------

        console.log("API Response:", body);
        showMessage("Data successfully sent to the server!", "success");
      } catch (error) {
        console.error("Error:", error);
        showMessage("An error occurred. Please try again.", "error");
      } finally {
        setLoading(false); // Reset loading state regardless of success or failure
      }
    } else {
      showMessage("Please select options.", "error");
    }
  };



  const handleClear = () => {
    const currentFilters = getCurrentFilters();
    setSelectedOptions(
      Object.keys(currentFilters).reduce((acc, header) => {
        acc[header] = [];
        return acc;
      }, {} as Record<string, string[]>)
    );
    setMode("");
    setIsFilterActive(false);
    setEditableSentence("");
    setUserModifiedSentence(false);
    setUserAdditions("");
    setLastGeneratedSentence("");
    setBedrockResponse(null);
  };



  return (
    <div className="p-6">
      {/* Pop-Up Message */}
      {submittedMessage && (
        <div
          className={`fixed top-4 right-4 z-99999 px-6 py-4 rounded-md shadow-md ${
            messageType === "success" ? "bg-secondary text-white" : "bg-danger text-white"
          }`}
        >
          {submittedMessage}
        </div>
      )}
        <div className="flex flex-wrap items-center mb-4 gap-4">
          <div className="flex gap-3 flex-col sm:flex-row flex-1">
            <label className="block font-semibold text-2xl mr-4 text-nowrap">Insight</label>
            <select
              className="p-2 border rounded text-sm grow max-w-48"
              value={mode}
              onChange={(e) => setMode(e.target.value as "Compare" | "Analyze" | "")}
            >
              <option value="">Select...</option>
              <option value="Compare">Compare</option>
              <option value="Analyze">Analyze</option>
            </select>
          </div>

          <div className="flex gap-3 flex-col sm:flex-row flex-1">
            <label className="block font-semibold text-2xl mr-4 text-nowrap">Education Level</label>
            <select
              className="p-2 border rounded text-sm grow max-w-48"
              value={educationType}
              onChange={handleEducationTypeChange}
            >
              <option value="">Select...</option>
              <option value="schools">Schools</option>
              <option value="universities">Universities</option>
              <option value="vocational">Vocational Centers</option>
            </select>
          </div>
        </div>

        {mode && educationType && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Object.keys(getCurrentFilters()).map((header) => (
                <div key={header} className="w-full">
                  <label className="block text-sm font-semibold mb-2">{header}</label>
                  
                  {((educationType === "schools" && header === "Institute Name") ||
                    (educationType === "universities" && header === "University Name")) &&
                    
                  mode === "Compare" ? (
                    <select
                      className="p-2 border rounded text-sm w-full"
                      onChange={(e) => handleSelectChange(e, header)}
                      value="Select..."
                    >
                      <option value="Select...">Select...</option>
              {getFilterValues(header)
                .filter(option => {
                  if ((header === "Institute Name" || header === "University Name") && mode === "Compare") {
                    return !selectedOptions[header]?.includes(option);
                  }
                  return true;
                })
                .map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
                    </select>
                  ) : (
                    <select
                      className="p-2 border rounded text-sm w-full"
                      onChange={(e) => handleSelectChange(e, header)}
                      value={selectedOptions[header]?.length ? selectedOptions[header][0] : "Select..."}
                    >
                      <option value="Select...">Select...</option>
                      {getFilterValues(header).map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

              <div className="mt-4">
                {Object.keys(selectedOptions).map((header) =>
                  selectedOptions[header].map((value, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 m-1 text-sm font-medium text-gray-800 bg-gray-200 rounded-full"
                    >
                      {value}
                      <button
                        type="button"
                        className="ml-2 text-danger hover:text-red-700"
                        onClick={() => removeTag(header, value)}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>

              {isFilterActive && (
                <>
                  <div className="mt-6 p-4 bg-lightblue text-white rounded text-sm w-full">
                    {isEditing ? (
                      <textarea
                        value={editableSentence}
                        onChange={handleSentenceChange}
                        rows={4}
                        className="w-full bg-transparent border-none focus:ring-2 focus:ring-primary"
                      />
                    ) : (
                      <div 
                        onClick={handleSentenceEdit} 
                        className="cursor-text hover:bg-blue-600 transition-colors duration-200 p-1 rounded relative group"
                        title="Click to edit"
                      >
                        {editableSentence || generateSentence()}
                        <span className="inline-block opacity-0 group-hover:opacity-100 animate-pulse">|</span>
                      </div>
                    )}
                  </div>
                 
                  
                  {isEditing && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={handleSentenceSave}
                        className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                      >
                        Save
                      </button>
                    </div>
                  )}
                  
                  <div className="mt-6 text-center">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`px-6 py-2 bg-primary text-white rounded-md ${
                loading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-primary-dark'
              } relative`}
            >
              {loading ? (
                <>
                  <span className="opacity-0">Submit</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  </div>
                </>
              ) : (
                'Submit'
              )}

                    </button>
                    <button
                      onClick={handleClear}
                      disabled={loading}
                      className="ml-4 px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}
            </>
          )}
                    {bedrockResponse && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Analysis Results</h3>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="prose max-w-none">
                  {bedrockResponse.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
          
      </div>
  );
};


export default Filter;