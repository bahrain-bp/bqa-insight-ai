// ./SchoolReviews.tsx

import { useEffect, useState } from 'react';
import { SchoolReviewsFacts } from './SchoolReviewsComponents/SchoolReviewsFacts'; // Import the component
import { SchoolData } from './SchoolReviewsComponents/types'; // Importing the shared interface
import { ToggleSection } from './Components/ToggleSection'; // Import the reusable ToggleSection component

export function SchoolReviews() {
  const [data, setData] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // Optional: To handle errors

  useEffect(() => {
    // Fetch data from the API when the component mounts
    const fetchData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/fetchSchoolReviews`);
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          setData(json.data);
          console.log('Fetched Data:', json.data);
        } else {
          throw new Error("Invalid data format from API.");
        }
      } catch (error: any) { // Type assertion for error
        console.error("Error fetching schools:", error);
        setError(error.message || "An unexpected error occurred.");
      } finally {
        setLoading(false); // Stop loading regardless of success or failure
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gray-50 flex flex-col">
      {loading ? (
        // Spinner and Loading Text Container
        <div className="flex flex-col items-center justify-center space-y-4 flex-grow">
          {/* Spinner */}
          <div
            className="border-t-transparent border-8 border-blue-500 rounded-full w-16 h-16 animate-spin"
            role="status"
            aria-label="Loading"
          ></div>
          {/* Loading Text */}
          <p className="text-xl text-gray-700">Loading data...</p>
        </div>
      ) : error ? (
        // Error Message (Optional)
        <div className="flex-grow flex items-center justify-center text-red-500 text-center">
          <p>Error: {error}</p>
        </div>
      ) : (
        // Data Loaded Content with Toggle Sections
        <div className="w-full flex flex-col">
          {/* Facts Section */}
          <ToggleSection title="Facts" ariaControls="school-reviews-facts">
            <SchoolReviewsFacts data={data} />
          </ToggleSection>

          {/* Schools Ranking Section */}
          <ToggleSection title="Schools Ranking Table" ariaControls="school-reviews-ranking">
            {/* Placeholder for Schools Ranking Content */}
            <p className="text-gray-700">Schools Ranking content will be added here.</p>
          </ToggleSection>

          {/* Graphs Section */}
          <ToggleSection title="Graphs" ariaControls="school-reviews-graphs">
            {/* Placeholder for Graphs Content */}
            <p className="text-gray-700">Graphs content will be added here.</p>
          </ToggleSection>
        </div>
      )}
    </div>
  );
}
