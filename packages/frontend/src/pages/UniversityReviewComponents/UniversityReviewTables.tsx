import { useState, useMemo } from 'react';

interface Review {
  Title: string;
  Program: string;
  UnifiedStudyField: string;
  Cycle: string;
  Type: string;
  Judgement: string;
  ReportFile: string;
}

interface UniversityData {
  InstitutionCode: string;
  InstitutionName: string;
  Reviews: Review[];
}

interface UniversityReviewsTableProps {
  data: UniversityData[];
}

type SortState = {
  column: string | null;
  direction: 'asc' | 'desc';
};

export function UniversityReviewsTable({ data }: UniversityReviewsTableProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [judgementFilter, setJudgementFilter] = useState<string>('all');
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: 'asc' });

  if (!Array.isArray(data)) {
    return <div className="text-red-500">Error: Invalid data format</div>;
  }

  function getLatestReview(reviews: Review[]): Review | null {
    if (!Array.isArray(reviews) || reviews.length === 0) return null;
    return reviews[reviews.length - 1];
  }

  const filteredData = useMemo(() => {
    return data.filter((university) => {
      const latestReview = getLatestReview(university.Reviews);
      
      if (judgementFilter === 'all') {
        return true;
      }
      
      return latestReview?.Judgement?.toLowerCase() === judgementFilter.toLowerCase();
    });
  }, [data, judgementFilter]);

  const sortedData = useMemo(() => {
    if (!sortState.column) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aLatest = getLatestReview(a.Reviews);
      const bLatest = getLatestReview(b.Reviews);

      let aVal: any = '';
      let bVal: any = '';

      switch(sortState.column) {
        case 'InstitutionCode':
          aVal = a.InstitutionCode ?? '';
          bVal = b.InstitutionCode ?? '';
          break;
        case 'InstitutionName':
          aVal = a.InstitutionName ?? '';
          bVal = b.InstitutionName ?? '';
          break;
        case 'LatestProgram':
          aVal = aLatest?.Program ?? '';
          bVal = bLatest?.Program ?? '';
          break;
        case 'LatestJudgement':
          aVal = aLatest?.Judgement ?? '';
          bVal = bLatest?.Judgement ?? '';
          break;
        case 'NumberOfReviews':
          aVal = (a.Reviews?.length ?? 0);
          bVal = (b.Reviews?.length ?? 0);
          break;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal;
      }
      return String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
    });

    return sortState.direction === 'desc' ? sorted.reverse() : sorted;
  }, [sortState, filteredData]);

  const displayedData = useMemo(() => {
    if (searchQuery.trim() === '') return sortedData;
    
    const query = searchQuery.toLowerCase();
    return sortedData.filter((university) =>
      university.InstitutionName.toLowerCase().includes(query)
    );
  }, [searchQuery, sortedData]);

  const handleSort = (col: string) => {
    setSortState((prev) => ({
      column: col,
      direction: prev.column === col ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'asc'
    }));
  };

  function renderSortIndicator(columnName: string) {
    if (sortState.column !== columnName) return null;
    return sortState.direction === 'asc' ? ' ▲' : ' ▼';
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col space-y-4">
        <div>
          <span className="font-semibold mr-2">Filter by Judgement:</span>
          <select
            value={judgementFilter}
            onChange={(e) => setJudgementFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1"
          >
            <option value="all">All Judgements</option>
            <option value="confidence">Confidence</option>
            <option value="limited confidence">Limited Confidence</option>
            <option value="no confidence">No Confidence</option>
          </select>
        </div>

        <div>
          <span className="font-semibold mr-2">Search by Institution Name:</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1"
            placeholder="Enter name..."
          />
        </div>
      </div>

      <div className="mb-2 text-gray-700 font-semibold">
        <span>{displayedData.length} Institution(s) Returned</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th onClick={() => handleSort('InstitutionCode')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                Institution Code{renderSortIndicator('InstitutionCode')}
              </th>
              <th onClick={() => handleSort('InstitutionName')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                Institution Name{renderSortIndicator('InstitutionName')}
              </th>
              <th onClick={() => handleSort('LatestProgram')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                Latest Program{renderSortIndicator('LatestProgram')}
              </th>
              <th onClick={() => handleSort('LatestJudgement')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                Latest Judgement{renderSortIndicator('LatestJudgement')}
              </th>
              <th onClick={() => handleSort('NumberOfReviews')} className="py-2 px-4 text-left font-semibold text-gray-700 cursor-pointer">
                Number of Reviews{renderSortIndicator('NumberOfReviews')}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedData.map((university, idx) => {
              const latestReview = getLatestReview(university.Reviews);
              
              return (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-4 text-gray-700">{university.InstitutionCode}</td>
                  <td className="py-2 px-4 text-gray-700">{university.InstitutionName}</td>
                  <td className="py-2 px-4 text-gray-700">{latestReview?.Program ?? 'N/A'}</td>
                  <td className="py-2 px-4 text-gray-700">{latestReview?.Judgement ?? 'N/A'}</td>
                  <td className="py-2 px-4 text-gray-700">{university.Reviews.length}</td>
                </tr>
              );
            })}

            {displayedData.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  No institutions match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}