import React, { useState, useEffect } from "react";


const Filter = () => {
  const [mode, setMode] = useState<"Compare" | "Analyze" | "">("");
  const [educationType, setEducationType] = useState<"schools" | "universities" | "vocational" | "">("");
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({
    "Institute Classification": [],
    "Institute Level": [],
    "Location": [],
    "Institute Name": [],
    "Report Year": [],
  });
  const [universityFilters, setUniversityFilters] = useState({
    "University Name": [],
    "Programme Name": [],
    "Programme Judgment": []
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

        const response = await fetch(`${import.meta.env.VITE_API_URL}/fetchfilters?${prompt.toString()}`);
        const data = await response.json();
        
        if (educationType === "schools") {
          setFilterOptions(data.filters);
        } else if (educationType === "universities") {
          setUniversityFilters(data.universityFilters);
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
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
  
  // Type guard to check if a string is a valid key of UniversityFilters
  function isUniversityFilterKey(key: string): key is keyof UniversityFilters {
    return ["University Name", "Programme Name", "Programme Judgment"].includes(key);
  }
  
  // Type guard to check if the filters are SchoolFilters
  function isSchoolFilters(filters: SchoolFilters | UniversityFilters): filters is SchoolFilters {
    return "Institute Classification" in filters;
  }
  
  const getCurrentFilters = (): SchoolFilters | UniversityFilters => {
    if (educationType === "universities") {
      return {
        "University Name": universityFilters["University Name"] || [],
        "Programme Name": universityFilters["Programme Name"] || [],
        "Programme Judgment": universityFilters["Programme Judgment"] || [],
      };
    } else {
      return {
        "Institute Classification": filterOptions["Institute Classification"] || [],
        "Institute Level": filterOptions["Institute Level"] || [],
        "Location": filterOptions["Location"] || [],
        "Institute Name": filterOptions["Institute Name"] || [],
        "Report Year": filterOptions["Report Year"] || [],
      };
    }
  };

  // Helper function to safely access filter values
  const getFilterValues = (header: string): string[] => {
    const filters = getCurrentFilters();
  
    if (isSchoolFilters(filters)) {
      if (isSchoolFilterKey(header)) {
        return filters[header];
      }
    } else {
      if (isUniversityFilterKey(header)) {
        // Exclude selected universities in Compare mode
        if (header === "University Name" && mode === "Compare") {
          return filters[header].filter((name) => !selectedOptions[header].includes(name));
        }
        return filters[header];
      }
    }
    return [];
  };
  


  

  const handleEducationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as "schools" | "universities" | "";
    setEducationType(type);
    
    // Reset selected options without clearing the mode
    const currentFilters = type === "universities" 
      ? universityFilters 
      : filterOptions;
      
    setSelectedOptions(
      Object.keys(currentFilters).reduce((acc, header) => {
        acc[header] = [];
        return acc;
      }, {} as Record<string, string[]>)
    );
    
    // Reset other state variables except mode
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

      // Initialize array if it doesn't exist
      if (!updatedState[header]) {
        updatedState[header] = [];
      }

      // Handle Compare mode for both schools and universities for multi-select
    // Handle multi-select for "Compare" mode
    if (mode === "Compare" && educationType === "universities" && header === "University Name") {
      // Add only unique selections
      if (!updatedState[header].includes(value)) {
        updatedState[header] = [...updatedState[header], value];
      }
      return updatedState;
    }

      // Handle all other cases
      if (educationType === "schools") {
        if (header === "Institute Classification") {
          updatedState = {
            ...prevState,
            "Institute Classification": [value],
            "Institute Level": [],
            "Location": [],
            "Institute Name": [],
            "Report Year": []
          };
        } else if (header === "Institute Level") {
          updatedState = {
            ...prevState,
            "Institute Level": [value],
            "Institute Name": [],
          };
        } else if (header === "Location") {
          updatedState = {
            ...prevState,
            "Location": [value],
          };
        } else {
          updatedState = {
            ...prevState,
            [header]: [value],
          };
        }
      } else if (educationType === "universities") {
        updatedState = {
          ...prevState,
          [header]: [value],
        };
      } if (header === "University Name" && mode === "Compare" && educationType === "universities") {
        updatedState = {
          ...prevState,
          [header]: [...(prevState[header] || []), value],
          };
        } else {
          updatedState = {
            ...prevState,
            [header]: [value],
          };
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


    if (mode === "Compare" && educationType === "universities") {
      const selectedUniversities = selectedOptions["University Name"] || [];
  
      if (selectedUniversities.length < 2) {
        showMessage("Please select at least two universities in Compare mode.", "error");
        return;
      }
  
      console.log("Comparing the following universities:", selectedUniversities);
    }



    if (mode === "Compare") {
      const comparisonKey = educationType === "schools" ? "Institute Name" : "University Name";

      if (!Array.isArray(selectedOptions[comparisonKey]) || selectedOptions[comparisonKey].length < 2) {
        // Check multi-select for Institute Name in schools table
        if (!Array.isArray(selectedOptions["Institute Name"]) || selectedOptions["Institute Name"].length < 2) {
          showMessage("Please select at least two institutes in Compare mode.", "error");
          return;
        }
        console.log("Comparing the following institutes:", selectedOptions["Institute Name"]);
      } else if (educationType === "universities") {
        // Check multi-select for University Name in universities table
        if (!Array.isArray(selectedOptions["University Name"]) || selectedOptions["University Name"].length < 2) {
          showMessage("Please select at least two universities in Compare mode.", "error");
          return;
        }
        console.log("Comparing the following universities:", selectedOptions["University Name"]);
      } else {
        showMessage("Invalid education type selected.", "error");
        return;
      }
    
      // Proceed with comparison logic based on selected items
      console.log("Comparison successful for education type:", educationType);
    } 
    

    const requiredFilters = educationType === "schools" ? ["Institute Name"] : ["University Name"];
    const missingFilters = requiredFilters.filter((filter) => selectedOptions[filter].length === 0);

    if (missingFilters.length > 0) {
      showMessage(`Please select options for: ${missingFilters.join(", ")}`, "error");
      return;
    }

    if (sentence) {
      try {
        const prompt = {
          userMessage: sentence,
          educationType,
          ...(educationType === "schools" ? {
            classification: selectedOptions["Institute Classification"],
            level: selectedOptions["Institute Level"],
            location: selectedOptions["Location"],
            instituteName: selectedOptions["Institute Name"],
            reportYear: selectedOptions["Report Year"]
          } : {
            universityName: selectedOptions["University Name"],
            programmeName: selectedOptions["Programme Name"],
            programmeJudgment: selectedOptions["Programme Judgment"]
          })
        };

        const response = await fetch(`${import.meta.env.VITE_API_URL}/invokeBedrockAgent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(prompt),
        });

        const body = await response.json();
        console.log("API Response:", body);
        showMessage("Data successfully sent to the server!", "success");
      } catch (error) {
        console.error("Error sending data to Bedrock:", error);
        showMessage("An error occurred. Please try again.", "error");
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
        <div className="flex items-center mb-4 space-x-8">
          <div className="flex items-center flex-1">
            <label className="block font-semibold text-2xl mr-4">Insighting To</label>
            <select
              className="p-2 border rounded text-sm w-48"
              value={mode}
              onChange={(e) => setMode(e.target.value as "Compare" | "Analyze" | "")}
            >
              <option value="">Select...</option>
              <option value="Compare">Compare</option>
              <option value="Analyze">Analyze</option>
            </select>
          </div>

          <div className="flex items-center flex-1">
            <label className="block font-semibold text-2xl mr-4">Education Level</label>
            <select
              className="p-2 border rounded text-sm w-48"
              value={educationType}
              onChange={handleEducationTypeChange}
            >
              <option value="">Select...</option>
              <option value="schools">Schools</option>
              <option value="universities">Universities</option>
            </select>
          </div>
        </div>

        {mode && educationType && (
          <>
            <div className="grid grid-cols-4 gap-6">
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
                        .filter(option => !selectedOptions[header]?.includes(option))
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
                      <span onClick={handleSentenceEdit} className="cursor-pointer">
                        {editableSentence || generateSentence()}
                      </span>
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
                      className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                    >
                      Submit
                    </button>
                    <button
                      onClick={handleClear}
                      className="ml-4 px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}
            </>
          )}
      </div>
  );
};


export default Filter;