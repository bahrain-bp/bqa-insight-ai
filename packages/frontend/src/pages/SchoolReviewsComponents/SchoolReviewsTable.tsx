import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { SchoolData, Review } from './types';

interface SchoolReviewsTableProps {
  data: SchoolData[];
}

type SchoolTypeFilter = 'All' | 'Government' | 'Private';

type SortState = {
  column: string | null; 
  direction: 'asc' | 'desc';
};

export function SchoolReviewsTable({ data }: SchoolReviewsTableProps): JSX.Element {
  const [schoolTypeFilter, setSchoolTypeFilter] = useState<SchoolTypeFilter>('All');
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: 'asc' });

  const exportToExcel = () => {
    const exportData = displayedData.map(school => {
      const { grade: latestGrade, date: latestDate } = getLatestReviewReportData(school.Reviews);
      const avgGrade = (school.AverageGrade !== null && !isNaN(school.AverageGrade))
        ? school.AverageGrade
        : 'N/A';

      const baseData = {
        Rank: school.Rank,
        'Institution Code': school.InstitutionCode,
        'English School Name': school.EnglishSchoolName,
        'Arabic School Name': school.ArabicSchoolName,
        'School Type': school.SchoolType,
        'Average Grade': avgGrade,
        'Latest Review Grade': latestGrade,
        'Latest Review Date': latestDate,
        'Number of Reviews': school.Reviews.length,
      };

      if (showGenderAndLevel) {
        return {
          ...baseData,
          'School Level': school.SchoolLevel || 'N/A',
          'School Gender': school.SchoolGender || 'N/A',
        };
      }

      return baseData;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Schools');
    const fileName = `Schools_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const toggleGender = (gender: string) => {
    setSelectedGenders((prev) =>
      prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender]
    );
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  function parseBatchReleaseDate(dateStr: string): Date | null {
    const [monthName, yearStr] = dateStr.split(' ');
    if (!monthName || !yearStr) return null;

    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const monthIndex = months.indexOf(monthName.toLowerCase());
    if (monthIndex === -1) return null;

    const year = parseInt(yearStr, 10);
    if (isNaN(year)) return null;

    return new Date(year, monthIndex, 1);
  }

  function getLatestReviewReportData(reviews: Review[]): { grade: string, date: string } {
    const reviewReports = reviews.filter(r => r.ReviewType === 'Review Report');
    if (reviewReports.length === 0) {
      return { grade: 'N/A', date: 'N/A' };
    }

    const datedReviews = reviewReports.map(r => {
      const parsed = parseBatchReleaseDate(r.BatchReleaseDate);
      return { ...r, parsedDate: parsed };
    }).filter(r => r.parsedDate !== null) as (Review & {parsedDate: Date})[];

    if (datedReviews.length === 0) {
      return { grade: 'N/A', date: 'N/A' };
    }

    datedReviews.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());
    const latest = datedReviews[0];
    return { grade: latest.Grade, date: latest.BatchReleaseDate };
  }

  const showGenderAndLevel = schoolTypeFilter !== 'Private';

  const filteredData = useMemo(() => {
    let filtered = data;

    if (schoolTypeFilter !== 'All') {
      filtered = filtered.filter((school) => school.SchoolType?.toLowerCase() === schoolTypeFilter.toLowerCase());
    }

    if (schoolTypeFilter === 'Government') {
      if (selectedGenders.length > 0) {
        filtered = filtered.filter((school) => {
          return school.SchoolGender && selectedGenders.includes(school.SchoolGender);
        });
      }

      if (selectedLevels.length > 0) {
        filtered = filtered.filter((school) => {
          if (!school.SchoolLevel) return false;
          const levels = school.SchoolLevel.split(',').map((l) => l.trim());
          return levels.some(l => selectedLevels.includes(l));
        });
      }
    }

    return filtered;
  }, [data, schoolTypeFilter, selectedGenders, selectedLevels]);

  const rankedData = useMemo(() => {
    const validSorted = [...filteredData].sort((a, b) => {
      const aGrade = (a.AverageGrade !== null && !isNaN(a.AverageGrade)) ? a.AverageGrade : Infinity;
      const bGrade = (b.AverageGrade !== null && !isNaN(b.AverageGrade)) ? b.AverageGrade : Infinity;
      return aGrade - bGrade;
    });

    let prevGrade: number | null = null;
    let prevRank = 0;
    let count = 0;
    const withRank = validSorted.map((school) => {
      count++;
      const grade = (school.AverageGrade !== null && !isNaN(school.AverageGrade)) ? school.AverageGrade : Infinity;
      if (grade !== prevGrade) {
        prevRank = count; 
        prevGrade = grade;
      }
      return { ...school, Rank: prevRank };
    });

    return withRank;
  }, [filteredData]);

  const sortedData = useMemo(() => {
    if (!sortState.column) {
      return rankedData;
    }

    const { column, direction } = sortState;
    const compare = (a: any, b: any) => {
      let aVal: any;
      let bVal: any;

      const { grade: aGradeReview, date: aDateStr } = getLatestReviewReportData(a.Reviews);
      const { grade: bGradeReview, date: bDateStr } = getLatestReviewReportData(b.Reviews);

      const aDate = parseBatchReleaseDate(aDateStr);
      const bDate = parseBatchReleaseDate(bDateStr);

      switch(column) {
        case 'Rank':
          aVal = a.Rank;
          bVal = b.Rank;
          break;
        case 'InstitutionCode':
          aVal = a.InstitutionCode;
          bVal = b.InstitutionCode;
          break;
        case 'EnglishSchoolName':
          aVal = a.EnglishSchoolName;
          bVal = b.EnglishSchoolName;
          break;
        case 'ArabicSchoolName':
          aVal = a.ArabicSchoolName;
          bVal = b.ArabicSchoolName;
          break;
        case 'SchoolType':
          aVal = a.SchoolType;
          bVal = b.SchoolType;
          break;
        case 'AverageGrade':
          aVal = (a.AverageGrade !== null && !isNaN(a.AverageGrade)) ? a.AverageGrade : Infinity;
          bVal = (b.AverageGrade !== null && !isNaN(b.AverageGrade)) ? b.AverageGrade : Infinity;
          break;
        case 'LatestReviewGrade':
          aVal = aGradeReview;
          bVal = bGradeReview;
          break;
        case 'LatestReviewDate':
          aVal = aDate ? aDate.getTime() : -Infinity;
          bVal = bDate ? bDate.getTime() : -Infinity;
          break;
        case 'NumberOfReviews':
          aVal = a.Reviews.length;
          bVal = b.Reviews.length;
          break;
        case 'SchoolLevel':
          aVal = a.SchoolLevel || '';
          bVal = b.SchoolLevel || '';
          break;
        case 'SchoolGender':
          aVal = a.SchoolGender || '';
          bVal = b.SchoolGender || '';
          break;
        default:
          aVal = '';
          bVal = '';
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal;
      } else {
        return aVal.toString().localeCompare(bVal.toString(), undefined, {numeric: true, sensitivity: 'base'});
      }
    };

    const sorted = [...rankedData].sort((a, b) => compare(a, b));
    if (direction === 'desc') sorted.reverse();
    return sorted;

  }, [sortState, rankedData]);

  const displayedData = useMemo(() => {
    if (searchQuery.trim() === '') {
      return sortedData;
    }
    const query = searchQuery.toLowerCase();
    return sortedData.filter((school) =>
      school.EnglishSchoolName.toLowerCase().includes(query)
    );
  }, [searchQuery, sortedData]);

  const handleSort = (col: string) => {
    setSortState((prev) => {
      if (prev.column === col) {
        return { column: col, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      } else {
        return { column: col, direction: 'asc' };
      }
    });
  };

  const baseColumns = showGenderAndLevel ? 11 : 9;

  function renderSortIndicator(columnName: string) {
    if (sortState.column !== columnName) {
      return null;
    }
    return sortState.direction === 'asc' ? ' ▲' : ' ▼';
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col space-y-4">
        <div>
          <span className="font-semibold mr-2">School Type:</span>
          <button
            onClick={() => setSchoolTypeFilter('All')}
            className={`mr-2 px-3 py-1 rounded ${schoolTypeFilter === 'All' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
          >
            All
          </button>
          <button
            onClick={() => setSchoolTypeFilter('Government')}
            className={`mr-2 px-3 py-1 rounded ${schoolTypeFilter === 'Government' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
          >
            Government
          </button>
          <button
            onClick={() => setSchoolTypeFilter('Private')}
            className={`mr-2 px-3 py-1 rounded ${schoolTypeFilter === 'Private' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
          >
            Private
          </button>
        </div>

        {schoolTypeFilter === 'Government' && (
          <div className="flex flex-col md:flex-row md:space-x-8">
            <div>
              <span className="font-semibold mr-2">Gender:</span>
              {['Boys', 'Girls'].map((g) => (
                <label key={g} className="mr-4">
                  <input
                    type="checkbox"
                    checked={selectedGenders.includes(g)}
                    onChange={() => toggleGender(g)}
                    className="mr-1"
                  />
                  {g}
                </label>
              ))}
            </div>

            <div>
              <span className="font-semibold mr-2">Levels:</span>
              {['Primary', 'Intermediate', 'Secondary'].map((lvl) => (
                <label key={lvl} className="mr-4">
                  <input
                    type="checkbox"
                    checked={selectedLevels.includes(lvl)}
                    onChange={() => toggleLevel(lvl)}
                    className="mr-1"
                  />
                  {lvl}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <span className="font-semibold mr-2">Search by English School Name:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1"
              placeholder="Enter name..."
            />
          </div>
          <button
            onClick={exportToExcel}
          className="bg-[#0F7E0F] hover:bg-[#0D6B0D] text-white px-4 py-2 rounded"
          >
            Export to Excel
          </button>
        </div>
      </div>

      <div className="mb-2 text-gray-700 font-semibold">
        {displayedData.length} School(s) Returned
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th onClick={() => handleSort('Rank')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                Rank{renderSortIndicator('Rank')}
              </th>
              <th onClick={() => handleSort('InstitutionCode')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                Institution Code{renderSortIndicator('InstitutionCode')}
              </th>
              <th onClick={() => handleSort('EnglishSchoolName')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                English School Name{renderSortIndicator('EnglishSchoolName')}
              </th>
              <th onClick={() => handleSort('ArabicSchoolName')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                Arabic School Name{renderSortIndicator('ArabicSchoolName')}
              </th>
              <th onClick={() => handleSort('SchoolType')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                School Type{renderSortIndicator('SchoolType')}
              </th>
              <th onClick={() => handleSort('AverageGrade')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                Average Grade{renderSortIndicator('AverageGrade')}
              </th>
              <th onClick={() => handleSort('LatestReviewGrade')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                Latest Review Grade{renderSortIndicator('LatestReviewGrade')}
              </th>
              <th onClick={() => handleSort('LatestReviewDate')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                Latest Review Date{renderSortIndicator('LatestReviewDate')}
              </th>
              <th onClick={() => handleSort('NumberOfReviews')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                Number of Reviews{renderSortIndicator('NumberOfReviews')}
              </th>
              {showGenderAndLevel && (
                <th onClick={() => handleSort('SchoolLevel')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                  School Level{renderSortIndicator('SchoolLevel')}
                </th>
              )}
              {showGenderAndLevel && (
                <th onClick={() => handleSort('SchoolGender')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                  School Gender{renderSortIndicator('SchoolGender')}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {displayedData.map((school, idx) => {
              const avgGrade = (school.AverageGrade !== null && !isNaN(school.AverageGrade))
                ? school.AverageGrade
                : 'N/A';

              const { grade: latestGrade, date: latestDate } = getLatestReviewReportData(school.Reviews);

              return (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-4 text-gray-700">{school.Rank}</td>
                  <td className="py-2 px-4 text-gray-700">{school.InstitutionCode}</td>
                  <td className="py-2 px-4 text-gray-700">{school.EnglishSchoolName}</td>
                  <td className="py-2 px-4 text-gray-700">{school.ArabicSchoolName}</td>
                  <td className="py-2 px-4 text-gray-700">{school.SchoolType}</td>
                  <td className="py-2 px-4 text-gray-700">{avgGrade}</td>
                  <td className="py-2 px-4 text-gray-700">{latestGrade}</td>
                  <td className="py-2 px-4 text-gray-700">{latestDate}</td>
                  <td className="py-2 px-4 text-gray-700">{school.Reviews.length}</td>
                  {showGenderAndLevel && <td className="py-2 px-4 text-gray-700">{school.SchoolLevel || 'N/A'}</td>}
                  {showGenderAndLevel && <td className="py-2 px-4 text-gray-700">{school.SchoolGender || 'N/A'}</td>}
                </tr>
              );
            })}

            {displayedData.length === 0 && (
              <tr>
                <td colSpan={baseColumns} className="py-4 text-center text-gray-500">
                  No schools match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}