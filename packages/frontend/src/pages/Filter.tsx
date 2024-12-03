import React, { useState } from 'react';

const Filter = () => {
  // State to hold the selected options
  const [selectedOptions, setSelectedOptions] = useState({
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    option5: ''
  });

  // State to hold the message after submission
  const [submittedMessage, setSubmittedMessage] = useState('');

  // Handle dropdown change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, option: string) => {
    setSelectedOptions(prevState => ({
      ...prevState,
      [option]: e.target.value
    }));
  };

  // Construct the text to display selected options
  const selectedText = Object.keys(selectedOptions)
    .filter(option => selectedOptions[option as keyof typeof selectedOptions])
    .map(option => `${selectedOptions[option as keyof typeof selectedOptions]}`)
    .join(' and ');

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
            {/* Dropdowns (Thinner search bar section) */}
            <select
              className="w-1/6 p-2 border rounded"
              value={selectedOptions.option1}
              onChange={(e) => handleSelectChange(e, 'option1')}
            >
              <option value="">Select Option 1</option>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </select>

            <select
              className="w-1/6 p-2 border rounded"
              value={selectedOptions.option2}
              onChange={(e) => handleSelectChange(e, 'option2')}
            >
              <option value="">Select Option 2</option>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </select>

            <select
              className="w-1/6 p-2 border rounded"
              value={selectedOptions.option3}
              onChange={(e) => handleSelectChange(e, 'option3')}
            >
              <option value="">Select Option 3</option>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </select>

            <select
              className="w-1/6 p-2 border rounded"
              value={selectedOptions.option4}
              onChange={(e) => handleSelectChange(e, 'option4')}
            >
              <option value="">Select Option 4</option>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </select>

            <select
              className="w-1/6 p-2 border rounded"
              value={selectedOptions.option5}
              onChange={(e) => handleSelectChange(e, 'option5')}
            >
              <option value="">Select Option 5</option>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </select>
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
            {/* Example of filter boxes manually placed (limit to 3 boxes) */}
            <div className="bg-blue-200 text-blue-800 py-2 px-6 text-xl rounded-full shadow-md">
              Filter 1
            </div>
            <div className="bg-blue-200 text-blue-800 py-2 px-6 text-xl rounded-full shadow-md">
              Filter 2
            </div>
            <div className="bg-blue-200 text-blue-800 py-2 px-6 text-xl rounded-full shadow-md">
              Filter 3
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filter;
