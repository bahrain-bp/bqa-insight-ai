import { createContext, useState } from "react";
import App from "../App.tsx"; // Main application component
import {ChartJsonData} from "../pages/Dashboard/dynamicChart.tsx"; // Type for chart data
import {BrowserRouter } from "react-router-dom"; // For client-side routing

// Define the type for the ChartContext
type ChartContextType = {
    chartJson : ChartJsonData[], // Array of chart data
    setChartJson : React.Dispatch<React.SetStateAction<ChartJsonData[]>> // Function to update chart data
}

// Create a context to manage chart JSON data
export const ChartContext = createContext<ChartContextType>({
        chartJson : [], // Default value for chart JSON data
        setChartJson: () => {} // Default no-op function for setting chart data
    }
)

// Define the type for the LexChartSlots, which represent different chart slots
export type LexChartSlots = {
    AnalyzeSchoolSlot?: string,
    AnalyzeVocationalSlot?: string,
    UniNameSlot?: string,
    AnalyzeUniversityNameSlot?: string,
    ProgramNameSlot?: string,
    CompareUniversityWUniSlot?: string,
    CompareUniversityWprogSlot?: string,
    CompareUniversityUniSlot?: string,
    CompareUniversityWprogUniversityNameSlot? : string,
    CompareSchoolSlot?: "All Government Schools" | "All Private Schools",
    CompareSpecificInstitutesSlot?: string,
    CompareVocationalSlot?: string,
}

// Define the type for the LexChartSlotsContext, managing chart slot states
type LexChartSlotsContextType = {
    chartSlots : LexChartSlots, // Current state of chart slots
    setChartSlots : React.Dispatch<React.SetStateAction<LexChartSlots>> // Function to update chart slots
}

// Create a context to manage chart slot states
export const LexChartSlotsContext = createContext<LexChartSlotsContextType>({
        chartSlots : {}, // Default empty object for chart slots
        setChartSlots: () => {} // Default no-op function for setting chart slots
    }
)

// Define the RouterRoot component to set up application routing and provide contexts
export function RouterRoot() {
    const [chartJson, setChartJson] = useState<ChartJsonData[]>([]) // State to manage chart JSON data
    const [chartSlots, setChartSlots] = useState<LexChartSlots>({})  // State to manage chart slots

    return (
         // Provide chart JSON context to the application
        <ChartContext.Provider value={{chartJson, setChartJson}}>
            {/* Provide chart slots context to the application */}
            <LexChartSlotsContext.Provider value={{chartSlots, setChartSlots}}>
                {/* Wrap the application with BrowserRouter for routing */}
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </LexChartSlotsContext.Provider>
        </ChartContext.Provider>
    )
}
