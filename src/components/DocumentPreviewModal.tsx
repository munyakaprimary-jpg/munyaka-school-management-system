"use client";

import React, { useState, useEffect } from 'react';
import { FileText, X, Download } from 'lucide-react';

export const DocumentPreviewModal: React.FC<{ file: any; onClose: () => void }> = ({ file, onClose }) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (!file) return;

    // If it's already a valid URL or data URI
    if (file.url && file.url.startsWith('blob:')) {
      setPreviewUrl(file.url);
      return;
    }

    if (file.data && file.data.startsWith('data:')) {
      setPreviewUrl(file.data);
      return;
    }

    // If stored as a File object or raw data bytes, read it via FileReader
    if (file.rawFile instanceof Blob || file instanceof Blob) {
      const blobUrl = URL.createObjectURL(file.rawFile || file);
      setPreviewUrl(blobUrl);
      return;
    }

    // Fallback: convert stored base64 or string data into a safe PDF data URI
    try {
      const base64Data = file.data || file.content || '';
      const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      
      if (cleanBase64) {
        const binaryString = window.atob(cleanBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    } catch (e) {
      console.error('Failed to parse document stream:', e);
    }
  }, [file]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <FileText className="w-5 h-5 text-white"/>
            </div>
            <div>
              <h3 className="text-sm font-bold truncate max-w-md">{file?.name || 'Document Preview'}</h3>
              <p className="text-xs text-indigo-300">In-App Preview Viewer • {file?.size || '219.0 KB'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {previewUrl && (
              <a
                href={previewUrl}
                download={file?.name || 'document.pdf'}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <Download className="w-4 h-4"/>
                Download
              </a>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl">
              <X className="w-6 h-6"/>
            </button>
          </div>
        </div>

        {/* PDF Viewer Iframe */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 flex items-center justify-center overflow-hidden">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              title={file?.name || 'Document'}
              className="w-full h-full bg-white rounded-xl border border-gray-300 dark:border-slate-800 shadow-inner"
            />
          ) : (
            <div className="text-center space-y-3 p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800">
              <FileText className="w-12 h-12 text-indigo-600 mx-auto animate-pulse"/>
              <h4 className="font-bold text-gray-900 dark:text-white">Loading Document Pages...</h4>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
