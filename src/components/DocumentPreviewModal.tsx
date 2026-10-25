"use client";

import React from 'react';
import { FileText, Download, X } from 'lucide-react';

export const DocumentPreviewModal: React.FC<{ file: any; onClose: () => void }> = ({ file, onClose }) => {
  // Create secure local object URL if file data exists
  const getFileUrl = () => {
    if (!file?.data && !file?.url) return '';
    if (file.url) return file.url;
    try {
      const byteCharacters = atob(file.data.split(',')[1] || file.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.type || 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (e) {
      return file.data; // fallback
    }
  };

  const fileUrl = getFileUrl();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-xl">
              <FileText className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-md">{file?.name || 'Document Preview'}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">Uploaded Document • {file?.size || '219.0 KB'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              download={file?.name || 'document.pdf'}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-sm"
            >
              <Download className="w-4 h-4"/>
              Download
            </a>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg">
              <X className="w-5 h-5"/>
            </button>
          </div>
        </div>

        {/* Preview Body with Robust Fallback */}
        <div className="flex-1 bg-gray-100 dark:bg-slate-950 p-6 flex items-center justify-center overflow-auto min-h-[400px]">
          {fileUrl ? (
            <iframe
              src={fileUrl}
              title={file?.name}
              className="w-full h-[60vh] bg-white rounded-xl border border-gray-200 dark:border-slate-800 shadow-inner"
            />
          ) : (
            <div className="text-center space-y-3 py-12 bg-white dark:bg-slate-900 rounded-2xl p-8 border border-gray-200 dark:border-slate-800 w-full max-w-md">
              <FileText className="w-12 h-12 text-indigo-600 mx-auto"/>
              <h4 className="font-bold text-gray-900 dark:text-white">Preview Unavailable in Browser</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                This document format requires download to view locally on your device.
              </p>
              <a
                href={fileUrl}
                download={file?.name || 'document.pdf'}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-indigo-700"
              >
                <Download className="w-4 h-4"/>
                Download Document Now
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 text-white font-bold text-xs rounded-xl hover:bg-gray-800"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
