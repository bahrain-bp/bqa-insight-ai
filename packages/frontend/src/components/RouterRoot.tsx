import { createContext, useState } from "react";
import App from "../App.tsx";
import {ChartJsonData} from "../pages/Dashboard/dynamicChart.tsx";
import {BrowserRouter } from "react-router-dom";

type ChartContextType = {
    chartJson : ChartJsonData[],
    setChartJson : React.Dispatch<React.SetStateAction<ChartJsonData[]>>
}
export const ChartContext = createContext<ChartContextType>({
        chartJson : [],
        setChartJson: () => {}
    }
)

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

type LexChartSlotsContextType = {
    chartSlots : LexChartSlots,
    setChartSlots : React.Dispatch<React.SetStateAction<LexChartSlots>>
}
export const LexChartSlotsContext = createContext<LexChartSlotsContextType>({
        chartSlots : {},
        setChartSlots: () => {}
    }
)

export function RouterRoot() {
    const [chartJson, setChartJson] = useState<ChartJsonData[]>([])
    const [chartSlots, setChartSlots] = useState<LexChartSlots>({})

    return (
        <ChartContext.Provider value={{chartJson, setChartJson}}>
            <LexChartSlotsContext.Provider value={{chartSlots, setChartSlots}}>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </LexChartSlotsContext.Provider>
        </ChartContext.Provider>
    )
}
