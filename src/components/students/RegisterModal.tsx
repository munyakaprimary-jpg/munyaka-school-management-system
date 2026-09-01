import React, { useMemo, useState, useEffect } from 'react';
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from 'lucide-react';
import {
  readGradesAndStreams,
  getStreamsForGrade,
  GradesStreamsConfig,
} from '@/services/gradesStreamsConfig';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullName: string;
  setFullName: (value: string) => void;
  assessmentNo: string;
  setAssessmentNo: (value: string) => void;
  birthCertificateNo: string;
  setBirthCertificateNo: (value: string) => void;
  regGrade: string;
  setRegGrade: (value: string) => void;
  regStream: string;
  setRegStream: (value: string) => void;
  guardianName: string;
  setGuardianName: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  formError?: string;
  onRegister: () => void;
}

// Normalisation helpers
const normalizeGradeName = (name: string): string => {
  if (!name) return '';
  const t = name.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '';
};

export default function RegisterModal({
  isOpen,
  onClose,
  fullName,
  setFullName,
  assessmentNo,
  setAssessmentNo,
  birthCertificateNo,
  setBirthCertificateNo,
  regGrade,
  setRegGrade,
  regStream,
  setRegStream,
  guardianName,
  setGuardianName,
  phone,
  setPhone,
  formError = '',
  onRegister
}: RegisterModalProps) {
  // Live Grades & Streams configuration
  const [gradesConfig, setGradesConfig] = useState<GradesStreamsConfig>(() =>
    readGradesAndStreams()
  );

  useEffect(() => {
    const refresh = () => setGradesConfig(readGradesAndStreams());
    const handleCustom = () => refresh();
    const handleStorage = (e: StorageEvent) => {
      if (
        !e.key ||
        [
          'munyaka_grades',
          'munyaka_grades_streams',
          'munyaka_grades_streams_data',
          'gradeStreamSettings',
          'school_grades_streams_data',
        ].includes(e.key)
      ) {
        refresh();
      }
    };
    const handleFocus = () => refresh();
    window.addEventListener('munyaka_grades_updated', handleCustom);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('munyaka_grades_updated', handleCustom);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Streams for the currently selected grade
  const availableStreams = useMemo((): string[] => {
    if (!regGrade) return [];
    return getStreamsForGrade(regGrade, gradesConfig);
  }, [regGrade, gradesConfig]);

  // Reset stream when grade changes and selected stream is invalid
  useEffect(() => {
    if (regStream && availableStreams.length > 0 && !availableStreams.includes(regStream)) {
      setRegStream(availableStreams[0]);
    }
  }, [regGrade, availableStreams, regStream, setRegStream]);

  // Set default grade if none selected
  useEffect(() => {
    if (!regGrade && gradesConfig.grades.length > 0) {
      setRegGrade(gradesConfig.grades[0]);
    }
  }, [regGrade, gradesConfig.grades, setRegGrade]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Student"
      description="Enroll learner into the academic system. Provide at least one of Assessment Number or Birth Certificate Number."
      footer={
        <>
          <Button
            variant="ghost"
            className="rounded-xl h-12 px-6 font-bold"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="rounded-xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black gap-2 shadow-lg shadow-indigo-100"
            onClick={onRegister}
          >
            Register Student
          </Button>
        </>
      }
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
            Full Name <span className="text-rose-500">*</span>
          </Label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            className="rounded-xl h-12 bg-slate-50 border-none font-bold"
          />
        </div>

        {/* Identifier row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              Assessment No.
              <span className="text-[9px] font-bold text-slate-400 normal-case tracking-normal">
                (or Birth Cert.)
              </span>
            </Label>
            <Input
              value={assessmentNo}
              onChange={(e) => setAssessmentNo(e.target.value)}
              placeholder="A100200"
              className="uppercase rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              Birth Certificate No.
              <span className="text-[9px] font-bold text-slate-400 normal-case tracking-normal">
                (or Assessment)
              </span>
            </Label>
            <Input
              value={birthCertificateNo}
              onChange={(e) => setBirthCertificateNo(e.target.value)}
              placeholder="BC12345"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
        </div>

        <p className="text-[10px] text-slate-400 font-medium -mt-3 leading-relaxed">
          Provide <strong className="text-slate-500">at least one</strong> of the two identifiers above.
          Both are accepted if available.
        </p>

        {/* Grade + Stream row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
              Grade Level
            </Label>
            <Select
              value={regGrade}
              onValueChange={(val) => {
                setRegGrade(val);
                setRegStream(''); // Reset stream when grade changes
              }}
            >
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                <SelectValue placeholder={gradesConfig.grades.length === 0 ? "No grades configured" : "Select grade"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {gradesConfig.grades.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No grades configured — set them in Grades & Streams
                  </SelectItem>
                ) : (
                  gradesConfig.grades.map((gradeName) => (
                    <SelectItem key={gradeName} value={gradeName}>
                      {gradeName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
              Stream
            </Label>
            <Select
              value={regStream}
              onValueChange={setRegStream}
              disabled={!regGrade || availableStreams.length === 0}
            >
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                <SelectValue
                  placeholder={
                    !regGrade
                      ? "Select grade first..."
                      : availableStreams.length === 0
                      ? "No streams configured for this grade"
                      : "Choose stream..."
                  }
                />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {availableStreams.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
                {availableStreams.length === 0 && gradesConfig.grades.length > 0 && (
                  <SelectItem value="__hint__" disabled>
                    Configure streams for this grade in Grades & Streams
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Guardian + Phone row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
              Guardian Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              placeholder="Name"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
              Phone
            </Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}