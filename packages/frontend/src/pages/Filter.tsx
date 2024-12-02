import React, { useState, useEffect } from 'react';

const Filter = () => {
  // State to hold the selected options
  const [selectedOptions, setSelectedOptions] = useState<string[]>(new Array(5).fill(''));
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [filters, setFilters] = useState<string[]>([]); // State to hold the fetched filters

  // Fetch filters from the API
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch('https://9wcytv1d0k.execute-api.us-east-1.amazonaws.com/filters'); // Replace with your API Gateway URL
        const data = await response.json();
        setFilters(data); // Assuming the data is an array of filter options
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    };

    fetchFilters();
  }, []);

  // Handle dropdown change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, index: number) => {
    const updatedOptions = [...selectedOptions];
    updatedOptions[index] = e.target.value;
    setSelectedOptions(updatedOptions);
  };

  // Construct the text to display selected options
  const selectedText = selectedOptions.filter(option => option).join(' and ');

  // Handle form submission
  const handleSubmit = () => {
    if (selectedText) {
      setSubmittedMessage(`You chose ${selectedText}`);
    } else {
      setSubmittedMessage('Please select options');
    }
  };

  return (
    <div className="flex justify-center mt-6 px-6">
      <div className="w-full max-w-3xl">
        <div className="bg-white p-6 rounded-md shadow-md">
          <div className="flex justify-between gap-2">
            {/* Dynamically Render Dropdowns */}
            {Array.from({ length: 5 }).map((_, index) => (
              <select
                key={index}
                className="w-1/6 p-2 border rounded"
                value={selectedOptions[index]}
                onChange={(e) => handleSelectChange(e, index)}
              >
                <option value="">Select Option {index + 1}</option>
                {filters.length > 0 ? (
                  filters.map((filter, i) => (
                    <option key={i} value={filter}>
                      {filter}
                    </option>
                  ))
                ) : (
                  <option value="">Loading options...</option>
                )}
              </select>
            ))}
          </div>

          {/* Text Box displaying selected options */}
          <div className="mt-6 p-4 border rounded bg-gray-50">
            {selectedText ? `You chose ${selectedText}` : 'Please select options'}
          </div>

          {/* Submit Button */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              style={{ backgroundColor: '#003366' }}
            >
              Submit
            </button>
          </div>

          {/* Display Submitted Message */}
          {submittedMessage && (
            <div className="mt-6 p-4 border rounded bg-green-50 text-green-700">
              {submittedMessage}
            </div>
          )}
        </div>

        {/* Filter Boxes Below the Search Bar and Form */}
        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-4">Previously Selected Filters:</h3>
          <div className="flex gap-4 flex-wrap">
            {selectedOptions.map((option, index) => (
              <div
                key={index}
                className="bg-blue-200 text-blue-800 py-2 px-6 text-xl rounded-full shadow-md"
              >
                {option || 'No selection'}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filter;
