export const syncUnifiedAuthRecord = async (record: any) => {
  try {
    const list = JSON.parse(localStorage.getItem('munyaka_user_accounts') || '[]');
    const index = list.findIndex((u: any) => u.email === record.email || u.id === record.id || u.staffId === record.staffId);
    if (index >= 0) {
      list[index] = { ...list[index], ...record };
    } else {
      list.push(record);
    }
    localStorage.setItem('munyaka_user_accounts', JSON.stringify(list));
  } catch (e) {
    console.error('syncUnifiedAuthRecord error', e);
  }
};

export const hydrateUnifiedAuthFromFirestore = async () => {
  try {
    return JSON.parse(localStorage.getItem('munyaka_user_accounts') || '[]');
  } catch (e) {
    return [];
  }
};
