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

export function RouterRoot() {
    const [chartJson, setChartJson] = useState<ChartJsonData[]>([])

    return (
        <ChartContext.Provider value={{chartJson, setChartJson}}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ChartContext.Provider>
    )
}