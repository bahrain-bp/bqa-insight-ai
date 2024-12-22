import React, { useState } from 'react'
import Filter from '../Filter'
import Chat from '../../components/ChatBot/ChatBot'

const BasicView = () => {
  const [activeTab, setActiveTab] = useState(0)
  return (
    <div className="flex flex-col items-center px-8 h-screen">
      <div className="w-full mt-4 bg-white shadow-md h-1/2 rounded-md ">
        <div className='w-full flex flex-row bg-whiten rounded-t-md '>
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
        <div className="w-full h-full rounded">
          <div className={`h-full ${activeTab !== 0 && 'hidden'}`}>
            <Filter />
          </div>
          <div className={`bg-boxdark h-full ${activeTab !== 1 && 'hidden'}`}>
            <Chat />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BasicView
