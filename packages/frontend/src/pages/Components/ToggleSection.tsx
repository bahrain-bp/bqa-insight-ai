// ./ToggleSection.tsx

import { useState } from 'react';

interface ToggleSectionProps {
  title: string;
  children: React.ReactNode;
  ariaControls: string;
}

export function ToggleSection({ title, children, ariaControls }: ToggleSectionProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const toggle = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <div className="w-full flex flex-col mb-4">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 bg-white rounded shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        aria-expanded={isExpanded}
        aria-controls={ariaControls}
      >
        <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
        {/* Arrow Icon */}
        <svg
          className={`w-6 h-6 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div
          id={ariaControls}
          className="mt-4 p-4 bg-white rounded shadow transition-all duration-300 ease-in-out"
        >
          {children}
        </div>
      )}
    </div>
  );
}
