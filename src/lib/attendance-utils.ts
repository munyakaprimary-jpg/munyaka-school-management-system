export const isEarlyDeparture = (date: Date = new Date()): boolean => {
  const cutoff = new Date(date);
  cutoff.setHours(15, 30, 0, 0);
  return date < cutoff;
};

export const validateDeparture = (
  date: Date,
  reason?: string,
): { valid: boolean; message?: string } => {
  if (!isEarlyDeparture(date)) {
    return { valid: true };
  }
  if (!reason || String(reason || '').trim().length < 10) {
    return {
      valid: false,
      message: 'Early departure requires a reason of at least 10 characters.',
    };
  }
  return { valid: true };
};