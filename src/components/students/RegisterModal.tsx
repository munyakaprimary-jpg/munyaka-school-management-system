import React from 'react';
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from 'lucide-react';
import { GRADES_DATA } from '@/lib/mock-data';
import { STUDENTS } from '@/lib/mock-data';

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
  // Dynamically get streams for the selected grade from GRADES_DATA
  const availableStreams = React.useMemo(() => {
    if (!regGrade) return [];
    const grade = GRADES_DATA.find(g => g.name === `Grade ${regGrade}` || g.name === regGrade);
    return grade ? grade.streams.map(s => s.name) : [];
  }, [regGrade]);

  // Reset stream when grade changes and no longer matches available streams
  React.useEffect(() => {
    if (regStream && availableStreams.length > 0 && !availableStreams.includes(regStream)) {
      setRegStream(availableStreams[0]);
    }
  }, [regGrade, availableStreams, regStream]);

  // Get unique streams for the filter dropdown
  const uniqueStreams = React.useMemo(() => {
    const streams = new Set<string>();
    GRADES_DATA.forEach(g => g.streams.forEach(s => streams.add(s.name)));
    STUDENTS.forEach(s => { if (s.stream) streams.add(s.stream); });
    return Array.from(streams).sort();
  }, []);

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
        {/* Error message display */}
        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        {/* Full Name — always required (this is the primary human-readable identifier) */}
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

        {/* Identifier row: Assessment No. + Birth Certificate No.
            Either one (or both) is sufficient to save the learner. */}
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

        {/* Help text below the identifier row explaining the conditional requirement */}
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
                setRegStream('');
              }}
            >
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {GRADES_DATA.map((g) => (
                  <SelectItem key={g.id} value={g.name.replace(/[^0-9]/g, '') || g.name}>
                    {g.name} ({g.category})
                  </SelectItem>
                ))}
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
                <SelectValue placeholder={!regGrade ? "Select grade first..." : availableStreams.length === 0 ? "No streams available" : "Choose stream..."} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {availableStreams.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
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