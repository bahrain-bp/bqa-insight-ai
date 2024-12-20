
import { useMemo } from 'react';
import { SchoolData } from './types';
import { COLORS } from '../Components/Colors'; 
import React from 'react';

interface SchoolReviewFactsProps {
  data: SchoolData[];
}

export function SchoolReviewsFacts({ data }: SchoolReviewFactsProps): JSX.Element {
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
    governmentLevelGenderGrades,
    governmentBoysCount,
    governmentBoysAverageGrade,
    governmentGirlsCount,
    governmentGirlsAverageGrade,
  } = useMemo(() => {
    const totalSchools = data.length;
    const totalGovernmentSchools = data.filter(
      (school) => school.SchoolType?.toLowerCase() === 'government'
    ).length;
    const totalPrivateSchools = data.filter(
      (school) => school.SchoolType?.toLowerCase() === 'private'
    ).length;
    const totalReviews = data.reduce((acc, school) => acc + school.Reviews.length, 0);
    const totalGovernmentReviews = data
      .filter((school) => school.SchoolType?.toLowerCase() === 'government')
      .reduce((acc, school) => acc + school.Reviews.length, 0);
    const totalPrivateReviews = data
      .filter((school) => school.SchoolType?.toLowerCase() === 'private')
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

    const averageGradeGovernment = calculateAverageGrade(
      data.filter((school) => school.SchoolType?.toLowerCase() === 'government')
    );

    const averageGradePrivate = calculateAverageGrade(
      data.filter((school) => school.SchoolType?.toLowerCase() === 'private')
    );

    const governmentSchools = data.filter((school) => school.SchoolType?.toLowerCase() === 'government');
    const governmentLevelGenderGrades = calculateLevelGenderGrades(governmentSchools);

    // Government Boys & Girls Schools
    const governmentBoysSchools = governmentSchools.filter(
      (school) => school.SchoolGender?.toLowerCase() === 'boys'
    );
    const governmentGirlsSchools = governmentSchools.filter(
      (school) => school.SchoolGender?.toLowerCase() === 'girls'
    );

    const governmentBoysCount = governmentBoysSchools.length;
    const governmentGirlsCount = governmentGirlsSchools.length;

    const governmentBoysAverageGrade = calculateAverageGrade(governmentBoysSchools);
    const governmentGirlsAverageGrade = calculateAverageGrade(governmentGirlsSchools);

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
      governmentLevelGenderGrades,
      governmentBoysCount,
      governmentBoysAverageGrade,
      governmentGirlsCount,
      governmentGirlsAverageGrade,
    };
  }, [data]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-center">Schools Reviews Facts</h2>

      {/* First row: Total Reviews, Government Reviews, Private Reviews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Reviews"
          value={totalReviews}
          bgColor={COLORS.RED}
          iconPath="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8H5a8 8 0 01-8-8V4a8 8 0 018-8h8a8 8 0 018 8v8z"
        />

        <StatCard
          title="Total Government Schools Reviews"
          value={totalGovernmentReviews}
          bgColor={COLORS.LIGHT_BLUE}
          iconPath="M3 7h18M3 12h18M3 17h18"
        />

        <StatCard
          title="Total Private Schools Reviews"
          value={totalPrivateReviews}
          bgColor={COLORS.GREEN}
          iconPath="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"
        />
      </div>

      {/* Second row: Average Grade, Government Average Grade, Private Average Grade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <StatCard
          title="Overall Average Grade for All Schools"
          value={overallAverageGrade !== null ? overallAverageGrade : 'N/A'}
          subtitle={highlightedSubtitle(`${totalSchools} Schools`)}
          bgColor={COLORS.ORANGE}
          iconPath="M3 10l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10"
        />

        <StatCard
          title="Overall Average Grade for Government Schools"
          value={averageGradeGovernment !== null ? averageGradeGovernment : 'N/A'}
          subtitle={highlightedSubtitle(`${totalGovernmentSchools} Schools`)}
          bgColor={COLORS.DARK_BLUE}
          iconPath="M12 14l9-5-9-5-9 5 9 5z M12 14v7m-7-4h14"
        />

        <StatCard
          title="Overall Average Grade for Private Schools"
          value={averageGradePrivate !== null ? averageGradePrivate : 'N/A'}
          subtitle={highlightedSubtitle(`${totalPrivateSchools} Schools`)}
          bgColor={COLORS.YELLOW}
          iconPath="M8 14l4-4 4 4m-4-4v12"
        />
      </div>

      <h2 className="text-2xl font-bold my-6 text-center">Government Schools Facts</h2>

      {/* Government Schools by Level and Gender */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Primary', 'Intermediate', 'Secondary'].map((level, idx) => (
          <div key={idx} className="w-full">
            <StatCard
              title={`Overall Average Grade for ${level} Schools`}
              value={
                governmentLevelGenderGrades[`${level} Schools`] && governmentLevelGenderGrades[`${level} Schools`].count > 0
                  ? governmentLevelGenderGrades[`${level} Schools`].avg
                  : 'N/A'
              }
              bgColor={level === 'Primary' ? COLORS.YELLOW : level === 'Intermediate' ? COLORS.GREEN : COLORS.ORANGE}
              iconPath="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z"
              subtitle={
                governmentLevelGenderGrades[`${level} Schools`] && governmentLevelGenderGrades[`${level} Schools`].count > 0
                  ? highlightedSubtitle(`${governmentLevelGenderGrades[`${level} Schools`].count} Schools`)
                  : ''
              }
            />

            {['Girls', 'Boys'].map((gender) => (
              <StatCard
                key={`${level}-${gender}`}
                title={`Overall Average Grade for ${level} Schools (${gender})`}
                value={
                  governmentLevelGenderGrades[`${level} Schools (${gender})`] &&
                  governmentLevelGenderGrades[`${level} Schools (${gender})`].count > 0
                    ? governmentLevelGenderGrades[`${level} Schools (${gender})`].avg
                    : 'N/A'
                }
                bgColor={gender === 'Girls' ? COLORS.RED : COLORS.LIGHT_BLUE}
                iconPath="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m4-10h.01M12 12h.01"
                subtitle={
                  governmentLevelGenderGrades[`${level} Schools (${gender})`] &&
                  governmentLevelGenderGrades[`${level} Schools (${gender})`].count > 0
                    ? highlightedSubtitle(`${governmentLevelGenderGrades[`${level} Schools (${gender})`].count} Schools`)
                    : ''
                }
              />
            ))}
          </div>
        ))}
      </div>

      {/* Government Boys and Girls Schools Cards at the Bottom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <StatCard
          title="Overall Average grade for Government Girls Schools"
          value={governmentGirlsAverageGrade !== null ? governmentGirlsAverageGrade : 'N/A'}
          bgColor={COLORS.RED}
          iconPath="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z"
          subtitle={highlightedSubtitle(`${governmentGirlsCount} Schools`)}
        />

        <StatCard
          title="Overall Average grade for Government Boys Schools"
          value={governmentBoysAverageGrade !== null ? governmentBoysAverageGrade : 'N/A'}
          bgColor={COLORS.LIGHT_BLUE}
          iconPath="M3 10l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10"
          subtitle={highlightedSubtitle(`${governmentBoysCount} Schools`)}
        />

      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  bgColor,
  iconPath,
  subtitle,
}: {
  title: string;
  value: any;
  bgColor: string;
  iconPath: string;
  subtitle?: React.ReactNode; 
}) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 flex items-center">
      <div className="rounded-full p-4 mr-4" style={{ backgroundColor: bgColor }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
      </div>
      <div>
        <p className="text-xl font-semibold">{value}</p>
        <p className="text-gray-600">
          {title}
          {subtitle && <><br />{subtitle}</>}
        </p>
      </div>
    </div>
  );
}

function highlightedSubtitle(text: string) {
  return <span className="text-blue-600 font-bold">{text}</span>;
}

function calculateAverageGrade(schools: SchoolData[]): number | null {
  const gradeData = schools.reduce(
    (acc, school) => {
      if (school.AverageGrade !== null && !isNaN(school.AverageGrade)) {
        acc.sum += school.AverageGrade;
        acc.count += 1;
      }
      return acc;
    },
    { sum: 0, count: 0 }
  );

  return gradeData.count > 0 ? parseFloat((gradeData.sum / gradeData.count).toFixed(2)) : null;
}

interface GradeResult {
  avg: number | null;
  count: number;
}

function calculateLevelGenderGrades(schools: SchoolData[]) {
  const levels = ['Primary', 'Intermediate', 'Secondary'];
  const genders = ['Girls', 'Boys'];

  const results: { [key: string]: GradeResult } = {};

  levels.forEach((level) => {
    const allGenderSchools = schools.filter((school) => {
      return schoolHasLevel(school, level) && school.AverageGrade !== null && !isNaN(school.AverageGrade);
    });
    results[`${level} Schools`] = {
      avg: calculateAverageGrade(allGenderSchools),
      count: allGenderSchools.length,
    };

    genders.forEach((gender) => {
      const filteredSchools = schools.filter(
        (school) =>
          schoolHasLevel(school, level) &&
          (school.SchoolGender?.toLowerCase() === gender.toLowerCase()) &&
          school.AverageGrade !== null &&
          !isNaN(school.AverageGrade)
      );

      results[`${level} Schools (${gender})`] = {
        avg: calculateAverageGrade(filteredSchools),
        count: filteredSchools.length,
      };
    });
  });

  return results;
}

function schoolHasLevel(school: SchoolData, level: string) {
  const schoolLevel = school.SchoolLevel?.toLowerCase() || '';
  const schoolLevels = schoolLevel.split(',').map((l) => l.trim());
  return schoolLevels.includes(level.toLowerCase());
}
