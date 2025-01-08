import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import LogoIcon from '../../images/BQA.png';
import PDFIcon from '../../images/PDF.png';
import XSLIcon from '../../images/xls.png';

// Define types for Review and University Data
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

// Sort state type
type SortState = {
  column: string | null;
  direction: 'asc' | 'desc';
};

export function UniversityReviewsTable({ data }: UniversityReviewsTableProps): JSX.Element {
  // State hooks for search query, judgement filter, and sort state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [judgementFilter, setJudgementFilter] = useState<string>('all');
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: 'asc' });

  // Display error if the data format is invalid
  if (!Array.isArray(data)) {
    return <div className="text-red-500">Error: Invalid data format</div>;
  }

  // Function to get the latest review for a university
  function getLatestReview(reviews: Review[]): Review | null {
    if (!Array.isArray(reviews) || reviews.length === 0) return null;
    return reviews[reviews.length - 1];
  }

  // Function to export the data to Excel
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

  // Function to export the data to PDF
  const exportToPDF = async () => {
    const printDiv = document.createElement('div');
    printDiv.className = 'pdf-export';
  
    // Create and add custom styling for the PDF export
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

    // Add logo and title to the PDF export
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

    // Create table for PDF export
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
    
    // Append header cells to the table
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Append data rows to the table
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

    // Dynamically load the html2pdf.js library
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });

    // Configure options for generating the PDF
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

  // Filter data based on the judgement filter
  const filteredData = useMemo(() => {
    return data.filter((university) => {
      const latestReview = getLatestReview(university.Reviews);
      
      if (judgementFilter === 'all') {
        return true;
      }
      
      return latestReview?.Judgement?.toLowerCase() === judgementFilter.toLowerCase();
    });
  }, [data, judgementFilter]);

  // Sort data based on the sort state (ascending or descending)
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

  // Filtered and sorted data ready for display
  const displayedData = useMemo(() => {
    if (searchQuery.trim() === '') return sortedData;
    
    const query = searchQuery.toLowerCase();
    return sortedData.filter((university) =>
      university.InstitutionName.toLowerCase().includes(query)
    );
  }, [searchQuery, sortedData]);

  // Handle column sorting when clicked
  const handleSort = (col: string) => {
    setSortState((prev) => ({
      column: col,
      direction: prev.column === col ? (prev.direction === 'asc' ? 'desc' : 'asc') : 'asc'
    }));
  };

  // Render the sorting indicator (arrow) based on the current sort direction
  function renderSortIndicator(columnName: string) {
    if (sortState.column !== columnName) return null;
    return sortState.direction === 'asc' ? ' ▲' : ' ▼';
  }

  return (
    <div className="w-full">
      {/* Filter and search controls */}
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
            </div>
      {/* Search Input */}
      <div className="md:w-1/2 lg:w-1/3">
        <input
          type="text"
          placeholder="Search by institution name..."
          className="w-full border border-gray-300 rounded px-3 py-2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>

    {/* Export Buttons */}
      <div className="mt-4 md:mt-0 flex space-x-2">
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

  {/* Display Data Table */}
  <div className="overflow-x-auto">
    <table className="w-full table-auto border-collapse border border-gray-300 text-sm">
      <thead>
        <tr className="bg-gray-200 text-gray-700">
          {/* Render Table Headers */}
          <th
            onClick={() => handleSort('InstitutionCode')}
            className="px-4 py-2 cursor-pointer"
          >
            Institution Code{renderSortIndicator('InstitutionCode')}
          </th>
          <th
            onClick={() => handleSort('InstitutionName')}
            className="px-4 py-2 cursor-pointer"
          >
            Institution Name{renderSortIndicator('InstitutionName')}
          </th>
          <th
            onClick={() => handleSort('LatestProgram')}
            className="px-4 py-2 cursor-pointer"
          >
            Latest Program{renderSortIndicator('LatestProgram')}
          </th>
          <th
            onClick={() => handleSort('LatestJudgement')}
            className="px-4 py-2 cursor-pointer"
          >
            Latest Judgement{renderSortIndicator('LatestJudgement')}
          </th>
          <th
            onClick={() => handleSort('NumberOfReviews')}
            className="px-4 py-2 cursor-pointer"
          >
            Number of Reviews{renderSortIndicator('NumberOfReviews')}
          </th>
          <th
            onClick={() => handleSort('LatestStudyField')}
            className="px-4 py-2 cursor-pointer"
          >
            Latest Study Field{renderSortIndicator('LatestStudyField')}
          </th>
          <th
            onClick={() => handleSort('LatestCycle')}
            className="px-4 py-2 cursor-pointer"
          >
            Latest Cycle{renderSortIndicator('LatestCycle')}
          </th>
        </tr>
      </thead>
      <tbody>
        {/* Display Rows Based on Filtered and Sorted Data */}
        {displayedData.map((university, idx) => {
          const latestReview = getLatestReview(university.Reviews);
          return (
            <tr key={idx} className="even:bg-gray-100">
              <td className="border px-4 py-2">{university.InstitutionCode}</td>
              <td className="border px-4 py-2">{university.InstitutionName}</td>
              <td className="border px-4 py-2">{latestReview?.Program || 'N/A'}</td>
              <td className="border px-4 py-2">{latestReview?.Judgement || 'N/A'}</td>
              <td className="border px-4 py-2">{university.Reviews?.length || 0}</td>
              <td className="border px-4 py-2">{latestReview?.UnifiedStudyField || 'N/A'}</td>
              <td className="border px-4 py-2">{latestReview?.Cycle || 'N/A'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>
); }
