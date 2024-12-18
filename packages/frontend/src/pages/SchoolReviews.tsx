
import { useEffect, useState } from 'react';

// Define TypeScript interfaces for type safety
interface Review {
  Cycle: string;
  Batch: string;
  BatchReleaseDate: string;
  ReviewType: string;
  Grade: string; 
}

interface SchoolData {
  InstitutionCode: string;
  EnglishSchoolName: string;
  ArabicSchoolName: string;
  SchoolType: string; 
  Reviews: Review[];
  AverageGrade: number | null;
  SchoolLevel?: string;   // Optional: "Primary", "Intermediate", "Secondary"
  SchoolGender?: string;  // Optional: "Boys", "Girls"
}

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
        console.error("Error fetching government schools:", error);
        setError(error.message || "An unexpected error occurred.");
      } finally {
        setLoading(false); // Stop loading regardless of success or failure
      }
    };

    fetchData();
  }, []);

  // Compute the required statistics
  const totalSchools = data.length;
  const totalGovernmentSchools = data.filter(school => school.SchoolType.toLowerCase() === 'government').length;
  const totalPrivateSchools = data.filter(school => school.SchoolType.toLowerCase() === 'private').length;
  const totalReviews = data.reduce((acc, school) => acc + school.Reviews.length, 0);
  const totalGovernmentReviews = data
    .filter(school => school.SchoolType.toLowerCase() === 'government')
    .reduce((acc, school) => acc + school.Reviews.length, 0);
  const totalPrivateReviews = data
    .filter(school => school.SchoolType.toLowerCase() === 'private')
    .reduce((acc, school) => acc + school.Reviews.length, 0);

  return (
    <div className="relative min-h-screen p-6 flex items-center justify-center">
      {loading ? (
        // Spinner Overlay
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div
            className="loader border-t-transparent border-4 border-white rounded-full w-8 h-8 animate-spin"
            role="status"
            aria-label="Loading"
          ></div>
        </div>
      ) : error ? (
        // Error Message (Optional)
        <div className="text-red-500 text-center">
          <p>Error: {error}</p>
        </div>
      ) : (
        // Data Loaded Content
        <div className="w-full max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">Schools Reviews Analysis</h2>
          
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Schools Reviewed */}
            <div className="bg-white shadow-md rounded-lg p-6 flex items-center">
              <div className="bg-blue-500 text-white rounded-full p-4 mr-4">
                {/* Icon: School */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-semibold">{totalSchools}</p>
                <p className="text-gray-600">Total Schools Reviewed</p>
              </div>
            </div>

            {/* Total Government Schools Reviewed */}
            <div className="bg-white shadow-md rounded-lg p-6 flex items-center">
              <div className="bg-green-500 text-white rounded-full p-4 mr-4">
                {/* Icon: Government */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7m-7-4h14" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-semibold">{totalGovernmentSchools}</p>
                <p className="text-gray-600">Government Schools Reviewed</p>
              </div>
            </div>

            {/* Total Private Schools Reviewed */}
            <div className="bg-white shadow-md rounded-lg p-6 flex items-center">
              <div className="bg-purple-500 text-white rounded-full p-4 mr-4">
                {/* Icon: Private */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14l4-4 4 4m-4-4v12" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-semibold">{totalPrivateSchools}</p>
                <p className="text-gray-600">Private Schools Reviewed</p>
              </div>
            </div>

            {/* Total Reviews */}
            <div className="bg-white shadow-md rounded-lg p-6 flex items-center">
              <div className="bg-yellow-500 text-white rounded-full p-4 mr-4">
                {/* Icon: Reviews */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8H5a8 8 0 01-8-8V4a8 8 0 018-8h8a8 8 0 018 8v8z" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-semibold">{totalReviews}</p>
                <p className="text-gray-600">Total Reviews</p>
              </div>
            </div>

            {/* Total Government School Reviews */}
            <div className="bg-white shadow-md rounded-lg p-6 flex items-center">
              <div className="bg-red-500 text-white rounded-full p-4 mr-4">
                {/* Icon: Government Reviews */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-semibold">{totalGovernmentReviews}</p>
                <p className="text-gray-600">Government School Reviews</p>
              </div>
            </div>

            {/* Total Private School Reviews */}
            <div className="bg-white shadow-md rounded-lg p-6 flex items-center">
              <div className="bg-indigo-500 text-white rounded-full p-4 mr-4">
                {/* Icon: Private Reviews */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-semibold">{totalPrivateReviews}</p>
                <p className="text-gray-600">Private School Reviews</p>
              </div>
            </div>
          </div>
        </div>
          )}
        </div>
      );
    }

    
