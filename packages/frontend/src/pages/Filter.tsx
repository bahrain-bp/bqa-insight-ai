import React, { useState, useEffect } from "react";

const Filter = () => {
  const [mode, setMode] = useState<"Compare" | "Analyze" | "">("");
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

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(
    Object.keys(filterOptions).reduce((acc, header) => {
      acc[header] = [];
      return acc;
    }, {} as Record<string, string[]>)
  );

  const [editableSentence, setEditableSentence] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const params = new URLSearchParams();

        if (selectedOptions["Institute Classification"].length) {
          params.append("classification", selectedOptions["Institute Classification"][0]);
        }
        if (selectedOptions["Institute Level"].length) {
          params.append("level", selectedOptions["Institute Level"][0]);
        }
        if (selectedOptions["Location"].length) {
          params.append("location", selectedOptions["Location"][0]);
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/fetchfilters?${params.toString()}`);
        const data = await response.json();
        console.log("Fetched filter options:", data.filters);
        setFilterOptions(data.filters);
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };

    fetchFilterOptions();
  }, [selectedOptions]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, header: string) => {
    const value = e.target.value;

    if (value && value !== "Select...") {
      setSelectedOptions((prevState) => {
        const previousValues = prevState[header];

        if (!isFilterActive) {
          setIsFilterActive(true);
        }

        if (header === "Institute Classification") {
          setSelectedOptions({
            ...prevState,
            "Institute Classification": [value],
            "Institute Level": [],
            "Location": [],
            "Institute Name": [],
            "Report Year": []
          });
        } else if (header === "Institute Level") {
          setSelectedOptions({
            ...prevState,
            "Institute Level": [value],
            "Institute Name": [],
          });
        } else if (header === "Location") {
          setSelectedOptions({
            ...prevState,
            "Location": [value],
          });
        }

        return {
          ...prevState,
          [header]: previousValues.includes(value) ? previousValues : [...previousValues, value],
        };
      });
    }
  };

  const removeTag = (header: string, value: string) => {
    setSelectedOptions((prevState) => {
      const updatedOptions = {
        ...prevState,
        [header]: prevState[header].filter((v) => v !== value),
      };
      setIsFilterActive(Object.values(updatedOptions).some((selections) => selections.length > 0));
      return updatedOptions;
    });
  };

  const generateSentence = () => {
    const parts: string[] = [];
    if (mode) parts.push(`${mode} insights for`);
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
    return parts.length > 0 ? `Insights for: ${parts.join(", ")}.` : "";
  };

  const handleSentenceEdit = () => {
    // Ensure the sentence retains the previously modified sentence if any
    setEditableSentence((prevEditableSentence) => prevEditableSentence || generateSentence());
    setIsEditing(true);
  };

  const handleSentenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableSentence(e.target.value);
  };

  const handleSentenceSave = () => {
    setIsEditing(false);
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

    if (mode === "Compare" && selectedOptions["Institute Name"].length < 2) {
      showMessage("Please select at least two schools in Compare mode.", "error");
      return;
    }

    const requiredFilters = ["Institute Level", "Institute Name"];
    const missingFilters = requiredFilters.filter((filter) => selectedOptions[filter].length === 0);

    if (missingFilters.length > 0) {
      showMessage(`Please select options for: ${missingFilters.join(", ")}`, "error");
      return;
    }

    if (sentence) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/invokeBedrock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: sentence }),
        });
        const body = await response.json();
        console.log(body);
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
    setSelectedOptions(
      Object.keys(filterOptions).reduce((acc, header) => {
        acc[header] = [];
        return acc;
      }, {} as Record<string, string[]>)
    );
    setMode("");
    setIsFilterActive(false);
  };

  return (
    <div className="flex flex-col items-center px-8">
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

      <div className="w-full mt-4">
        <div className="bg-white p-6 rounded-md shadow-md w-full">
          <div className="flex items-center mb-4">
            <label className="block font-semibold text-2xl mr-10">Insighting To</label>
            <select
              className="p-2 border rounded text-sm w-1/4"
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as "Compare" | "Analyze");
                setSelectedOptions((prevState) => ({
                  ...prevState,
                  "Institute Name": [],
                }));
              }}
            >
              <option value="">Select...</option>
              <option value="Compare">Compare</option>
              <option value="Analyze">Analyze</option>
            </select>
          </div>

          {/* Conditionally Render Filters */}
          {mode && (
            <>
              <div className="grid grid-cols-4 gap-6">
                {Object.keys(filterOptions).map((header, index) => (
                  <div key={index} className="w-full">
                    <label className="block text-sm font-semibold mb-2">{header}</label>
                    <select
                      className="p-2 border rounded text-sm w-full"
                      onChange={(e) => handleSelectChange(e, header)}
                      value={selectedOptions[header].length ? selectedOptions[header][0] : "Select..."}
                    >
                      <option value="Select...">Select...</option>
                      {filterOptions[header].map((option, idx) => (
                        <option key={idx} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
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
                      <input
                        type="text"
                        value={editableSentence}
                        onChange={handleSentenceChange}
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
      </div>
    </div>
  );
};

export default Filter;
