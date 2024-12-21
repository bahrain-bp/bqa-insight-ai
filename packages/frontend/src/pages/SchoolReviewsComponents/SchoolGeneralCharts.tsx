import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ScatterController,
  PointElement,
  ChartOptions,
  TooltipItem,
  ScatterDataPoint,
} from 'chart.js';
import { Scatter, Bar } from 'react-chartjs-2';

import { COLORS } from '../Components/Colors';
import { SchoolData } from './types';

// REGISTER
ChartJS.register(
  ScatterController,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/** Types */
type SchoolTypeFilter = 'All' | 'Government' | 'Private';

/** Parse numeric grade from "(2) Good" => 2. Returns null if not found. */
function parseGradeNumber(grade: string): number | null {
  if (!grade) return null;
  const match = grade.match(/\((\d+)\)/);
  return match ? parseFloat(match[1]) : null;
}

// ----------------------------------------------------
// 1) For the Grouped Bar of Average Grades
// ----------------------------------------------------
type CycleMap = Record<string, { sum: number; count: number }>;

function getCycleMap(
  filteredData: SchoolData[],
  filterFn: (s: SchoolData) => boolean
): CycleMap {
  const cycleMap: CycleMap = {};

  filteredData
    .filter(filterFn)
    .forEach((school) => {
      if (!school.Reviews) return;
      // Only "Review Report"
      const reviewReports = school.Reviews.filter(
        (r) => r.ReviewType === 'Review Report'
      );
      reviewReports.forEach((review) => {
        const g = parseGradeNumber(review.Grade);
        if (g != null) {
          const c = review.Cycle || 'N/A';
          if (!cycleMap[c]) {
            cycleMap[c] = { sum: 0, count: 0 };
          }
          cycleMap[c].sum += g;
          cycleMap[c].count++;
        }
      });
    });

  return cycleMap;
}

function getAllCycles(...maps: CycleMap[]): string[] {
  const all = new Set<string>();
  maps.forEach((m) => Object.keys(m).forEach((c) => all.add(c)));
  return Array.from(all).sort();
}

/** Return array of real average grades in [1..4]. */
function cycleAverages(cycles: string[], cycleMap: CycleMap): (number | null)[] {
  return cycles.map((c) => {
    const entry = cycleMap[c];
    if (!entry) return null;
    return entry.sum / entry.count;
  });
}

/** Return array of counts. */
function cycleCounts(cycles: string[], cycleMap: CycleMap): number[] {
  return cycles.map((c) => {
    const entry = cycleMap[c];
    return entry ? entry.count : 0;
  });
}

// ----------------------------------------------------
// 2) For the 100% Stacked Bar (Grade Distribution)
//    We'll store how many reviews got grade=1,2,3,4 in each cycle
// ----------------------------------------------------
interface GradeDistribution {
  [cycle: string]: {
    1: number;
    2: number;
    3: number;
    4: number;
  };
}

function getGradeDistributionMap(filteredData: SchoolData[]): GradeDistribution {
  const map: GradeDistribution = {};

  filteredData.forEach((school) => {
    if (!school.Reviews) return;
    // Only "Review Report"
    const reviewReports = school.Reviews.filter(
      (r) => r.ReviewType === 'Review Report'
    );
    reviewReports.forEach((r) => {
      const g = parseGradeNumber(r.Grade);
      if (g == null || g < 1 || g > 4) return;
      const cycle = r.Cycle || 'N/A';
      if (!map[cycle]) {
        map[cycle] = { 1: 0, 2: 0, 3: 0, 4: 0 };
      }
      map[cycle][g as keyof GradeDistribution[typeof cycle]]++;
    });
  });

  return map;
}

// ----------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------
export function SchoolGeneralCharts({ data }: { data: SchoolData[] }) {
  // ==========================
  // 1) FILTERS
  // ==========================
  const [schoolTypeFilter, setSchoolTypeFilter] = useState<SchoolTypeFilter>('All');
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

  const filteredData = useMemo(() => {
    let filtered = data;
    // Filter by school type
    if (schoolTypeFilter !== 'All') {
      filtered = filtered.filter(
        (school) =>
          school.SchoolType?.toLowerCase() === schoolTypeFilter.toLowerCase()
      );
    }
    // If Government, filter by Genders
    if (schoolTypeFilter === 'Government' && selectedGenders.length > 0) {
      filtered = filtered.filter((s) => {
        if (!s.SchoolGender) return false;
        return selectedGenders.includes(s.SchoolGender);
      });
    }
    // If Government, filter by Levels
    if (schoolTypeFilter === 'Government' && selectedLevels.length > 0) {
      filtered = filtered.filter((s) => {
        if (!s.SchoolLevel) return false;
        const lvls = s.SchoolLevel.split(',').map((lvl) => lvl.trim());
        return lvls.some((l) => selectedLevels.includes(l));
      });
    }
    return filtered;
  }, [data, schoolTypeFilter, selectedGenders, selectedLevels]);

  // ==========================
  // 2) SCATTER CHART
  // ==========================
  function toScatterPoint(school: SchoolData) {
    let xVal = 4; // default if invalid
    if (school.AverageGrade !== null && !isNaN(school.AverageGrade)) {
      xVal = Math.max(1, Math.min(4, school.AverageGrade));
    }
    const yVal = Math.random() * 0.8 - 0.4;
    return { x: xVal, y: yVal, school };
  }

  const govBoysScatter = filteredData
    .filter(
      (s) =>
        s.SchoolType?.toLowerCase() === 'government' &&
        s.SchoolGender?.toLowerCase() === 'boys'
    )
    .map(toScatterPoint);

  const govGirlsScatter = filteredData
    .filter(
      (s) =>
        s.SchoolType?.toLowerCase() === 'government' &&
        s.SchoolGender?.toLowerCase() === 'girls'
    )
    .map(toScatterPoint);

  const privateScatter = filteredData
    .filter((s) => s.SchoolType?.toLowerCase() === 'private')
    .map(toScatterPoint);

  const scatterData = {
    datasets: [
      {
        label: 'Government Boys',
        data: govBoysScatter,
        backgroundColor: COLORS.LIGHT_BLUE,
        pointRadius: 6,
      },
      {
        label: 'Government Girls',
        data: govGirlsScatter,
        backgroundColor: COLORS.RED,
        pointRadius: 6,
      },
      {
        label: 'Private Schools',
        data: privateScatter,
        backgroundColor: COLORS.YELLOW,
        pointRadius: 6,
      },
    ],
  };

  const scatterOptions: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        reverse: true, // 4..1 (left->right)
        min: 1,
        max: 4,
        title: { display: true, text: 'Average Grade' },
      },
      y: {
        display: false,
      },
    },
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'scatter'>) => {
            const raw = ctx.raw as ScatterDataPoint & { school: SchoolData };
            return [
              raw.school.EnglishSchoolName,
              `Average Grade: ${raw.school.AverageGrade ?? 'N/A'}`
            ].join('\n');
          },
        },
      },
    },
  };

  // ==========================
  // 3) GROUPED BAR CHART (INVERTED AVERAGE GRADE) + COUNTS
  // ==========================
  // 3.1) Build maps
  const govBoysMap = getCycleMap(
    filteredData,
    (s) =>
      s.SchoolType?.toLowerCase() === 'government' &&
      s.SchoolGender?.toLowerCase() === 'boys'
  );
  const govGirlsMap = getCycleMap(
    filteredData,
    (s) =>
      s.SchoolType?.toLowerCase() === 'government' &&
      s.SchoolGender?.toLowerCase() === 'girls'
  );
  const privateMap = getCycleMap(
    filteredData,
    (s) => s.SchoolType?.toLowerCase() === 'private'
  );

  // 3.2) All cycles
  const allCycles = getAllCycles(govBoysMap, govGirlsMap, privateMap);

  // 3.3) Real average [1..4]
  const govBoysBarReal = cycleAverages(allCycles, govBoysMap);
  const govGirlsBarReal = cycleAverages(allCycles, govGirlsMap);
  const privateBarReal  = cycleAverages(allCycles, privateMap);

  // 3.4) Counts
  const govBoysCount = cycleCounts(allCycles, govBoysMap);
  const govGirlsCount = cycleCounts(allCycles, govGirlsMap);
  const privateCount  = cycleCounts(allCycles, privateMap);

  // 3.5) Invert function => smaller real => taller bar
  function invertGrade(g: number | null) {
    return g == null ? null : 5 - g;
  }
  const govBoysBarData = govBoysBarReal.map(invertGrade);
  const govGirlsBarData = govGirlsBarReal.map(invertGrade);
  const privateBarData  = privateBarReal.map(invertGrade);

  // 3.6) Final data
  const barData = {
    labels: allCycles,
    datasets: [
      {
        label: 'Government Boys',
        data: govBoysBarData,
        backgroundColor: COLORS.LIGHT_BLUE,
        // store counts
        counts: govBoysCount,
      },
      {
        label: 'Government Girls',
        data: govGirlsBarData,
        backgroundColor: COLORS.RED,
        counts: govGirlsCount,
      },
      {
        label: 'Private Schools',
        data: privateBarData,
        backgroundColor: COLORS.YELLOW,
        counts: privateCount,
      },
    ],
  };

  // 3.7) Options
  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 4,
        title: {
          display: true,
          text: 'Grade (top bar = Grade 1, bottom bar = Grade 4)',
        },
        ticks: {
          stepSize: 1,
          callback: function (val) {
            // if chart=4 => real=1
            // if chart=1 => real=4
            const numeric = Number(val);
            return (5 - numeric).toString();
          },
        },
      },
      x: {
        title: { display: true, text: 'Review Cycle' },
      },
    },
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            // chartVal in [1..4] => real grade
            const chartVal = ctx.parsed.y;
            const realGrade = 5 - chartVal;

            // retrieve the count
            const ds = ctx.dataset as any;
            const idx = ctx.dataIndex;
            const count = ds.counts[idx] ?? 0;

            return `${ctx.dataset.label}: Grade ${realGrade.toFixed(2)} (Count: ${count})`;
          },
        },
      },
    },
  };

  // ==========================
  // 4) 100% STACKED BAR CHART (GRADE DISTRIBUTION) + COUNTS
  // ==========================
  // 4.1) Gather distribution
  const gradeDistMap = getGradeDistributionMap(filteredData);

  // 4.2) cycles in distribution
  const allCyclesDist = Object.keys(gradeDistMap).sort();

  // 4.3) Build arrays for each grade
  const grade1Data: number[] = [];
  const grade2Data: number[] = [];
  const grade3Data: number[] = [];
  const grade4Data: number[] = [];

  // We'll also store the absolute counts for each grade, plus the total, so we can show them in tooltips:
  const grade1Counts: number[] = [];
  const grade2Counts: number[] = [];
  const grade3Counts: number[] = [];
  const grade4Counts: number[] = [];
  const totalCounts: number[] = [];

  allCyclesDist.forEach((c) => {
    const dist = gradeDistMap[c];
    const total = dist[1] + dist[2] + dist[3] + dist[4];
    totalCounts.push(total);

    // If zero, just store 0 everywhere
    if (total === 0) {
      grade1Data.push(0);
      grade2Data.push(0);
      grade3Data.push(0);
      grade4Data.push(0);

      grade1Counts.push(0);
      grade2Counts.push(0);
      grade3Counts.push(0);
      grade4Counts.push(0);
    } else {
      // percentage
      const pct1 = (dist[1] / total) * 100;
      const pct2 = (dist[2] / total) * 100;
      const pct3 = (dist[3] / total) * 100;
      const pct4 = (dist[4] / total) * 100;

      grade1Data.push(pct1);
      grade2Data.push(pct2);
      grade3Data.push(pct3);
      grade4Data.push(pct4);

      // absolute count
      grade1Counts.push(dist[1]);
      grade2Counts.push(dist[2]);
      grade3Counts.push(dist[3]);
      grade4Counts.push(dist[4]);
    }
  });

  // 4.4) Build chart data
  const stackedDistData = {
    labels: allCyclesDist, // cycles
    datasets: [
      {
        label: 'Grade 1 (Outstanding)',
        data: grade1Data, // percentages
        backgroundColor: '#30C5A2',
        counts: grade1Counts, // absolute count of grade=1
        totals: totalCounts,  // total for the cycle
      },
      {
        label: 'Grade 2 (Good)',
        data: grade2Data,
        backgroundColor: '#37B0FF',
        counts: grade2Counts,
        totals: totalCounts,
      },
      {
        label: 'Grade 3 (Satisfactory)',
        data: grade3Data,
        backgroundColor: '#FFA600',
        counts: grade3Counts,
        totals: totalCounts,
      },
      {
        label: 'Grade 4 (Inadequate)',
        data: grade4Data,
        backgroundColor: '#D34F4F',
        counts: grade4Counts,
        totals: totalCounts,
      },
    ],
  };

  // 4.5) 100% stacked options
  const stackedDistOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        title: { display: true, text: 'Review Cycle' },
      },
      y: {
        stacked: true,
        min: 0,
        max: 100,
        title: { display: true, text: 'Distribution (%)' },
        ticks: {
          stepSize: 20,
          callback: (val) => val + '%',
        },
      },
    },
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            // e.g. "Grade 1 (Outstanding): 5 out of 10 (50%)"
            const ds = ctx.dataset as any;
            const i = ctx.dataIndex;
            const countThisGrade = ds.counts[i] ?? 0;
            const total = ds.totals[i] ?? 0;
            const valPct = ctx.parsed.y || 0; // the % in the bar
            return `${ctx.dataset.label}: ${countThisGrade} out of ${total} (${valPct.toFixed(1)}%)`;
          },
        },
      },
    },
  };

  // ==========================
  // 5) FILTER UI
  // ==========================
  const showGenderAndLevel = schoolTypeFilter === 'Government';

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

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Filter UI */}
      <div>
        <span className="font-semibold mr-2">School Type:</span>
        <button
          onClick={() => setSchoolTypeFilter('All')}
          className={`mr-2 px-3 py-1 rounded ${
            schoolTypeFilter === 'All'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-black'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSchoolTypeFilter('Government')}
          className={`mr-2 px-3 py-1 rounded ${
            schoolTypeFilter === 'Government'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-black'
          }`}
        >
          Government
        </button>
        <button
          onClick={() => setSchoolTypeFilter('Private')}
          className={`mr-2 px-3 py-1 rounded ${
            schoolTypeFilter === 'Private'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-black'
          }`}
        >
          Private
        </button>
      </div>

      {/* Gender & Level (if Government) */}
      {showGenderAndLevel && (
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

      {/* === Scatter Chart === */}
      <div className="w-full h-96 relative">
        <Scatter data={scatterData} options={scatterOptions} />
      </div>

      {/* === Grouped Bar Chart (Inverted Average Grade) with counts === */}
      <div className="w-full h-96 relative">
        <Bar data={barData} options={barOptions} />
      </div>

      {/* === 100% Stacked Bar Chart (Grade Distribution) with counts === */}
      <div className="w-full h-96 relative">
        <Bar data={stackedDistData} options={stackedDistOptions} />
      </div>
    </div>
  );
}
