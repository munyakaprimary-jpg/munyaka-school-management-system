import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { registerLearnerGuarded } from '@/services/learnerStorageGuard';

interface AddLearnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLearnerAdded?: (newLearner: any) => void;
  availableGrades?: string[];
  availableStreams?: string[];
}

export default function AddLearnerModal({
  isOpen,
  onClose,
  onLearnerAdded,
  availableGrades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'],
  availableStreams = ['BLUE', 'RED', 'GREEN', 'YELLOW']
}: AddLearnerModalProps) {
  const [fullName, setFullName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [assessmentNumber, setAssessmentNumber] = useState('');
  const [birthCertificateNo, setBirthCertificateNo] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 6');
  const [stream, setStream] = useState('BLUE');
  const [gender, setGender] = useState('Female');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [parentName, setParentName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleRegisterLearner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showError("Please enter full name.");
      return;
    }

    setIsSaving(true);
    try {
      const learnerId = `LRN-${Date.now()}`;
      const genAdm = admissionNumber.trim() || `MUN/${gradeLevel}/${Math.floor(1000 + Math.random() * 9000)}`;

      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0] || '';
      const middleName = parts.length > 2 ? parts.slice(1, -1).join(' ') : '';
      const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
      const constructedName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim() || fullName.trim() || 'New Learner';

      const newLearner = {
        id: learnerId,
        name: constructedName,
        fullName: constructedName,
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        admissionNumber: genAdm,
        admissionNo: genAdm,
        admNo: genAdm,
        assessmentNumber: assessmentNumber.trim(),
        assessmentNo: assessmentNumber.trim(),
        birthCertificateNo: birthCertificateNo.trim(),
        gradeLevel: gradeLevel,
        grade: gradeLevel,
        class: gradeLevel,
        stream: stream,
        gender: gender,
        dateOfBirth: dateOfBirth,
        parentName: parentName.trim(),
        guardian: parentName.trim(),
        phoneNumber: phoneNumber.trim(),
        phone: phoneNumber.trim(),
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // STRICT GUARD: Register exclusively via registerLearnerGuarded (munyaka_learners_v2 & Firestore)
      await registerLearnerGuarded(newLearner);

      showSuccess("Learner successfully registered and saved to central directory!");
      if (onLearnerAdded) {
        onLearnerAdded(newLearner);
      }
      onClose();
    } catch (err: any) {
      console.error("[AddLearner] Failed to register learner:", err);
      showError(err?.message || "Failed to save learner. Please check form fields.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Learner"
      description="Add a new learner directly to the central storage and Firestore directory."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
          <Button
            onClick={handleRegisterLearner}
            disabled={isSaving}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-lg shadow-indigo-100"
          >
            {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Save Learner
          </Button>
        </>
      }
    >
      <form onSubmit={handleRegisterLearner} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Full Name *</Label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. John Kamau"
            className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Assessment No (UPI)</Label>
            <Input
              value={assessmentNumber}
              onChange={(e) => setAssessmentNumber(e.target.value)}
              placeholder="e.g. CBC-1092"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Birth Certificate No</Label>
            <Input
              value={birthCertificateNo}
              onChange={(e) => setBirthCertificateNo(e.target.value)}
              placeholder="e.g. BC/2020/12345"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Grade Level</Label>
            <Select value={gradeLevel} onValueChange={setGradeLevel}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {availableGrades.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Stream</Label>
            <Select value={stream} onValueChange={setStream}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                <SelectValue placeholder="Select Stream" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {availableStreams.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Date of Birth</Label>
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Parent / Guardian Name</Label>
            <Input
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="e.g. Mary Kamau"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Phone Number</Label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 0712345678"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
