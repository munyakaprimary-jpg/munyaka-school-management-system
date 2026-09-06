import { useRef, useCallback, useState, useEffect } from 'react';

/**
 * Simplified dual scrollbar wrapper that uses synchronized scrolling
 * to create a visible mirrored scrollbar at the top
 */
export function DualScrollContainer({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);

  // Sync scroll position from top to bottom
  const handleTopScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  // Sync scroll position from bottom to top
  const handleTableScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (topScrollRef.current) {
      topScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  // Update the scroll width when content changes
  const updateScrollWidth = useCallback(() => {
    if (tableContainerRef.current) {
      // Use scrollWidth to match the actual scrollable range
      const width = tableContainerRef.current.scrollWidth;
      setScrollWidth(width);
    }
  }, []);

  // Initial measurement and resize observer
  useEffect(() => {
    updateScrollWidth();

    // Set up resize observer for dynamic content
    const resizeObserver = new ResizeObserver(() => {
      updateScrollWidth();
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    // Also observe the table container for scroll width changes
    if (tableContainerRef.current) {
      resizeObserver.observe(tableContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [children, updateScrollWidth]);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Top scrollbar container - mirrors the main scroll position */}
      <div
        ref={topScrollRef}
        onScroll={handleTopScroll}
        className="overflow-x-scroll overflow-y-hidden h-3 bg-slate-50 border-b border-slate-200 scrollbar-top-visible scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100"
        style={{
          scrollbarWidth: 'thin',
          opacity: 1,
          visibility: 'visible',
        }}
        aria-hidden="true"
      >
        {/* Spacer with dynamic width matching the table's scrollable range */}
        <div style={{ width: `${scrollWidth}px`, height: '1px' }} />
      </div>
      
      {/* Main content container with scroll */}
      <div
        ref={tableContainerRef}
        onScroll={handleTableScroll}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for synchronized horizontal scrolling between two scrollable containers.
 * Creates dual scrollbars (top and bottom) that stay in sync.
 */
export function useHorizontalScroll() {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const handleTopScroll = useCallback(() => {
    if (bottomScrollRef.current && !isScrolling.current) {
      isScrolling.current = true;
      bottomScrollRef.current.scrollLeft = topScrollRef.current?.scrollLeft || 0;
      requestAnimationFrame(() => {
        isScrolling.current = false;
      });
    }
  }, []);

  const handleBottomScroll = useCallback(() => {
    if (topScrollRef.current && !isScrolling.current) {
      isScrolling.current = true;
      topScrollRef.current.scrollLeft = bottomScrollRef.current?.scrollLeft || 0;
      requestAnimationFrame(() => {
        isScrolling.current = false;
      });
    }
  }, []);

  // Sync scroll position when content changes
  const syncScroll = useCallback(() => {
    if (topScrollRef.current && bottomScrollRef.current) {
      const scrollLeft = topScrollRef.current.scrollLeft;
      bottomScrollRef.current.scrollLeft = scrollLeft;
      topScrollRef.current.scrollLeft = scrollLeft;
    }
  }, []);

  // Sync on resize
  useEffect(() => {
    const syncOnResize = () => {
      if (topScrollRef.current && bottomScrollRef.current) {
        topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
      }
    };
    window.addEventListener('resize', syncOnResize);
    return () => window.removeEventListener('resize', syncOnResize);
  }, []);

  return {
    topScrollRef,
    bottomScrollRef,
    handleTopScroll,
    handleBottomScroll,
    syncScroll,
  };
}
