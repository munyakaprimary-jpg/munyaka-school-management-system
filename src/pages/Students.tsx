const termBadge = useMemo(() => {
    if (isLoading) return `Term ${activeTerm}, ${activeYear}`;
    return `${activeTerm}, ${activeYear}`;
  }, [activeTerm, activeYear, isLoading]);