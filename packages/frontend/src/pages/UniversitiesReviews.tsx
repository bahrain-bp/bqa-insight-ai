import { useEffect, useState } from 'react';
import { UniversityData } from './UniversityReviewComponents/types';  // Importing types for University data
import { ToggleSection } from './Components/ToggleSection'; // Toggle section component to show/hide content
import { UniversityHistoryGraph } from './UniversityReviewComponents/UniversityHistoryGraph'; // Component to display university history graph
import { UniversityReviewsTable } from './UniversityReviewComponents/UniversityReviewTables'; // Component to display university reviews in a table
import { UniversityGeneralCharts } from './UniversityReviewComponents/UniversityGeneralCharts'; // Component to display general charts for university reviews
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb'; // Breadcrumb component for navigation

export function UniversityReviews() {
  const [data, setData] = useState<UniversityData[]>([]); // State to store the university data
  const [loading, setLoading] = useState<boolean>(true); // State to manage loading state
  const [error, setError] = useState<string | null>(null); // Optional: State to store any error messages

  useEffect(() => {
    // Effect hook to fetch data when the component mounts
    const fetchData = async () => {
      try {
        // Fetch data from API
        const response = await fetch(`${import.meta.env.VITE_API_URL}/fetchUniversityReviews`);
        
        // Check if the response is okay
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.body}`);
        }
        
        // Parse JSON response
        const json = await response.json();
        
        // If the data is valid, update state with fetched data
        if (json.success && Array.isArray(json.data)) {
          setData(json.data);
          console.log('Fetched Data:', json.data); // Log the fetched data
        } else {
          throw new Error("Invalid data format from API.");
        }
      } catch (error: any) { // Catching any errors that occur during data fetching
        console.error("Error fetching University:", error); // Log the error
        setError(error.message || "An unexpected error occurred."); // Set error message in state
      } finally {
        // Set loading to false regardless of success or failure
        setLoading(false);
      }
    };

    // Call the fetchData function to fetch data from the API
    fetchData();
  }, []); // Empty dependency array ensures this effect runs only once when the component mounts

  return (
    <>
      {/* Breadcrumb for navigation */}
      <Breadcrumb pageName="University Reviews" />

      <div className="min-h-screen p-6 bg-gray-50 flex flex-col">
        {loading ? (
          // Loading state, displayed when data is being fetched
          <div className="flex flex-col items-center justify-center space-y-4 flex-grow">
            {/* Spinner to indicate loading */}
            <div
              className="border-t-transparent border-8 border-blue-500 rounded-full w-16 h-16 animate-spin"
              role="status"
              aria-label="Loading"
            ></div>
            {/* Loading text */}
            <p className="text-xl text-gray-700">Loading data...</p>
          </div>
        ) : error ? (
          // Error state, displayed if there was an issue with data fetching
          <div className="flex-grow flex items-center justify-center text-red-500 text-center">
            <p>Error: {error}</p>
          </div>
        ) : (
          // Data loaded state, displayed when data is successfully fetched
          <div className="w-full flex flex-col">

            {/* University Ranking Section with Toggle functionality */}
            <ToggleSection title="University Table" ariaControls="University-reviews-ranking">
              <UniversityReviewsTable data={data} />
            </ToggleSection>

            {/* Graphs Section with Toggle functionality */}
            <ToggleSection title="General Graphs" ariaControls="University-reviews-graphs">
              <UniversityGeneralCharts data={data} />
            </ToggleSection>

            {/* University History Graph Section with Toggle functionality */}
            <ToggleSection title="University History Graph" ariaControls="University-search">
              <UniversityHistoryGraph data={data} />
            </ToggleSection>
          </div>
        )}
      </div>
    </>
  );
}
