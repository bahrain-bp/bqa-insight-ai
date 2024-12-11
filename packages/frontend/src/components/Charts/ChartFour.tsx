import React, { useContext } from 'react';
import { ChatContext } from '../../layout/DefaultLayout';

const ChartFour: React.FC = () => {
    const { setIsChatOpen } = useContext(ChatContext);

    return (
        <div className="sm:px-7.5 col-span-12 rounded-sm border border-stroke bg-white px-8 pb-8 pt-9 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-7">
          <div className="mb-4 sm:mb-6 flex flex-wrap gap-4">
            <div className="sm:w-full">
              <h6 className="text-3xl font-bold text-black dark:text-white mb-3">
                Welcome to InsightAI!
              </h6>
              <br/>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-6">
                InsightAI, developed by Bahrain's Education and Training Quality Authority (BQA) with AWS, is an AI-driven platform transforming educational data into actionable insights. By swiftly analyzing data from reviews, exams, and qualifications, InsightAI empowers leaders to make evidence-based decisions, driving timely improvements and enhancing education quality across Bahrain.
              </p>
              <br/><br/> <br/>
              {/* Centered button */}
              <div className="flex justify-center">
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="px-30 py-3 text-lg  bg-primary text-white border-none rounded-lg hover:bg-lightblue transition duration-300"
                >
                  Start Insighting
                </button>
              </div>
            </div>
          </div>

          {/* Content section */}
          <div className="mb-2">
            <div id="chartThree" className="mx-auto flex justify-center">
              {/* Content goes here */}
            </div>
          </div>
        </div>
    );
};

export default ChartFour;
