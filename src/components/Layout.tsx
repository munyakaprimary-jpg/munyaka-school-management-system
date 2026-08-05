// ... existing imports ...

const Layout = ({ children }: { children: React.ReactNode }) => {
  // ... existing state and hooks ...

  // NEW: Remove any accidental JWT/token-like text that might be rendered
  useEffect(() => {
    const removeTokenNodes = () => {
      const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
      document.querySelectorAll('div, span, p, code, pre, h1, h2, h3').forEach((el) => {
        const text = el.textContent?.trim() || '';
        if (jwtPattern.test(text) && text.length > 80) {
          el.remove(); // Remove the element entirely
        }
      });
    };
    
    // Run after mount and route changes
    removeTokenNodes();
    const timer = setTimeout(removeTokenNodes, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // ... rest of the component ...

  // Modify header to have higher z-index
  <header className="h-16 pt-safe bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 shrink-0 z-50 print:hidden relative">

  // ... rest of JSX ...