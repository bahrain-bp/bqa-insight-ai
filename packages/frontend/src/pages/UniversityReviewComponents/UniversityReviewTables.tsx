import { useState, useMemo } from 'react';
import { UniversityData, Review } from './types';

interface UniversityReviewsTableProps {
  data: UniversityData[];
}

type SortState = {
  column: string | null;
  direction: 'asc' | 'desc';
};

export function UniversityReviewsTable({ data }: UniversityReviewsTableProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [averageGradeFilter, setAverageGradeFilter] = useState<number>(1); // Default to minimum grade

  const [sortState, setSortState] = useState<SortState>({ column: null, direction: 'asc' });

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
    const reviewReports = reviews.filter(r => r.ReviewType.toLowerCase().includes('review'));
    if (reviewReports.length === 0) {
      return { grade: 'N/A', date: 'N/A' };
    }

    const datedReviews = reviewReports.map(r => {
      const parsed = parseBatchReleaseDate(r.BatchReleaseDate);
      return { ...r, parsedDate: parsed };
    }).filter(r => r.parsedDate !== null) as (Review & { parsedDate: Date })[];

    if (datedReviews.length === 0) {
      return { grade: 'N/A', date: 'N/A' };
    }

    datedReviews.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());
    const latest = datedReviews[0];
    return { grade: latest.Grade, date: latest.BatchReleaseDate };
  }

  // ----------------------------
  // 1) Compute Rankings Based on Entire Data
  // ----------------------------
  const rankedData = useMemo(() => {
    const validSorted = [...data].sort((a, b) => {
      const aGrade = (a.AverageGrade !== null && !isNaN(a.AverageGrade)) ? a.AverageGrade : Infinity;
      const bGrade = (b.AverageGrade !== null && !isNaN(b.AverageGrade)) ? b.AverageGrade : Infinity;
      return aGrade - bGrade;
    });

    let prevGrade: number | null = null;
    let prevRank = 0;
    let count = 0;
    const withRank = validSorted.map((University) => {
      count++;
      const grade = (University.AverageGrade !== null && !isNaN(University.AverageGrade)) ? University.AverageGrade : Infinity;
      if (grade !== prevGrade) {
        prevRank = count;
        prevGrade = grade;
      }
      return { ...University, Rank: prevRank };
    });

    return withRank;
  }, [data]);

  // ----------------------------
  // 2) Apply Average Grade Filter on Ranked Data
  // ----------------------------
  const filteredData = useMemo(() => {
    return rankedData.filter((University) => {
      // Filter based on average grade
      return University.AverageGrade >= averageGradeFilter;
    });
  }, [rankedData, averageGradeFilter]);

  // ----------------------------
  // 3) Sorting
  // ----------------------------
  const sortedData = useMemo(() => {
    if (!sortState.column) {
      return filteredData;
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
        case 'EnglishInstituteName':
          aVal = a.EnglishInstituteName;
          bVal = b.EnglishInstituteName;
          break;
        case 'ArabicInstituteName':
          aVal = a.ArabicInstituteName;
          bVal = b.ArabicInstituteName;
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
        default:
          aVal = '';
          bVal = '';
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal;
      } else {
        return aVal.toString().localeCompare(bVal.toString(), undefined, { numeric: true, sensitivity: 'base' });
      }
    };

    const sorted = [...filteredData].sort((a, b) => compare(a, b));
    if (direction === 'desc') sorted.reverse();
    return sorted;

  }, [sortState, filteredData]);

  // ----------------------------
  // 4) Apply Search Query on Sorted Data
  // ----------------------------
  const displayedData = useMemo(() => {
    if (searchQuery.trim() === '') {
      return sortedData;
    }
    const query = searchQuery.toLowerCase();
    return sortedData.filter((University) =>
      University.EnglishInstituteName.toLowerCase().includes(query)
    );
  }, [searchQuery, sortedData]);

  // ----------------------------
  // 5) Compute Overall Average of Displayed Data
  // ----------------------------
  const overallAverage = useMemo(() => {
    if (displayedData.length === 0) return 'N/A';
    const sum = displayedData.reduce((acc, University) => acc + University.AverageGrade, 0);
    const avg = sum / displayedData.length;
    return avg.toFixed(2);
  }, [displayedData]);

  const handleSort = (col: string) => {
    setSortState((prev) => {
      if (prev.column === col) {
        // toggle direction
        return { column: col, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      } else {
        // new column, default to asc
        return { column: col, direction: 'asc' };
      }
    });
  };

  const baseColumns = 8; // Adjusted based on new columns

  function renderSortIndicator(columnName: string) {
    if (sortState.column !== columnName) {
      return null; // Not sorted by this column
    }
    return sortState.direction === 'asc' ? ' ▲' : ' ▼';
  }

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="mb-4 flex flex-col space-y-4">
        {/* Average Grade Slider */}
        <div>
          <span className="font-semibold mr-2">Minimum Average Grade:</span>
          <input
            type="range"
            min="1"
            max="4"
            step="0.1"
            value={averageGradeFilter}
            onChange={(e) => setAverageGradeFilter(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="text-gray-700">
            {averageGradeFilter.toFixed(1)}
          </div>
        </div>

        {/* Search bar */}
        <div>
          <span className="font-semibold mr-2">Search by English University Name:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1"
            placeholder="Enter name..."
          />
        </div>
      </div>

      {/* Count of institutes returned and Overall Average */}
      <div className="mb-2 text-gray-700 font-semibold flex flex-col sm:flex-row sm:items-center sm:space-x-4">
        <span>{displayedData.length} University(s) Returned</span>
        <span>Overall Average Grade: {overallAverage}</span>
      </div>

      {/* Table */}
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
              <th onClick={() => handleSort('EnglishInstituteName')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                English Institute Name{renderSortIndicator('EnglishInstituteName')}
              </th>
              <th onClick={() => handleSort('ArabicInstituteName')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                Arabic Institute Name{renderSortIndicator('ArabicInstituteName')}
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
            </tr>
          </thead>
          <tbody>
            {displayedData.map((University, idx) => {
              const avgGrade = (University.AverageGrade !== null && !isNaN(University.AverageGrade))
                ? University.AverageGrade.toFixed(2)
                : 'N/A';

              const { grade: latestGrade, date: latestDate } = getLatestReviewReportData(University.Reviews);

              return (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-4 text-gray-700">{University.Rank}</td>
                  <td className="py-2 px-4 text-gray-700">{University.InstitutionCode}</td>
                  <td className="py-2 px-4 text-gray-700">{University.EnglishInstituteName}</td>
                  <td className="py-2 px-4 text-gray-700">{University.ArabicInstituteName}</td>
                  <td className="py-2 px-4 text-gray-700">{avgGrade}</td>
                  <td className="py-2 px-4 text-gray-700">{latestGrade}</td>
                  <td className="py-2 px-4 text-gray-700">{latestDate}</td>
                  <td className="py-2 px-4 text-gray-700">{University.Reviews.length}</td>
                </tr>
              );
            })}

            {displayedData.length === 0 && (
              <tr>
                <td colSpan={baseColumns} className="py-4 text-center text-gray-500">
                  No University match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    );
}
