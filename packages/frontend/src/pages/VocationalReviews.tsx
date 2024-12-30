
import { useEffect, useState } from 'react';
import { VocationalData } from './VocationalReviewsComponents/types';
import { ToggleSection } from './Components/ToggleSection'; 
import { VocationalReviewsTable } from './VocationalReviewsComponents/VocationalReviewsTable';
import { VocationalHistoryGraph } from './VocationalReviewsComponents/VocationalHistoryGraph';
import { VocationalGraphs } from './VocationalReviewsComponents/VocationalGraphs';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';


export function VocationalReviews() {
  const [data, setData] = useState<VocationalData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // Optional: To handle errors

  useEffect(() => {
    // Fetch data from the API when the component mounts
    const fetchData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/fetchVocationalReviews`);
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
  <>
    <Breadcrumb pageName="Vocational Institution Reviews" />
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

          {/* Vocational Ranking Section */}
          <ToggleSection title="Vocationals Table" ariaControls="vocational-reviews-ranking">
            <VocationalReviewsTable data={data} />
          </ToggleSection>

          {/* Graphs Section */}
          <ToggleSection title="General Graphs" ariaControls="vocational-reviews-graphs">
            <VocationalGraphs data={data} />
          </ToggleSection>
          
          {/* Search for a School Section */}
          <ToggleSection title="Vocational History Graph" ariaControls="vocational-search">
            <VocationalHistoryGraph data={data} />
          </ToggleSection>
        </div>
      )}
    </div>
  </>
  );
}
