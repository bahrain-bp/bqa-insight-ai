import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import LogoIcon from '../../images/BQA.png';
import PDFIcon from '../../images/PDF.png';
import XSLIcon from '../../images/xls.png';

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

  const exportToExcel = () => {
    const exportData = displayedData.map(university => {
      const latestReview = getLatestReview(university.Reviews);
      
      return {
        'Institution Code': university.InstitutionCode,
        'Institution Name': university.InstitutionName,
        'Latest Program': latestReview?.Program || 'N/A',
        'Latest Judgement': latestReview?.Judgement || 'N/A',
        'Number of Reviews': university.Reviews.length,
        'Latest Review Type': latestReview?.Type || 'N/A',
        'Latest Study Field': latestReview?.UnifiedStudyField || 'N/A',
        'Latest Cycle': latestReview?.Cycle || 'N/A'
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Universities');
    const fileName = `Universities_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportToPDF = async () => {
    const printDiv = document.createElement('div');
    printDiv.className = 'pdf-export';
  
    const style = document.createElement('style');
    style.textContent = `
      .pdf-export {
        padding: 20px;
        font-family: Arial, sans-serif;
        margin-bottom: 40px;
      }
      .pdf-header {
        display: flex;
        justify-content: flex-end;
        padding-right: 20px;
        padding-top: 0;
        margin-top: -15px;
        margin-bottom: 40px;
      }
      .pdf-header img {
        max-height: 60px;
        object-fit: contain;
      }
      .pdf-title {
        text-align: center;
        font-size: 24px;
        font-weight: bold;
        margin: 20px 0;
        padding-bottom: 20px;
        clear: both;
      }
      .pdf-export table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      .pdf-export th, .pdf-export td {
        border: 1px solid #ddd;
        padding: 8px;
        font-size: 12px;
        direction: auto;
      }
      .pdf-export th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
      .pdf-export tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      .pdf-export tr {
        page-break-inside: avoid;
      }
    `;
    printDiv.appendChild(style);

    const header = document.createElement('div');
    header.className = 'pdf-header';
    const logo = document.createElement('img');
    logo.src = LogoIcon;
    header.appendChild(logo);
    printDiv.appendChild(header);

    const title = document.createElement('div');
    title.className = 'pdf-title';
    title.textContent = 'University Reviews Summary';
    printDiv.appendChild(title);

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = [
      'Institution Code',
      'Institution Name',
      'Latest Program',
      'Latest Judgement',
      'Number of Reviews',
      'Latest Study Field',
      'Latest Cycle'
    ];
    
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    displayedData.forEach(university => {
      const latestReview = getLatestReview(university.Reviews);
      const row = document.createElement('tr');
      
      const rowData = [
        university.InstitutionCode,
        university.InstitutionName,
        latestReview?.Program || 'N/A',
        latestReview?.Judgement || 'N/A',
        university.Reviews.length,
        latestReview?.UnifiedStudyField || 'N/A',
        latestReview?.Cycle || 'N/A'
      ];

      rowData.forEach(text => {
        const td = document.createElement('td');
        td.textContent = String(text);
        row.appendChild(td);
      });
      
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    printDiv.appendChild(table);

    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });

    const opt = {
      margin: 1,
      filename: `Universities_Export_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    // @ts-ignore (html2pdf is loaded dynamically)
    await html2pdf().set(opt).from(printDiv).save();
  };

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
      <div className="mb-4 flex flex-col space-y-4 md:flex-row md:justify-between md:space-x-4">
        {/* Judgement Filter and Search Section */}
        <div className="flex-1">
          {/* Judgement Filter */}
          <div className="mb-4">
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
            
            {/* Search by Institution Name - Now under Judgement Filter */}
            <div className="mt-4">
              <span className="font-semibold mr-2">Search by Institution Name:</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 w-full md:w-auto"
                placeholder="Enter name..."
              />
            </div>
          </div>
        </div>
  
        {/* Export Buttons Section - Now aligned to the right */}
        <div className="flex space-x-2">
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Export as Excel"
          >
            <img
              src={XSLIcon}
              alt="Export to Excel"
              className="w-9 h-9 object-contain"
            />
            <span className="ml-2">Export as Excel</span>
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center justify-center p-3 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Export as PDF"
          >
            <img
              src={PDFIcon}
              alt="Export to PDF"
              className="w-9 h-9 object-contain"
            />
            <span className="ml-2">Export as PDF</span>
          </button>
        </div>
      </div>
  
      {/* Display the number of institutions returned */}
      <div className="mb-2 text-gray-700 font-semibold">
        {displayedData.length} Institution(s) Returned
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