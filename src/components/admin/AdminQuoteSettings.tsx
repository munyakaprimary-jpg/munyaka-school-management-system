import React, { useState } from 'react';

export const AdminQuoteSettings = () => {
  const [currentQuote, setCurrentQuote] = useState(
    localStorage.getItem('munyaka_login_quote') || 
    'STRONG MINDS DISCUSS IDEAS, AVERAGE MINDS DISCUSS EVENTS, AND WEAK MINDS DISCUSS PEOPLE.'
  );
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('munyaka_login_quote', currentQuote);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('munyaka_storage_update'));
    
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mt-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Login Page Quote Manager</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Update the inspirational banner displayed on the portal login page weekly or monthly.
      </p>
      
      <form onSubmit={handleSaveQuote} className="space-y-4">
        <textarea
          value={currentQuote}
          onChange={(e) => setCurrentQuote(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          placeholder="Enter weekly/monthly quote..."
        />
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
          >
            Update Login Quote
          </button>
          
          {savedMessage && (
            <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-pulse">
              ✓ Quote updated successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
