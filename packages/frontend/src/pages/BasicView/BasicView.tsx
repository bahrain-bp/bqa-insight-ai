import React, { useState } from 'react'
import Filter from '../Filter'
import Chat from '../../components/ChatBot/ChatBot'
import BasicChart from './BasicChart'

const BasicView = () => {
  const [activeTab, setActiveTab] = useState(0)
  return (
    <div className="flex flex-col items-center px-8 h-screen">
      <div className={`w-full mt-4 bg-white shadow-md rounded-md flex flex-col ${activeTab !== 0 ? 'max-h-[50vh] min-h-80' : ''}`}>
        <div className='w-full shrink flex flex-row bg-whiten rounded-t-md'>
          <div
            className={`w-1/2 cursor-pointer text-center rounded-t-md py-3 ${activeTab === 0 ? 'bg-white font-bold' : 'hover:bg-whiter'}`}
            onClick={() => {
              setActiveTab(0)
            }}
          >
            Filter
          </div>
          <div
            className={`w-1/2 cursor-pointer text-center rounded-t-md py-3 ${activeTab === 1 ? 'bg-white font-bold' : 'hover:bg-whiter'}`}
            onClick={() => {
              setActiveTab(1)
            }}
          >
            Chatbot
          </div>
        </div>
        <div className={`w-full rounded grow ${activeTab !== 0 ? 'overflow-hidden' : ""}`}>
          <div className={`${activeTab !== 0 ? 'hidden' : ""}`}>
            <Filter />
          </div>
          <div className={`h-full ${activeTab !== 1 ? 'hidden' : ""}`}>
            <Chat />
          </div>
        </div>
      </div>
      <div className='basis-1/2 w-full'>
        <BasicChart />
      </div>
    </div>
  )
}

export default BasicView
