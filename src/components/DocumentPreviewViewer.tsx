import React, { useState, useEffect } from 'react';
import { 
  X, Download, FileText, ExternalLink, Maximize2, Minimize2 
} from 'lucide-react';
import mammoth from 'mammoth';

export interface AttachmentPreviewData {
  name?: string;
  filename?: string;
  url?: string;
  data?: string;
  type?: string;
  size?: number;
}

interface DocumentPreviewViewerProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: AttachmentPreviewData | null;
}

export const DocumentPreviewViewer: React.FC<DocumentPreviewViewerProps> = ({
  isOpen,
  onClose,
  attachment,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDocxHtml(null);
      setTextContent(null);
      setIsFullscreen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !attachment) return;

    const sourceUrl = attachment.url || attachment.data;
    if (!sourceUrl) return;

    const fileName = (attachment.name || attachment.filename || 'document').toLowerCase();

    if (fileName.endsWith('.docx') || fileName.includes('word') || attachment.type?.includes('wordprocessingml')) {
      (async () => {
        try {
          let arrayBuffer: ArrayBuffer;
          if (sourceUrl.startsWith('data:')) {
            const base64Part = sourceUrl.split(',')[1] || '';
            const binaryString = atob(base64Part);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            arrayBuffer = bytes.buffer;
          } else {
            const response = await fetch(sourceUrl);
            arrayBuffer = await response.arrayBuffer();
          }
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setDocxHtml(result.value || '<p>No content extracted.</p>');
        } catch (e) {
          console.error('Docx parse error:', e);
        }
      })();
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.json') || fileName.endsWith('.csv')) {
      (async () => {
        try {
          const response = await fetch(sourceUrl);
          const text = await response.text();
          setTextContent(text);
        } catch (e) {
          console.error('Text parse error:', e);
        }
      })();
    }
  }, [isOpen, attachment]);

  if (!isOpen || !attachment) return null;

  const sourceUrl = attachment.url || attachment.data || '';
  const fileName = attachment.name || attachment.filename || 'Document';
  const fileExt = fileName.split('.').pop()?.toUpperCase() || 'FILE';

  const handleDownload = () => {
    if (!sourceUrl) return;
    const link = document.createElement('a');
    link.href = sourceUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName) || attachment.type?.includes('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden w-full ${isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-xl max-h-[90vh]'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs">
              {fileExt}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{fileName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {attachment.size ? `${Math.round(attachment.size / 1024)} KB · ` : ''}Secure Document Viewer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Preview"
              className="p-2 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-6 sm:p-8 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/50">
          {isImage ? (
            <div className="max-w-full max-h-[60vh] flex items-center justify-center p-2">
              <img
                src={sourceUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 bg-white"
              />
            </div>
          ) : docxHtml ? (
            <div className="w-full max-h-[60vh] overflow-auto bg-white dark:bg-slate-900 rounded-2xl shadow-inner border border-slate-200 dark:border-slate-800 p-6 text-slate-800 dark:text-slate-200">
              <div dangerouslySetInnerHTML={{ __html: docxHtml }} />
            </div>
          ) : textContent ? (
            <div className="w-full max-h-[60vh] overflow-auto bg-slate-900 text-emerald-400 font-mono rounded-2xl shadow-inner border border-slate-800 p-6 text-xs leading-relaxed">
              <pre className="whitespace-pre-wrap">{textContent}</pre>
            </div>
          ) : (
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center flex flex-col items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-md">
                <FileText size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg break-all">{fileName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tap below to open this file in your device viewer or download it directly to your storage.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full pt-2">
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} /> Open File
                </a>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Download
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Universal File Reader
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
