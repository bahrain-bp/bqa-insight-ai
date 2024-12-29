import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { VocationalData, Review } from './types';
import LogoIcon from '../../images/BQA.png';

interface VocationalReviewsTableProps {
  data: VocationalData[];
}

type SortState = {
  column: string | null;
  direction: 'asc' | 'desc';
};

export function VocationalReviewsTable({ data }: VocationalReviewsTableProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [averageGradeFilter, setAverageGradeFilter] = useState<number>(1);
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

    const datedReviews = reviewReports
      .map(r => {
        const parsed = parseBatchReleaseDate(r.BatchReleaseDate);
        return { ...r, parsedDate: parsed };
      })
      .filter(r => r.parsedDate !== null) as (Review & { parsedDate: Date })[];

    if (datedReviews.length === 0) {
      return { grade: 'N/A', date: 'N/A' };
    }

    datedReviews.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());
    const latest = datedReviews[0];
    return { grade: latest.Grade, date: latest.BatchReleaseDate };
  }

  const exportToExcel = () => {
    const exportData = displayedData.map(institute => {
      const { grade: latestGrade, date: latestDate } = getLatestReviewReportData(institute.Reviews);
      const avgGrade =
        institute.AverageGrade !== null && !isNaN(institute.AverageGrade)
          ? institute.AverageGrade
          : 'N/A';

      return {
        'Institution Code': institute.InstitutionCode,
        'English Institute Name': institute.EnglishInstituteName,
        'Arabic Institute Name': institute.ArabicInstituteName,
        'Average Grade': avgGrade,
        'Latest Review Grade': latestGrade,
        'Latest Review Date': latestDate,
        'Number of Reviews': institute.Reviews.length,
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vocational Institutes');
    const fileName = `Vocational_Institutes_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
    title.textContent = 'Vocational Institutes Reviews Summary';
    printDiv.appendChild(title);

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = [
      'Institution Code',
      'English Institute Name',
      'Arabic Institute Name',
      'Average Grade',
      'Latest Review Grade',
      'Latest Review Date',
      'Number of Reviews'
    ];
    
    headers.forEach(hdr => {
      const th = document.createElement('th');
      th.textContent = hdr;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    displayedData.forEach(institute => {
      const { grade: latestGrade, date: latestDate } = getLatestReviewReportData(institute.Reviews);
      const row = document.createElement('tr');
      
      const rowData = [
        institute.InstitutionCode,
        institute.EnglishInstituteName,
        institute.ArabicInstituteName,
        institute.AverageGrade !== null && !isNaN(institute.AverageGrade)
          ? institute.AverageGrade.toFixed(2)
          : 'N/A',
        latestGrade,
        latestDate,
        institute.Reviews.length,
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
      filename: `Vocational_Institutes_Export_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    // @ts-ignore (html2pdf is loaded dynamically)
    await html2pdf().set(opt).from(printDiv).save();
  };

  // Apply Average Grade Filter
  const filteredData = useMemo(() => {
    return data.filter((institute) => {
      return institute.AverageGrade >= averageGradeFilter;
    });
  }, [data, averageGradeFilter]);

  // Sorting
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
        return aVal
          .toString()
          .localeCompare(bVal.toString(), undefined, { numeric: true, sensitivity: 'base' });
      }
    };

    const sorted = [...filteredData].sort((a, b) => compare(a, b));
    if (direction === 'desc') sorted.reverse();
    return sorted;
  }, [sortState, filteredData]);

  // Apply Search Query
  const displayedData = useMemo(() => {
    if (searchQuery.trim() === '') {
      return sortedData;
    }
    const query = searchQuery.toLowerCase();
    return sortedData.filter((institute) =>
      institute.EnglishInstituteName.toLowerCase().includes(query)
    );
  }, [searchQuery, sortedData]);

  // Compute Overall Average
  const overallAverage = useMemo(() => {
    if (displayedData.length === 0) return 'N/A';
    const sum = displayedData.reduce((acc, institute) => acc + institute.AverageGrade, 0);
    const avg = sum / displayedData.length;
    return avg.toFixed(2);
  }, [displayedData]);

  const handleSort = (col: string) => {
    setSortState((prev) => {
      if (prev.column === col) {
        return { column: col, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      } else {
        return { column: col, direction: 'asc' };
      }
    });
  };

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
  
        <div className="flex justify-between items-center">
          <div>
            <span className="font-semibold mr-2">Search by English Institute Name:</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1"
              placeholder="Enter name..."
            />
          </div>
          <div className="space-x-2">
            <button
              onClick={exportToExcel}
              className="bg-[#0F7E0F] hover:bg-[#0D6A0D] text-white px-4 py-2 rounded"
            >
              Export as Excel
            </button>
            <button
              onClick={exportToPDF}
              className="bg-primary hover:bg-primary text-white px-4 py-2 rounded"
            >
              Export as PDF
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
        <div className="text-gray-700 font-semibold">
          {displayedData.length} institute(s) returned
        </div>
        <div className="text-gray-700 font-semibold">
          Overall Average Grade: {overallAverage}
        </div>
      </div>

      </div>
  
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th
                className="px-4 py-2 border cursor-pointer"
                onClick={() => handleSort('InstitutionCode')}
              >
                Institution Code {renderSortIndicator('InstitutionCode')}
              </th>
              <th
                className="px-4 py-2 border cursor-pointer"
                onClick={() => handleSort('EnglishInstituteName')}
              >
                English Institute Name {renderSortIndicator('EnglishInstituteName')}
              </th>
              <th
                className="px-4 py-2 border cursor-pointer"
                onClick={() => handleSort('ArabicInstituteName')}
              >
                Arabic Institute Name {renderSortIndicator('ArabicInstituteName')}
              </th>
              <th
                className="px-4 py-2 border cursor-pointer"
                onClick={() => handleSort('AverageGrade')}
              >
                Average Grade {renderSortIndicator('AverageGrade')}
              </th>
              <th
                className="px-4 py-2 border cursor-pointer"
                onClick={() => handleSort('LatestReviewGrade')}
              >
                Latest Review Grade {renderSortIndicator('LatestReviewGrade')}
              </th>
              <th
                className="px-4 py-2 border cursor-pointer"
                onClick={() => handleSort('LatestReviewDate')}
              >
                Latest Review Date {renderSortIndicator('LatestReviewDate')}
              </th>
              <th
                className="px-4 py-2 border cursor-pointer"
                onClick={() => handleSort('NumberOfReviews')}
              >
                Number of Reviews {renderSortIndicator('NumberOfReviews')}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedData.map((institute, index) => {
              const { grade: latestGrade, date: latestDate } = getLatestReviewReportData(institute.Reviews);
              return (
                <tr
                  key={institute.InstitutionCode}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-4 py-2 border">{institute.InstitutionCode}</td>
                  <td className="px-4 py-2 border">{institute.EnglishInstituteName}</td>
                  <td className="px-4 py-2 border">{institute.ArabicInstituteName}</td>
                  <td className="px-4 py-2 border">
                    {institute.AverageGrade !== null && !isNaN(institute.AverageGrade)
                      ? institute.AverageGrade.toFixed(2)
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-2 border">{latestGrade}</td>
                  <td className="px-4 py-2 border">{latestDate}</td>
                  <td className="px-4 py-2 border">{institute.Reviews.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
  
      {displayedData.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No institutes found matching the current filters.
        </div>
      )}
    </div>
  );
}
