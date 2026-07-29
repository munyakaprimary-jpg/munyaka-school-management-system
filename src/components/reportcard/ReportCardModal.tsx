"use client";

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2 } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import ReportCardPreview from './ReportCardPreview';

interface ReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  learner: any;
}

const ReportCardModal: React.FC<ReportCardModalProps> = ({
  isOpen,
  onClose,
  learner,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      showSuccess('Print dialog opened!');
    }, 500);
  };

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      showSuccess('PDF download initiated!');
    }, 800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Card Preview"
      description="Review details before printing or downloading"
      maxWidth="max-w-4xl"
    >
      <ReportCardPreview
        student={learner}
        gradeName={learner.grade?.name || 'Unknown'}
        streamName={learner.stream?.name || 'Unknown'}
        term="Term 1"
        academicYear="2023-2024"
        subjects={[
          { name: 'Mathematics', score: '85%', lvl: 'EE' },
          { name: 'English', score: '78%', lvl: 'ME' },
          { name: 'Science', score: '90%', lvl: 'EE' },
          { name: 'Social Studies', score: '78%', lvl: 'ME' },
        ]}
        attendance={{ present: 118, absent: 2 }}
        teacherName={learner.name}
        principalName="Dr. Ahmed"
      />
      <div className="flex justify-end pt-6">
        <Button 
          variant="ghost" 
          className="rounded-xl h-11 px-6 text-sm font-medium" 
          onClick={onClose}
        >
          Close
        </Button>
        <Button 
          onClick={handlePrint}
          disabled={isPrinting}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-8 shadow-lg shadow-indigo-100 gap-2"
        >
          {isPrinting ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              Printing...
            </>
          ) : (
            <>
              <Printer size={16} className="mr-2" />
              Print Report Card
            </>
          )}
        </Button>
        <Button 
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-bold h-11 px-8 shadow-lg shadow-slate-100 gap-2"
        >
          {isDownloading ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              Downloading...
            </>
          ) : (
            <>
              <Download size={16} className="mr-2" />
              Download PDF
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};

export default ReportCardModal;