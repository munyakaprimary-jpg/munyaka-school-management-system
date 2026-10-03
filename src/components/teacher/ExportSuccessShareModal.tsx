import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Share2, Download, CheckCircle2, MessageSquare, Copy, ExternalLink, HardDrive } from 'lucide-react';
import { triggerQuickShare } from '@/utils/fileDownloader';

interface ExportSuccessShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  filename: string;
  data: string;
  mimeType: string;
  nativeUri?: string;
  title?: string;
  description?: string;
}

export const ExportSuccessShareModal: React.FC<ExportSuccessShareModalProps> = ({
  isOpen,
  onClose,
  filename,
  data,
  mimeType,
  nativeUri,
  title = 'File Successfully Generated & Downloaded',
  description = 'Beam this file instantly to the Admin Harmonization Hub, WhatsApp group, or save locally.'
}) => {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleQuickShare = async () => {
    setSharing(true);
    try {
      const shared = await triggerQuickShare(filename, data, mimeType, nativeUri);
      if (!shared) {
        // Fallback to copy summary text if native/web share is unavailable
        navigator.clipboard.writeText(`[MUNYAKA EXPORT READY: ${filename}]\nGenerated successfully at ${new Date().toLocaleString()}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } finally {
      setSharing(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(`[MUNYAKA EXPORT READY: ${filename}]\nGenerated successfully at ${new Date().toLocaleString()}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-6 py-4 text-center">
        {/* Success Icon Badge */}
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-bounce-subtle">
          <CheckCircle2 size={36} />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
            {description}
          </p>
        </div>

        {/* File Card info */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-left flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Download size={20} />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">File Generated</p>
            <p className="text-sm font-black text-slate-800 dark:text-slate-200 truncate">{filename}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={handleQuickShare}
            disabled={sharing}
            className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-3 transition-transform active:scale-95"
          >
            <Share2 size={20} />
            {sharing ? 'Opening Quick Share Sheet...' : 'Quick Share (WhatsApp / Bluetooth / Hub)'}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleCopyText}
              className="h-12 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2"
            >
              <Copy size={16} />
              {copied ? 'Copied Summary!' : 'Copy Summary'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="h-12 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300"
            >
              Done / Close
            </Button>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium pt-1">
          💡 Tip: Head teachers & Administrators can instantly ingest this file inside the <span className="font-bold text-indigo-600 dark:text-indigo-400">Admin Harmonization Hub</span>.
        </div>
      </div>
    </Modal>
  );
};
