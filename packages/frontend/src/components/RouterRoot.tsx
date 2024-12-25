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
    "AnalyzeSchoolSlot": string | undefined,
    ProgramNameSlot: string | undefined,
    AnalyzeVocationalSlot: string | undefined,
    CompareUniversityWUniSlot: string | undefined,
    CompareUniversityWProgramsSlot: string | undefined,
    CompareSchoolSlot: "All Government Schools" | "All Private Schools" | undefined,
    CompareSpecificInstitutesSlot: string | undefined,
    CompareVocationalSlot: string | undefined,
} | undefined

type LexChartSlotsContextType = {
    chartSlots : LexChartSlots,
    setChartSlots : React.Dispatch<React.SetStateAction<LexChartSlots>>
}
export const LexChartSlotsContext = createContext<LexChartSlotsContextType>({
        chartSlots : undefined,
        setChartSlots: () => {}
    }
)

export function RouterRoot() {
    const [chartJson, setChartJson] = useState<ChartJsonData[]>([])
    const [chartSlots, setChartSlots] = useState<LexChartSlots>()

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
