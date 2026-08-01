"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Modal from '@/components/ui/Modal';
import { 
  Image as ImageIcon, 
  FileText, 
  Music, 
  Video, 
  Download, 
  Maximize2 
} from 'lucide-react';
import { Artifact, getGradeBadgeClass } from '@/types/portfolio';

interface ArtifactViewerModalProps {
  artifact: Artifact | null;
  onClose: () => void;
}

export const ArtifactViewerModal: React.FC<ArtifactViewerModalProps> = ({
  artifact,
  onClose
}) => {
  if (!artifact) return null;

  const openDocumentInNewTab = (url?: string) => {
    if (!url) return;
    try {
      if (url.startsWith('data:')) {
        const arr = url.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } else {
        window.open(url, '_blank');
      }
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  const downloadDocument = (url?: string, filename?: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    if (filename) link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeIcon = (type: Artifact['type']) => {
    switch (type) {
      case 'Image': return <ImageIcon size={32} className="text-indigo-500" />;
      case 'Audio': return <Music size={32} className="text-purple-500" />;
      case 'Video': return <Video size={32} className="text-rose-500" />;
      default: return <FileText size={32} className="text-emerald-500" />;
    }
  };

  return (
    <Modal
      isOpen={!!artifact}
      onClose={onClose}
      title={artifact.title || "Artifact Evidence"}
      description={`Learner: ${artifact.student}`}
      maxWidth="max-w-3xl"
      footer={
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 w-full">
          {artifact.fileUrl ? (
            <div className="flex gap-2">
              <Button 
                onClick={() => openDocumentInNewTab(artifact.fileUrl)}
                className="rounded-xl font-bold gap-2 text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              >
                <Maximize2 size={16} /> Open Document in New Window
              </Button>
              <Button 
                variant="outline" 
                onClick={() => downloadDocument(artifact.fileUrl, artifact.fileName || artifact.title)}
                className="rounded-xl font-bold gap-2 text-indigo-600 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100"
              >
                <Download size={16} /> Download
              </Button>
            </div>
          ) : <div />}
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="min-h-[260px] bg-slate-900 rounded-2xl flex flex-col items-center justify-center border border-slate-800 overflow-hidden relative p-1">
          {artifact.fileUrl && artifact.type === 'Image' ? (
            <img 
              src={artifact.fileUrl} 
              alt={artifact.title} 
              className="w-full h-auto max-h-[400px] object-contain rounded-lg" 
            />
          ) : artifact.fileUrl && artifact.type === 'Video' ? (
            <video 
              src={artifact.fileUrl} 
              controls 
              autoPlay 
              className="w-full h-auto max-h-[400px] rounded-lg" 
            />
          ) : artifact.fileUrl && artifact.type === 'Audio' ? (
            <div className="p-8 w-full flex flex-col items-center gap-4 text-white">
              <div className="w-16 h-16 rounded-full bg-indigo-600/30 flex items-center justify-center">
                <Music size={36} className="text-indigo-400 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-slate-300">{artifact.fileName || artifact.title}</p>
              <audio controls src={artifact.fileUrl} className="w-full max-w-md h-12" />
            </div>
          ) : artifact.fileUrl && artifact.type === 'Document' ? (
            <div className="w-full h-[420px] flex flex-col items-center bg-slate-950 rounded-xl overflow-hidden relative">
              <iframe 
                src={artifact.fileUrl} 
                title={artifact.title}
                className="w-full h-full border-0 rounded-xl bg-white"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-8 text-center text-slate-400">
              {getTypeIcon(artifact.type)}
              <p className="text-sm font-bold text-slate-300 mt-2">{artifact.fileName || artifact.title}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Learning Area</p>
            <p className="text-sm font-bold text-slate-900">{artifact.learningArea}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rating</p>
            <Badge className={getGradeBadgeClass(artifact.grade)}>{artifact.grade}</Badge>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date Added</p>
            <p className="text-xs font-bold text-slate-700">{artifact.date}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Format / Type</p>
            <p className="text-xs font-bold text-slate-700">{artifact.type}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">Teacher Remarks</p>
          <p className="text-sm text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 italic">
            "{artifact.description}"
          </p>
        </div>
      </div>
    </Modal>
  );
};