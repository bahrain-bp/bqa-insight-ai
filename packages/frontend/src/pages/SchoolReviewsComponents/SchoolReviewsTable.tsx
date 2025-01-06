import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { SchoolData, Review } from './types';
import LogoIcon from '../../images/BQA.png';
import PDFIcon from '../../images/PDF.png';
import XSLIcon from '../../images/xls.png';

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

    // Excel Export Function
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Schools');
    const fileName = `Schools_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };


  // PDF Export Function
  const exportToPDF = async () => {
    const printDiv = document.createElement('div');
    printDiv.className = 'pdf-export';
  
    const style = document.createElement('style');
    style.textContent = `
      .pdf-export {
        padding: 20px;
        font-family: Arial, sans-serif;
        margin-bottom: 40px; /* Added to prevent table cutoff */
      }
      .pdf-header {
        display: flex;
        justify-content: flex-end;
        padding-right: 20px;
        padding-top: 0;
        margin-top: -15px;
        margin-bottom: 40px; /* Increased space between logo and title */
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
        g
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
    const table = document.createElement('table');
    
    const title = document.createElement('div');
    title.className = 'pdf-title';
    title.textContent = 'School Reviews Summary';
    printDiv.appendChild(title);

   
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = [
      'Institution Code',
      'English School Name',
      'Arabic School Name',
      'School Type',
      'Average Grade',
      'Latest Review Grade',
      'Latest Review Date',
      'Number of Reviews'
    ];
    
    if (showGenderAndLevel) {
      headers.push('School Level', 'School Gender');
    }
    
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    displayedData.forEach(school => {
      const { grade: latestGrade, date: latestDate } = getLatestReviewReportData(school.Reviews);
      const row = document.createElement('tr');
      
      const rowData = [
        school.InstitutionCode,
        school.EnglishSchoolName,
        school.ArabicSchoolName,
        school.SchoolType,
        (school.AverageGrade !== null && !isNaN(school.AverageGrade)) ? school.AverageGrade : 'N/A',
        latestGrade,
        latestDate,
        school.Reviews.length
      ];

      if (showGenderAndLevel) {
        rowData.push(school.SchoolLevel || 'N/A', school.SchoolGender || 'N/A');
      }

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
      filename: `Schools_Export_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    // @ts-ignore (html2pdf is loaded dynamically)
    await html2pdf().set(opt).from(printDiv).save();
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

    const sorted = [...filteredData].sort((a, b) => compare(a, b));
    if (direction === 'desc') sorted.reverse();
    return sorted;

  }, [sortState, filteredData]);

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
          <div className="flex space-x-2">
            <button
              onClick={() => setSchoolTypeFilter('All')}
              className={`px-3 py-1 rounded ${schoolTypeFilter === 'All' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
            >
              All
            </button>
            <button
              onClick={() => setSchoolTypeFilter('Government')}
              className={`px-3 py-1 rounded ${schoolTypeFilter === 'Government' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
            >
              Government
            </button>
            <button
              onClick={() => setSchoolTypeFilter('Private')}
              className={`px-3 py-1 rounded ${schoolTypeFilter === 'Private' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
            >
              Private
            </button>
          </div>
        </div>
  
        {/* Display Gender and Levels filter for Government type */}
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
  
        {/* Search and Export buttons */}
        <div className="flex flex-col md:flex-row md:justify-between items-center">
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
                className="w-9 h-9 object-contain"  // Increased icon size
              />
              <span className="ml-2">Export as PDF</span>
            </button>
          </div>
        </div>
  
        {/* Display the number of schools returned */}
        <div className="mb-2 text-gray-700 font-semibold">
          {displayedData.length} School(s) Returned
        </div>
      </div>
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200">
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
              <td colSpan={showGenderAndLevel ? 10 : 8} className="py-4 text-center text-gray-500">
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