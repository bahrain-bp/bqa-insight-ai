// ./SchoolReviewComponents/SchoolReviewFacts.tsx

import { useMemo } from 'react';
import { SchoolData } from './types'; // Adjust the path as necessary

interface SchoolReviewFactsProps {
  data: SchoolData[];
}

export function SchoolReviewsFacts({ data }: SchoolReviewFactsProps): JSX.Element {
  // Compute the required statistics using useMemo for performance optimization
  const {
    totalSchools,
    totalGovernmentSchools,
    totalPrivateSchools,
    totalReviews,
    totalGovernmentReviews,
    totalPrivateReviews,
    overallAverageGrade,
    averageGradeGovernment,
    averageGradePrivate,
  } = useMemo(() => {
    const totalSchools = data.length;
    const totalGovernmentSchools = data.filter(
      (school) => school.SchoolType.toLowerCase() === 'government'
    ).length;
    const totalPrivateSchools = data.filter(
      (school) => school.SchoolType.toLowerCase() === 'private'
    ).length;
    const totalReviews = data.reduce((acc, school) => acc + school.Reviews.length, 0);
    const totalGovernmentReviews = data
      .filter((school) => school.SchoolType.toLowerCase() === 'government')
      .reduce((acc, school) => acc + school.Reviews.length, 0);
    const totalPrivateReviews = data
      .filter((school) => school.SchoolType.toLowerCase() === 'private')
      .reduce((acc, school) => acc + school.Reviews.length, 0);

    const averageGradeOverall = data.reduce(
      (acc, school) => {
        if (school.AverageGrade !== null && !isNaN(school.AverageGrade)) {
          acc.sum += school.AverageGrade;
          acc.count += 1;
        }
        return acc;
      },
      { sum: 0, count: 0 }
    );

    const overallAverageGrade =
      averageGradeOverall.count > 0
        ? parseFloat((averageGradeOverall.sum / averageGradeOverall.count).toFixed(2))
        : null;

    // Compute average grade for Government Schools
    const averageGradeGov = data
      .filter(
        (school) =>
          school.SchoolType.toLowerCase() === 'government' &&
          school.AverageGrade !== null &&
          !isNaN(school.AverageGrade)
      )
      .reduce(
        (acc, school) => {
          acc.sum += school.AverageGrade;
          acc.count += 1;
          return acc;
        },
        { sum: 0, count: 0 }
      );

    const averageGradeGovernment =
      averageGradeGov.count > 0
        ? parseFloat((averageGradeGov.sum / averageGradeGov.count).toFixed(2))
        : null;

    // Compute average grade for Private Schools
    const averageGradePriv = data
      .filter(
        (school) =>
          school.SchoolType.toLowerCase() === 'private' &&
          school.AverageGrade !== null &&
          !isNaN(school.AverageGrade)
      )
      .reduce(
        (acc, school) => {
          acc.sum += school.AverageGrade;
          acc.count += 1;
          return acc;
        },
        { sum: 0, count: 0 }
      );

    const averageGradePrivate =
      averageGradePriv.count > 0
        ? parseFloat((averageGradePriv.sum / averageGradePriv.count).toFixed(2))
        : null;

    return {
      totalSchools,
      totalGovernmentSchools,
      totalPrivateSchools,
      totalReviews,
      totalGovernmentReviews,
      totalPrivateReviews,
      overallAverageGrade,
      averageGradeGovernment,
      averageGradePrivate,
    };
  }, [data]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-center">Schools Reviews Facts</h2>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Schools Reviewed */}
        <div className="bg-white shadow-md rounded-lg p-6 flex items-center">
          <div className="bg-blue-500 text-white rounded-full p-4 mr-4">
            {/* Icon: School */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 22V12h6v10"
              />
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14v7m-7-4h14"
              />
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 14l4-4 4 4m-4-4v12"
              />
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8H5a8 8 0 01-8-8V4a8 8 0 018-8h8a8 8 0 018 8v8z"
              />
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7h18M3 12h18M3 17h18"
              />
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xl font-semibold">{totalPrivateReviews}</p>
            <p className="text-gray-600">Private School Reviews</p>
          </div>
        </div>

        {/* Overall Average Grade */}
        <div className="bg-white shadow-md rounded-lg p-6 flex items-center">
          <div className="bg-teal-500 text-white rounded-full p-4 mr-4">
            {/* Icon: Average Grade */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m4-10h.01M12 12h.01"
              />
            </svg>
          </div>
          <div>
            <p className="text-xl font-semibold">
              {overallAverageGrade !== null ? overallAverageGrade : 'N/A'}
            </p>
            <p className="text-gray-600">Overall Average Grade</p>
          </div>
        </div>

        {/* Average Grade for Government Schools */}
        <div className="bg-white shadow-md rounded-lg p-6 flex items-center">
          <div className="bg-orange-500 text-white rounded-full p-4 mr-4">
            {/* Icon: Government Average Grade */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6.343 6.343a8 8 0 0111.314 0M12 2v2m0 16v2m-8-8h2m12-0h2"
              />
            </svg>
          </div>
          <div>
            <p className="text-xl font-semibold">
              {averageGradeGovernment !== null ? averageGradeGovernment : 'N/A'}
            </p>
            <p className="text-gray-600">Government Schools Avg Grade</p>
          </div>
        </div>

        {/* Average Grade for Private Schools */}
        <div className="bg-white shadow-md rounded-lg p-6 flex items-center">
          <div className="bg-pink-500 text-white rounded-full p-4 mr-4">
            {/* Icon: Private Average Grade */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-4.69M6 9V7a2 2 0 012-2h4m0 0h.01M6 9a2 2 0 002-2m-2 2a2 2 0 01-2-2m0 0H4a2 2 0 00-2 2m2-2v12"
              />
            </svg>
          </div>
          <div>
            <p className="text-xl font-semibold">
              {averageGradePrivate !== null ? averageGradePrivate : 'N/A'}
            </p>
            <p className="text-gray-600">Private Schools Avg Grade</p>
          </div>
        </div>
      </div>
    </div>
  );
}
