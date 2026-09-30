import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ZoomIn, ZoomOut, RotateCcw, Download, FileText, 
  FileCheck, AlertCircle, Loader2, Maximize2, Minimize2, ExternalLink
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
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setZoomLevel(100);
      setIsLoading(true);
      setErrorMsg(null);
      setDocxHtml(null);
      setTextContent(null);
      setIsFullscreen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !attachment) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);
    setDocxHtml(null);
    setTextContent(null);

    const processAttachment = async () => {
      try {
        const sourceUrl = attachment.url || attachment.data;
        if (!sourceUrl) {
          throw new Error('No valid document URL or data provided.');
        }

        const fileName = (attachment.name || attachment.filename || 'document').toLowerCase();

        // Check if docx
        if (fileName.endsWith('.docx') || fileName.includes('word') || attachment.type?.includes('wordprocessingml')) {
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

          try {
            const result = await mammoth.convertToHtml({ arrayBuffer });
            if (isMounted) {
              setDocxHtml(result.value || '<p>No content extracted from Word document.</p>');
              setIsLoading(false);
            }
          } catch (mammothErr: any) {
            console.warn('[DocumentPreviewViewer] Mammoth failed, fallback to raw text:', mammothErr);
            if (isMounted) {
              setDocxHtml(`<div class="p-4 bg-amber-50 text-amber-800 rounded mb-4">Note: Could not parse complex Word structures directly. Showing extracted text/error.</div><pre class="whitespace-pre-wrap font-mono text-xs">${String(mammothErr?.message || mammothErr)}</pre>`);
              setIsLoading(false);
            }
          }
          return;
        }

        // Check if txt or md or json or csv
        if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.json') || fileName.endsWith('.csv') || attachment.type?.includes('text/')) {
          const response = await fetch(sourceUrl);
          const text = await response.text();
          if (isMounted) {
            setTextContent(text);
            setIsLoading(false);
          }
          return;
        }

        // For pdf, images, etc.
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('[DocumentPreviewViewer] Error processing file:', err);
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to load document preview.');
          setIsLoading(false);
        }
      }
    };

    processAttachment();

    return () => {
      isMounted = false;
    };
  }, [isOpen, attachment]);

  if (!isOpen || !attachment) return null;

  const fileName = attachment.name || attachment.filename || 'Document Preview';
  const sourceUrl = attachment.url || attachment.data || '';
  const lowerName = fileName.toLowerCase();

  const isPdf = lowerName.endsWith('.pdf') || attachment.type === 'application/pdf';
  const isImage = /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(lowerName) || attachment.type?.startsWith('image/');
  const isDocx = lowerName.endsWith('.docx') || attachment.type?.includes('wordprocessingml');
  const isText = lowerName.endsWith('.txt') || lowerName.endsWith('.md') || lowerName.endsWith('.json') || lowerName.endsWith('.csv') || attachment.type?.includes('text/');

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));
  const handleZoomReset = () => setZoomLevel(100);

  const handleDownload = () => {
    if (!sourceUrl) return;
    const a = document.createElement('a');
    a.href = sourceUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div 
        ref={containerRef}
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 w-full ${
          isFullscreen ? 'h-full max-h-none max-w-none rounded-none' : 'max-w-5xl h-[90vh]'
        }`}
      >
        {/* Header Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shrink-0">
              <FileText size={20} />
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm sm:text-base">
                {fileName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {isPdf ? 'PDF Document' : isImage ? 'Image File' : isDocx ? 'Word Document' : isText ? 'Text / Code File' : 'Document Preview'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isText && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-mono font-medium px-1.5 text-slate-600 dark:text-slate-300 min-w-[3rem] text-center">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In"
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleZoomReset}
                  title="Reset Zoom"
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownload}
              title="Download File"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-semibold text-xs transition-colors"
            >
              <Download size={16} />
              <span className="hidden md:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close Preview"
              className="p-2 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition-colors ml-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div className="flex-1 relative overflow-auto bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-2 sm:p-6">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm gap-3">
              <Loader2 size={36} className="animate-spin text-indigo-600 dark:text-indigo-400" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading document securely...</p>
            </div>
          )}

          {errorMsg && (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-red-100 dark:border-red-950">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
                <AlertCircle size={24} />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Preview Unavailable</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{errorMsg}</p>
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2"
              >
                <Download size={16} />
                Download File Instead
              </button>
            </div>
          )}

          {!errorMsg && isPdf && (
            <div className="w-full h-full flex flex-col items-center justify-center overflow-auto p-2">
              <iframe
                src={`${sourceUrl}#toolbar=1&view=FitH`}
                title={fileName}
                className="w-full h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white shadow-inner min-h-[500px]"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}
              />
              <div className="mt-3 flex items-center gap-3">
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"
                >
                  <ExternalLink size={14} /> Open in New Tab
                </a>
              </div>
            </div>
          )}

          {!errorMsg && isImage && (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
              <img
                src={sourceUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 bg-white"
                style={{ transform: `scale(${zoomLevel / 100})`, transition: 'transform 0.2s ease' }}
              />
            </div>
          )}

          {!errorMsg && isDocx && (
            <div className="w-full h-full overflow-auto bg-white dark:bg-slate-900 rounded-xl shadow-inner border border-slate-200 dark:border-slate-800 p-6 sm:p-12 flex items-center justify-center">
              <div
                className="prose dark:prose-invert max-w-4xl w-full text-slate-800 dark:text-slate-200 origin-top transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel / 100})` }}
                dangerouslySetInnerHTML={{ __html: docxHtml || '<p>Loading Word document content...</p>' }}
              />
            </div>
          )}

          {!errorMsg && isText && (
            <div className="w-full h-full overflow-auto bg-slate-900 text-emerald-400 font-mono rounded-xl shadow-inner border border-slate-800 p-4 sm:p-8 max-w-4xl mx-auto">
              <pre className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                {textContent || 'Loading text file...'}
              </pre>
            </div>
          )}

          {!errorMsg && !isPdf && !isImage && !isDocx && !isText && (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <FileCheck size={24} />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">File Ready</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                This file format ({fileName.split('.').pop()?.toUpperCase() || 'FILE'}) can be downloaded and opened with your device's native app.
              </p>
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2"
              >
                <Download size={16} />
                Download File
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Offline Universal Document Viewer Active
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
