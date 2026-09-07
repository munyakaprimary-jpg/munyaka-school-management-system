import { useRef, useCallback, useState, useEffect, useLayoutEffect } from 'react';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Synchronized dual scrollbar wrapper.
 *
 * Renders a visible, always-mounted horizontal scrollbar above the main
 * table container. The top track mirrors the main container's `scrollLeft`
 * (and vice-versa), so dragging either bar scrolls the entire table in
 * tandem. Designed for wide data tables on mobile/tablet where the native
 * bottom scrollbar is often hard to reach.
 *
 * Structure:
 *   Top Track     → `.top-scrollbar overflow-x-auto overflow-y-hidden w-full h-4 mb-1`
 *                   (inner placeholder width = content scrollWidth)
 *   Main Container → `.main-table-container overflow-x-auto w-full`
 *
 * Sync is implemented as direct `scrollLeft` writes with a `isScrolling`
 * re-entrancy guard so the two scroll handlers don't ping-pong.
 */
export function DualScrollContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);
  const [contentWidth, setContentWidth] = useState(0);

  // Sync from top → bottom
  const handleTopScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncing.current) return;
    const target = e.currentTarget;
    if (bottomRef.current && bottomRef.current.scrollLeft !== target.scrollLeft) {
      isSyncing.current = true;
      bottomRef.current.scrollLeft = target.scrollLeft;
      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    }
  }, []);

  // Sync from bottom → top
  const handleBottomScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncing.current) return;
    const target = e.currentTarget;
    if (topRef.current && topRef.current.scrollLeft !== target.scrollLeft) {
      isSyncing.current = true;
      topRef.current.scrollLeft = target.scrollLeft;
      requestAnimationFrame(() => {
        isSyncing.current = false;
      });
    }
  }, []);

  // Keep the top track's placeholder width equal to the bottom container's
  // scrollable range. We read `scrollWidth` (not `offsetWidth`) so the track
  // matches the actual scrollable extent regardless of viewport.
  const measure = useCallback(() => {
    const bottom = bottomRef.current;
    if (!bottom) return;
    // Use the inner content's scrollWidth when available — it stays accurate
    // even when the bottom container itself is constrained by padding/borders.
    const width = contentRef.current
      ? contentRef.current.scrollWidth
      : bottom.scrollWidth;
    const client = bottom.clientWidth;
    setContentWidth(Math.max(width, client));
  }, []);

  useIsoLayoutEffect(() => {
    measure();
  }, [measure, children]);

  useEffect(() => {
    measure();

    const ro = new ResizeObserver(() => measure());
    if (contentRef.current) ro.observe(contentRef.current);
    if (bottomRef.current) ro.observe(bottomRef.current);

    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, children]);

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {/* Top horizontal scrollbar track — always visible on mobile/tablet */}
      <div
        ref={topRef}
        onScroll={handleTopScroll}
        className="top-scrollbar overflow-x-auto overflow-y-hidden w-full h-4 mb-1 bg-slate-50 border border-slate-200 rounded-md scrollbar-top-visible"
        style={{
          scrollbarWidth: 'thin',
          opacity: 1,
          visibility: 'visible',
        }}
        aria-hidden="true"
      >
        {/* Placeholder that establishes the scrollable range of the top track */}
        <div style={{ width: `${contentWidth}px`, height: '1px' }} />
      </div>

      {/* Main table container — scrolling here drives the top track */}
      <div
        ref={bottomRef}
        onScroll={handleBottomScroll}
        className="main-table-container overflow-x-auto w-full"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div ref={contentRef} className="min-w-full">
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
