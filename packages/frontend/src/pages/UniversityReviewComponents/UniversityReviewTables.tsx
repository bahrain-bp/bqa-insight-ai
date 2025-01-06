import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx'; // Import XLSX library for exporting to Excel
import LogoIcon from '../../images/BQA.png';  // Importing logo for the PDF export
import PDFIcon from '../../images/PDF.png';  // Importing PDF icon for export button
import XSLIcon from '../../images/xls.png';  // Importing Excel icon for export button

// Define types for Review and University data structure
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
  data: UniversityData[]; // Data passed from the parent component containing university information
}

type SortState = {
  column: string | null; // The column by which the table is sorted
  direction: 'asc' | 'desc'; // The direction of sorting, either ascending or descending
};

// UniversityReviewsTable component definition
export function UniversityReviewsTable({ data }: UniversityReviewsTableProps): JSX.Element {
  // State hooks to manage the search query, judgement filter, and sorting state
  const [searchQuery, setSearchQuery] = useState<string>(''); // Search query for filtering institutions by name
  const [judgementFilter, setJudgementFilter] = useState<string>('all'); // Filter to show reviews based on judgement (approved/rejected)
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: 'asc' }); // Sort state to track the column and direction

  // Check if the provided data is an array, otherwise show an error message
  if (!Array.isArray(data)) {
    return <div className="text-red-500">Error: Invalid data format</div>;
  }

  // Helper function to get the latest review from a list of reviews for a given university
  function getLatestReview(reviews: Review[]): Review | null {
    if (!Array.isArray(reviews) || reviews.length === 0) return null; // Return null if no reviews exist
    return reviews[reviews.length - 1]; // Return the last review as the latest one
  }

  // Function to export the table data to an Excel file using the XLSX library
  const exportToExcel = () => {
    // Map the data into a simplified structure for export
    const exportData = displayedData.map(university => {
      const latestReview = getLatestReview(university.Reviews); // Get the latest review of each university

      return {
        'Institution Code': university.InstitutionCode, // University code
        'Institution Name': university.InstitutionName, // University name
        'Latest Program': latestReview?.Program || 'N/A', // Latest program or 'N/A' if no review
        'Latest Judgement': latestReview?.Judgement || 'N/A', // Latest judgement or 'N/A' if no review
        'Number of Reviews': university.Reviews.length, // Total number of reviews for this university
        'Latest Review Type': latestReview?.Type || 'N/A', // Type of the latest review or 'N/A'
        'Latest Study Field': latestReview?.UnifiedStudyField || 'N/A', // Study field of the latest review or 'N/A'
        'Latest Cycle': latestReview?.Cycle || 'N/A' // Cycle of the latest review or 'N/A'
      };
    });

    // Create a worksheet from the export data
    const ws = XLSX.utils.json_to_sheet(exportData); 
    const wb = XLSX.utils.book_new(); // Create a new workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Universities'); // Append the worksheet to the workbook
    const fileName = `Universities_Export_${new Date().toISOString().split('T')[0]}.xlsx`; // File name with the current date
    XLSX.writeFile(wb, fileName); // Trigger the download of the Excel file
  };

  // Function to export the table data to a PDF using html2pdf.js
  const exportToPDF = async () => {
    const printDiv = document.createElement('div');
    printDiv.className = 'pdf-export'; // Add a class to style the exported PDF content

    // Create and inject styles for the PDF content
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

    // Header section with logo
    const header = document.createElement('div');
    header.className = 'pdf-header';
    const logo = document.createElement('img');
    logo.src = LogoIcon;  // Use the imported logo image
    header.appendChild(logo);
    printDiv.appendChild(header);

    // Title section for the PDF
    const title = document.createElement('div');
    title.className = 'pdf-title';
    title.textContent = 'University Reviews Summary'; // Title text for the PDF
    printDiv.appendChild(title);

    // Create the table structure for the PDF export
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

    // Generate header row for the table
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body of the table with university data
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

      // Add data cells to the row
      rowData.forEach(text => {
        const td = document.createElement('td');
        td.textContent = String(text); // Convert data to string if necessary
        row.appendChild(td);
      });

      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    printDiv.appendChild(table);

    // Dynamically load the html2pdf.js script for PDF export
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });

    // PDF options configuration
    const opt = {
      margin: 1,
      filename: `Universities_Export_${new Date().toISOString().split('T')[0]}.pdf`, // File name with the current date
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    // @ts-ignore (html2pdf is loaded dynamically)
    await html2pdf().set(opt).from(printDiv).save();  // Export the content as a PDF file
  };

  // Memoized filtered data based on the search query and judgement filter
  const filteredData = useMemo(() => {
    return data.filter((university) => {
      const latestReview = getLatestReview(university.Reviews);
      
      // If the judgementFilter is 'all', no filtering is applied
      if (judgementFilter === 'all') {
        return true;
      }
      
      // Filter based on the judgement value
      return latestReview?.Judgement?.toLowerCase() === judgementFilter.toLowerCase();
    });
  }, [data, judgementFilter]); // Dependency array ensures it updates when the filter changes

  // Memoized sorted data based on the current sorting state (column and direction)
  const sortedData = useMemo(() => {
    if (!sortState.column) return filteredData; // If no column is selected for sorting, return filtered data

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortState.column as keyof UniversityData] as string | number;
      const bValue = b[sortState.column as keyof UniversityData] as string | number;

      // Sorting logic: Ascending or descending based on the direction
      if (aValue < bValue) return sortState.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortState.direction === 'asc' ? 1 : -1;
      return 0; // If values are equal, no sorting is applied
    });
  }, [filteredData, sortState]); // Recalculate when data or sort state changes

  // Display the data to be shown in the table
  const displayedData = sortedData.filter((university) => {
    // Filter based on search query (institution name)
    return university.InstitutionName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Handle sorting when a table header is clicked
  const handleSort = (column: string) => {
    setSortState((prevState) => {
      // Toggle sorting direction if the same column is clicked again
      if (prevState.column === column) {
        return {
          column,
          direction: prevState.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      // Default to ascending if a new column is clicked
      return { column, direction: 'asc' };
    });
  };

  // Render the sort indicator (ascending or descending arrow)
  const renderSortIndicator = (column: string) => {
    if (sortState.column !== column) return null;
    return sortState.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div>
      {/* Filter and search options */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <select
            className="px-2 py-1 border rounded-md"
            value={judgementFilter}
            onChange={(e) => setJudgementFilter(e.target.value)} // Update judgement filter
          >
            <option value="all">All Judgements</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            type="text"
            className="px-2 py-1 border rounded-md"
            placeholder="Search by institution name" // Input for search query
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // Update search query
          />
        </div>

        {/* Export buttons for Excel and PDF */}
        <div className="flex space-x-2">
          <button className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md" onClick={exportToExcel}>
            <img src={XSLIcon} alt="Excel" className="w-5 h-5" />
            <span>Export to Excel</span>
          </button>
          <button className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-md" onClick={exportToPDF}>
            <img src={PDFIcon} alt="PDF" className="w-5 h-5" />
            <span>Export to PDF</span>
          </button>
        </div>
      </div>

      {/* Table to display universities and their reviews */}
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            {/* Table headers with sorting functionality */}
            <th className="border border-gray-300 px-4 py-2 cursor-pointer" onClick={() => handleSort('InstitutionCode')}>
              Institution Code{renderSortIndicator('InstitutionCode')}
            </th>
            <th className="border border-gray-300 px-4 py-2 cursor-pointer" onClick={() => handleSort('InstitutionName')}>
              Institution Name{renderSortIndicator('InstitutionName')}
            </th>
            <th className="border border-gray-300 px-4 py-2 cursor-pointer" onClick={() => handleSort('LatestProgram')}>
              Latest Program{renderSortIndicator('LatestProgram')}
            </th>
            <th className="border border-gray-300 px-4 py-2 cursor-pointer" onClick={() => handleSort('LatestJudgement')}>
              Latest Judgement{renderSortIndicator('LatestJudgement')}
            </th>
            <th className="border border-gray-300 px-4 py-2 cursor-pointer" onClick={() => handleSort('NumberOfReviews')}>
              Number of Reviews{renderSortIndicator('NumberOfReviews')}
            </th>
            <th className="border border-gray-300 px-4 py-2 cursor-pointer" onClick={() => handleSort('LatestStudyField')}>
              Latest Study Field{renderSortIndicator('LatestStudyField')}
            </th>
            <th className="border border-gray-300 px-4 py-2 cursor-pointer" onClick={() => handleSort('LatestCycle')}>
              Latest Cycle{renderSortIndicator('LatestCycle')}
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Render each university data */}
          {displayedData.map((university, index) => {
            const latestReview = getLatestReview(university.Reviews);
            return (
              <tr key={index}>
                <td className="border border-gray-300 px-4 py-2">{university.InstitutionCode}</td>
                <td className="border border-gray-300 px-4 py-2">{university.InstitutionName}</td>
                <td className="border border-gray-300 px-4 py-2">{latestReview?.Program || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-2">{latestReview?.Judgement || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-2">{university.Reviews.length}</td>
                <td className="border border-gray-300 px-4 py-2">{latestReview?.UnifiedStudyField || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-2">{latestReview?.Cycle || 'N/A'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
