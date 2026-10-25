"use client";

import React from 'react';
import { FileText, X, Download } from 'lucide-react';

export const InAppDocumentReader: React.FC<{ file: { name: string; data: string; size: string }; onClose: () => void }> = ({ file, onClose }) => {
  
  // Ensure safe rendering URI for in-app preview
  const getSafeDocumentSrc = () => {
    if (!file || !file.data) return '';
    // If it's already a data URI or blob URL, return it directly
    if (file.data.startsWith('data:') || file.data.startsWith('blob:') || file.data.startsWith('http')) {
      return file.data;
    }
    // Otherwise, wrap raw base64 data into a proper PDF data URI
    return `data:application/pdf;base64,${file.data}`;
  };

  const docSource = getSafeDocumentSrc();

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <FileText className="w-5 h-5 text-white"/>
            </div>
            <div>
              <h3 className="text-sm font-bold truncate max-w-md">{file?.name || 'Document Viewer'}</h3>
              <p className="text-xs text-indigo-300">In-App Reading Mode • {file?.size || 'Offline Document'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={docSource}
              download={file?.name || 'document.pdf'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              <Download className="w-4 h-4"/>
              Save Copy
            </a>
            <button 
              onClick={onClose} 
              className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              <X className="w-6 h-6"/>
            </button>
          </div>
        </div>

        {/* In-App Document Display Body */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 flex items-center justify-center overflow-hidden">
          {docSource ? (
            <iframe
              src={docSource}
              title={file?.name}
              className="w-full h-full bg-white rounded-xl border border-gray-300 dark:border-slate-800 shadow-inner"
            />
          ) : (
            <div className="text-center space-y-3 p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800">
              <FileText className="w-12 h-12 text-indigo-600 mx-auto"/>
              <h4 className="font-bold text-gray-900 dark:text-white">Document Data Stream Missing</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400">The attached file content could not be loaded into the in-app viewer.</p>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-between items-center text-xs text-gray-500 dark:text-slate-400">
          <span>Munyaka School Portal • Offline Document Reader</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
          >
            Close Reader
          </button>
        </div>
      </div>
    </div>
  );
};
