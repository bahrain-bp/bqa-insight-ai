import React, { useState, ReactNode, createContext } from 'react';
import Header from '../components/Header/index';
import Sidebar from '../components/Sidebar/index';
import ChatButton from "../components/ChatBot/ChatBot.tsx";

type ChatContextType = {isChatOpen : boolean, setIsChatOpen : React.Dispatch<React.SetStateAction<boolean>>}
export const ChatContext = createContext<ChatContextType>({isChatOpen : false, setIsChatOpen : () => {}});

const DefaultLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* <!-- ===== Main Content End ===== --> */
  const [isChatOpen, setIsChatOpen] = useState(false);
 
  return (
<ChatContext.Provider value={{isChatOpen, setIsChatOpen}}>
<div className="dark:bg-boxdark-2 dark:text-bodydark">
      {/* <!-- ===== Page Wrapper Start ===== --> */}
      <div className="flex h-screen overflow-hidden">
        {/* <!-- ===== Sidebar Start ===== --> */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        {/* <!-- ===== Sidebar End ===== --> */}

        {/* <!-- ===== Content Area Start ===== --> */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* <!-- ===== Header Start ===== --> */}
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          {/* <!-- ===== Header End ===== --> */}

          {/* <!-- ===== Main Content Start ===== --> */}
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              {children}
            </div>
          </main>
          {}
          {/* <ChatButton /> */}
        </div>
        {/* <!-- ===== Content Area End ===== --> */}
      </div>
      {/* <!-- ===== Page Wrapper End ===== --> */}
    </div>
</ChatContext.Provider>
   
  );
};

export default DefaultLayout;
