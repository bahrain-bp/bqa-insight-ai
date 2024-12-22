import React, { useState, useEffect } from "react";

const Filter = () => {
  const [mode, setMode] = useState<"Compare" | "Analyze" | "">("");
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({
    "Institute Type": ["Schools", "Universities", "Vocational Institutes"],
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
      const instituteType = selectedOptions["Institute Type"][0];
      if (!instituteType) return;

      // Convert the frontend institute type to backend format
      let backendInstituteType = "";
      switch (instituteType) {
        case "Universities":
          backendInstituteType = "university";
          break;
        case "Schools":
          backendInstituteType = "school";
          break;
        case "Vocational Institutes":
          backendInstituteType = "vocational";
          break;
        default:
          return;
      }

      try {
        const params = new URLSearchParams();
        params.append("instituteType", backendInstituteType);
        
        if (selectedOptions["Institute Level"].length) {
          params.append("level", selectedOptions["Institute Level"][0]);
        }
        if (selectedOptions["Location"].length) {
          params.append("location", selectedOptions["Location"][0]);
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/fetchfilters?${params.toString()}`);
        const data = await response.json();
        console.log("Fetched filter options:", data.filters);
        setFilterOptions(prevOptions => ({
          ...data.filters,
          "Institute Type": prevOptions["Institute Type"] // Preserve the static Institute Type options
        }));
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };

    fetchFilterOptions();
  }, [selectedOptions["Institute Type"], selectedOptions["Institute Level"], selectedOptions["Location"]]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, header: string) => {
    const value = e.target.value;

    if (value && value !== "Select...") {
      setSelectedOptions((prevState) => {
        if (!isFilterActive) {
          setIsFilterActive(true);
        }

        // Reset dependent fields based on Institute Type selection
        if (header === "Institute Type") {
          return {
            ...prevState,
            "Institute Type": [value],
            "Institute Classification": [],
            "Institute Level": [],
            "Location": [],
            "Institute Name": [],
            "Report Year": []
          };
        }

        // Reset dependent fields based on other selections
        if (header === "Institute Level") {
          return {
            ...prevState,
            "Institute Level": [value],
            "Institute Name": [],
          };
        }

        if (header === "Location") {
          return {
            ...prevState,
            "Location": [value],
          };
        }

        const previousValues = prevState[header];
        return {
          ...prevState,
          [header]: previousValues.includes(value) ? previousValues : [...previousValues, value],
        };
      });
    }
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

          {/* Render all filters including Institute Type */}
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

              {/* Rest of the JSX remains the same */}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Filter;