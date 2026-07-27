import { useState, useEffect } from 'react';

const useDynamicYear = (initialYear?: number) => {
  const [currentYear, setCurrentYear] = useState<number>(initialYear || new Date().getFullYear());

  useEffect(() => {
    const newYear = new Date().getFullYear();
    setCurrentYear(newYear);
  }, []);

  const generateYearOptions = (): number[] => {
    const startYear = currentYear - 5;
    const endYear = currentYear + 5;
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    return years;
  };

  return {
    currentYear,
    generateYearOptions,
    updateYear: (newYear: number) => setCurrentYear(newYear)
  };
};

export default useDynamicYear;