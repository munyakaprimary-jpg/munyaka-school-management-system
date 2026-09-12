import React, { useRef } from 'react';

export const StaffAccessMaster = () => {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  // Sync scroll positions between top bar and table body
  const handleScroll = (source: 'top' | 'bottom') => {
    if (source === 'top' && topScrollRef.current && bottomScrollRef.current) {
      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    } else if (source === 'bottom' && topScrollRef.current && bottomScrollRef.current) {
      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* 1. TOP DUMMY SCROLLBAR */}
      <div 
        ref={topScrollRef}
        onScroll={() => handleScroll('top')}
        className="overflow-x-auto overflow-y-hidden border-b border-gray-100 h-3 bg-gray-50/50"
      >
        {/* Match width of full inner table (e.g. 1200px or min-w-[1200px]) */}
        <div className="min-w-[1200px] h-px" />
      </div>

      {/* 2. MAIN TABLE CONTAINER */}
      <div 
        ref={bottomScrollRef}
        onScroll={() => handleScroll('bottom')}
        className="overflow-x-auto"
      >
        <table className="w-full min-w-[1200px] text-left border-collapse">
          {/* Table Headers & Rows */}
        </table>
      </div>

    </div>
  );
};

export default StaffAccessMaster;
