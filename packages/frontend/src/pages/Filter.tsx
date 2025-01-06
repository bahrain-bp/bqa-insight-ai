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
        
        // Apply dependencies for schools regardless of mode
        if (educationType === "schools") {
          if (selectedOptions["Institute Classification"]?.length) {
            prompt.append("classification", selectedOptions["Institute Classification"][0]);
          }
          if (selectedOptions["Institute Level"]?.length) {
            prompt.append("level", selectedOptions["Institute Level"][0]);
          }
          if (selectedOptions["Location"]?.length) {
            prompt.append("location", selectedOptions["Location"][0]);
          }
          if (selectedOptions["Institute Name"]?.length) {
            prompt.append("instituteName", selectedOptions["Institute Name"][0]);
          }
        } else {
          // For universities and vocational, only apply dependencies if NOT in Compare mode
          if (mode !== "Compare") {
            if (selectedOptions["University Name"]?.length) {
              prompt.append("universityName", selectedOptions["University Name"][0]);
            }
            if (selectedOptions["Programme Name"]?.length) {
              prompt.append("programmeName", selectedOptions["Programme Name"][0]);
            }
            if (selectedOptions["Vocational Center Name"]?.length) {
              prompt.append("vocationalCenterName", selectedOptions["Vocational Center Name"][0]);
            }
          }
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/fetchfilters?${prompt.toString()}`);
    
        if (!response.ok) {
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
  }, [
    // Only include selectedOptions in dependency array for schools
    // or for universities/vocational when not in Compare mode
    educationType === "schools" || mode !== "Compare" ? selectedOptions : null,
    educationType
  ]);

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
    // Special handling for Compare mode
    if (mode === "Compare") {
      if (educationType === "schools" && header === "Institute Name") {
        return filterOptions["Institute Name"] || [];
      } else if (educationType === "universities" && header === "University Name") {
        return universityFilters["University Name"] || [];
      } else if (educationType === "vocational" && header === "Vocational Center Name") {
        return vocationalFilters["Vocational Center Name"] || [];
      }
    }
  
    // For other cases, use the filtered values
    const filters = getCurrentFilters();
    
    if (isSchoolFilters(filters)) {
      if (isSchoolFilterKey(header)) {
        return filters[header] || [];
      }
    } else if (isVocationalFilters(filters)) {
      if (isVocationalFilterKey(header)) {
        return filters[header] || [];
      }
    } else {
      if (isUniversityFilterKey(header)) {
        return (filters[header] as string[]) || [];
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
        const updatedState = { ...prevState };
        
        // Check if we're in compare mode and dealing with a comparison field
        const isCompareField = mode === "Compare" && (
          (educationType === "schools" && header === "Institute Name") ||
          (educationType === "universities" && header === "University Name") ||
          (educationType === "vocational" && header === "Vocational Center Name")
        );
  
        if (isCompareField) {
          // For comparison fields, allow multiple selections
          const currentSelections = prevState[header] || [];
          if (!currentSelections.includes(value)) {
            updatedState[header] = [...currentSelections, value];
          }
          return updatedState;
        }
  
        // For non-compare mode or non-comparison fields
        updatedState[header] = [value];
        
        // Only apply dependencies for schools
        if (educationType === "schools") {
          if (header === "Institute Classification") {
            updatedState["Institute Level"] = [];
            updatedState["Location"] = [];
            updatedState["Institute Name"] = [];
            updatedState["Report Year"] = [];
          } else if (header === "Institute Level") {
            updatedState["Institute Name"] = [];
          }
        }
  
        return updatedState;
      });

      if (!isFilterActive) {
        setIsFilterActive(true);
      }
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
      let comparisonKey;
      if (educationType === "schools") {
        comparisonKey = "Institute Name";
      } else if (educationType === "universities") {
        comparisonKey = "University Name";
      } else if (educationType === "vocational") {
        comparisonKey = "Vocational Center Name";
      }

      if (!comparisonKey || !selectedOptions[comparisonKey] || selectedOptions[comparisonKey].length < 2) {
        const entityType = educationType === "schools" 
          ? "institutes" 
          : educationType === "universities" 
            ? "universities" 
            : "vocational centers";
        showMessage(`Please select at least two ${entityType} to compare.`, "error");
        return;
      }
    }

    const requiredFilters: string[] = (() => {
      switch (educationType) {
        case "schools":
          return ["Institute Name"];
        case "universities":
          return ["University Name"];
        case "vocational":
          return ["Vocational Center Name"];
        default:
          return [];
      }
    })();

    const missingFilters = requiredFilters.filter((filter) => !selectedOptions[filter] || selectedOptions[filter].length === 0);

    if (missingFilters.length > 0) {
      showMessage(`Please select options for: ${missingFilters.join(", ")}`, "error");
      return;
    }

    if (sentence) {
      try {
        setLoading(true);
        
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
          } : educationType === "universities" ? {
            universityName: submissionOptions["University Name"],
            programmeName: submissionOptions["Programme Name"],
            programmeJudgment: submissionOptions["Programme Judgment"]
          } : {
            vocationalCenterName: submissionOptions["Vocational Center Name"],
            centerLocation: submissionOptions["Center Location"],
            reportYear: submissionOptions["Report Year"]
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
        // Generate slots for schools when the user has selected one or more institute names
        if (educationType === "schools" && selectedOptions["Institute Name"].length > 0) {
          const slots = {
            // Slot for analyzing a specific school, using the first selected institute name if in "Analyze" mode
            AnalyzeSchoolSlot:
              mode === "Analyze" && educationType === "schools" ? selectedOptions["Institute Name"][0] : undefined,
            // Slot for comparing multiple schools, joining selected institute names with a comma if in "Compare" mode
            CompareSpecificInstitutesSlot:
              mode === "Compare" && educationType === "schools" ? selectedOptions["Institute Name"].join(", ") : undefined,
          };
        
          // Update the chart slots state with the newly generated slots for schools
          setChartSlots(slots);
          console.log("Updated chart slots:", slots); // Log the updated slots for debugging purposes
        } else if (educationType === "universities" && selectedOptions["University Name"].length > 0) {
          // Generate slots for universities when the user has selected one or more university names
          const slots = {
            // Slot for analyzing a specific university, using the first selected university name if in "Analyze" mode
            AnalyzeUniversityNameSlot:
              mode === "Analyze" && educationType === "universities" ? selectedOptions["University Name"][0] : undefined,
            // Slot for comparing multiple universities by name, joining selected names with a comma if in "Compare" mode
            CompareUniversityUniSlot:
              mode === "Compare" && educationType === "universities" ? selectedOptions["University Name"].join(", ") : undefined,
            // Slot for comparing programs across multiple universities
            CompareUniversityWprogSlot:
              mode === "Compare" && educationType === "universities" && selectedOptions["Programme Name"].length > 0
                ? selectedOptions["Programme Name"].join(", ")
                : undefined,
            // Slot for comparing specific universities with specific programs
            CompareUniversityWprogUniversityNameSlot:
                mode === "Compare" && educationType === "universities" && selectedOptions["University Name"].length > 0 && selectedOptions["Programme Name"].length > 0
                  ? `${selectedOptions["University Name"].join(", ")}|${selectedOptions["Programme Name"].join(", ")}`
                  : undefined,   
            // Slot for analyzing a specific program if in "Analyze" mode           
            ProgramNameSlot:
              mode === "Analyze" && educationType === "universities" && selectedOptions["Programme Name"].length > 0
                ? selectedOptions["Programme Name"][0]
                : undefined,
          };
           // Update the chart slots state with the newly generated slots for universities
          setChartSlots(slots);
          console.log("Updated chart slots:", slots); // Log the updated slots for debugging purposes
        } else if (educationType === "vocational" && selectedOptions["Vocational Center Name"].length > 0) {
          // Generate slots for vocational centers when the user has selected one or more vocational center names
          const slots = {
            // Slot for analyzing a specific vocational center, using the first selected center name if in "Analyze" mode
            AnalyzeVocationalSlot:
              mode === "Analyze" && educationType === "vocational" ? selectedOptions["Vocational Center Name"][0] : undefined,
            // Slot for comparing multiple vocational centers, joining selected center names with a comma if in "Compare" mode
              CompareVocationalSlot:
              mode === "Compare" && educationType === "vocational" ? selectedOptions["Vocational Center Name"].join(", ") : undefined,
          };
          // Update the chart slots state with the newly generated slots for vocational centers
          setChartSlots(slots);
          console.log("Updated chart slots:", slots); // Log the updated slots for debugging purposes
        }        
//-------------------- chart generation connection logic End -----------------------------------------------------------------------

        console.log("API Response:", body);
        showMessage("Data successfully sent to the server!", "success");
      } catch (error) {
        console.error("Error:", error);
        showMessage("An error occurred. Please try again.", "error");
      } finally {
        setLoading(false);
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
      {/* Inside the grid mapping of filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
  {Object.keys(getCurrentFilters()).map((header) => (
    <div key={header} className="w-full">
      <label className="block text-sm font-semibold mb-2">{header}</label>
      
      {((educationType === "schools" && header === "Institute Name") ||
  (educationType === "universities" && header === "University Name") ||
  (educationType === "vocational" && header === "Vocational Center Name")) &&
mode === "Compare" ? (

  <select
  className="p-2 border rounded text-sm w-full"
  onChange={(e) => handleSelectChange(e, header)}
  value="Select..."
>
    <option value="Select...">Select...</option>
    {getFilterValues(header).map((option) => (
      <option
        key={option}
        value={option}
          disabled={selectedOptions[header]?.includes(option)}
      >
          {option} {selectedOptions[header]?.includes(option) ? '(Selected)' : ''}
          </option>
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
      <option key={option} value={option}>
        {option}
      </option>
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