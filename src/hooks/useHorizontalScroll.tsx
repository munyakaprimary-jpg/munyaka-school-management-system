import { useRef, useCallback, useEffect } from 'react';

/**
 * Simplified dual scrollbar wrapper that uses synchronized scrolling
 * to create a mirrored scrollbar at the top
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

  const handleTopScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  const handleTableScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (topScrollRef.current) {
      topScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Top scrollbar container - mirrors the main scroll position */}
      <div
        ref={topScrollRef}
        onScroll={handleTopScroll}
        className="overflow-x-auto overflow-y-hidden max-h-0 min-h-0"
        aria-hidden="true"
      >
        {/* Spacer to maintain scroll width matching the table */}
        <div className="h-1" />
      </div>
      
      {/* Main content container with scroll */}
      <div
        ref={tableContainerRef}
        onScroll={handleTableScroll}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
      >
        {children}
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
