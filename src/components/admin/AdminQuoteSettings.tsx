import React, { useState } from 'react';

const COLOR_PRESETS = [
  { id: 'indigo', name: 'Indigo', textClass: 'text-indigo-600 dark:text-indigo-400', bgClass: 'from-indigo-50 to-slate-50 dark:from-slate-800 dark:to-slate-800' },
  { id: 'emerald', name: 'Emerald', textClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'from-emerald-50 to-slate-50 dark:from-slate-800 dark:to-slate-800' },
  { id: 'amber', name: 'Amber', textClass: 'text-amber-600 dark:text-amber-400', bgClass: 'from-amber-50 to-slate-50 dark:from-slate-800 dark:to-slate-800' },
  { id: 'rose', name: 'Rose', textClass: 'text-rose-600 dark:text-rose-400', bgClass: 'from-rose-50 to-slate-50 dark:from-slate-800 dark:to-slate-800' },
];

export const AdminQuoteSettings = () => {
  // Load initial config from localStorage
  const getInitialConfig = () => {
    const raw = localStorage.getItem('munyaka_login_quote_config');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return {
              text: parsed.text || 'Great minds discuss ideas, average minds discuss events, and growing minds learn from everything.',
              colorId: parsed.colorId || 'indigo',
              isUppercase: !!parsed.isUppercase,
              isFlashing: !!parsed.isFlashing,
            };
      } catch (e) {}
    }
    return {
          text: localStorage.getItem('munyaka_login_quote') || 'Great minds discuss ideas, average minds discuss events, and growing minds learn from everything.',
          colorId: 'indigo',
          isUppercase: false,
          isFlashing: false,
        };
  };

  const initial = getInitialConfig();
    const [quoteText, setQuoteText] = useState(initial.text);
    const [selectedColor, setSelectedColor] = useState(initial.colorId);
    const [isUppercase, setIsUppercase] = useState(initial.isUppercase);
    const [isFlashing, setIsFlashing] = useState(initial.isFlashing ?? false);
    const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      const config = {
        text: quoteText,
        colorId: selectedColor,
        isUppercase,
        isFlashing,
      };
      localStorage.setItem('munyaka_login_quote_config', JSON.stringify(config));
    localStorage.setItem('munyaka_login_quote', quoteText); // Fallback string
    
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('munyaka_storage_update'));
    
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mt-6 space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Login Page Quote Manager</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Update the inspirational banner, text casing, and accent colors displayed on the login page.
            </p>
          </div>
    
          {/* Live Preview Section */}
          <div className="mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Live Preview (How it looks on Login Page)
            </span>
            
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center shadow-sm">
              <p
                className={`text-xs sm:text-sm font-bold tracking-wide leading-relaxed ${
                  selectedColor === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                  selectedColor === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                  selectedColor === 'rose' ? 'text-rose-600 dark:text-rose-400' :
                  'text-indigo-600 dark:text-indigo-400'
                }`}
                style={
                  isFlashing
                    ? { animation: 'quoteFlash 1.2s infinite ease-in-out' }
                    : {}
                }
              >
                "{isUppercase ? (quoteText || '').toUpperCase() : quoteText}"
              </p>
            </div>
          </div>
    
          {/* Keyframe definition for quote flashing animation */}
          <style>{`
            @keyframes quoteFlash {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.25; transform: scale(0.98); }
            }
          `}</style>
    
          <form onSubmit={handleSave} className="space-y-5">
        {/* Text Area */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
            Quote Content (Use **word** to highlight key terms)
          </label>
          <textarea
            value={quoteText}
            onChange={(e) => setQuoteText(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Style Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Color Theme Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Accent Highlight Color
            </label>
            <div className="flex items-center space-x-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedColor(preset.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    selectedColor === preset.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Text Transformation Toggle */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Text Case
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsUppercase(!isUppercase)}
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                      >
                        {isUppercase ? 'UPPERCASE' : 'Standard Case'}
                      </button>
                    </div>
          
                    {/* Flashing Animation Toggle */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Flashing Animation
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsFlashing(!isFlashing)}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          isFlashing
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 animate-pulse'
                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {isFlashing ? 'ON (Pulsing)' : 'OFF'}
                      </button>
                    </div>
                  </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-3">
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
          >
            Update Login Quote & Style
          </button>

          {savedNotice && (
            <span className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold animate-pulse">
              ✓ Quote & styles updated!
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
