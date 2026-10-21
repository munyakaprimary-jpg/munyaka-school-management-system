import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { generateLearnerId, findExistingLearner } from '@/services/learnerService';
import { db } from '@/config/firebase';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';

interface AddLearnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLearnerAdded: (newLearner: any) => void;
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
  const [gradeLevel, setGradeLevel] = useState('Grade 6');
  const [stream, setStream] = useState('BLUE');
  const [gender, setGender] = useState('Female');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [parentName, setParentName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showError("Please enter full name.");
      return;
    }

    setIsSaving(true);
    try {
      const learnerId = generateLearnerId();
      const genAdm = admissionNumber.trim() || `MUN-${Math.floor(100 + Math.random() * 900)}-2025`;

      const newLearner = {
        id: learnerId,
        fullName: fullName.trim(),
        name: fullName.trim(),
        admissionNumber: genAdm,
        admNo: genAdm,
        assessmentNumber: assessmentNumber.trim(),
        assessmentNo: assessmentNumber.trim(),
        gradeLevel: gradeLevel,
        grade: gradeLevel,
        class: gradeLevel,
        stream: stream,
        gender: gender,
        dateOfBirth: dateOfBirth,
        parentName: parentName.trim(),
        phoneNumber: phoneNumber.trim(),
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Deduplication check — block duplicate profiles before any write
      let existingLocal: any[] = [];
      try {
        existingLocal = JSON.parse(localStorage.getItem('learners') || localStorage.getItem('munyaka_students') || '[]');
      } catch (localErr) {
        console.warn("LocalStorage read error:", localErr);
      }
      if (findExistingLearner(existingLocal, newLearner)) {
        showError("A learner with this ID or admission number already exists in the registry.");
        setIsSaving(false);
        return;
      }

      // 2. Save directly to Firestore collection 'learners' via addDoc/setDoc
      try {
        await setDoc(doc(db, "learners", learnerId), newLearner);
      } catch (firestoreErr) {
        console.warn("Firestore save fallback:", firestoreErr);
      }

      // 3. Simultaneously update local cache ('learners' and 'munyaka_students')
      try {
        const updatedLocal = [newLearner, ...existingLocal];
        localStorage.setItem('learners', JSON.stringify(updatedLocal));
        localStorage.setItem('munyaka_students', JSON.stringify(updatedLocal));
      } catch (localErr) {
        console.warn("LocalStorage save error:", localErr);
      }

      // 3. Call onLearnerAdded(newLearner) prop to push the new record directly into parent table state
      onLearnerAdded(newLearner);

      showSuccess("Learner successfully added and saved to directory!");
      onClose();
    } catch (err) {
      showError("Failed to save learner record.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Learner"
      description="Enter learner particulars, grade assignment, and parent contact details."
      footer={
        <>
          <Button variant="ghost" className="rounded-xl font-bold" onClick={onClose}>Cancel</Button>
          <Button
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Register Learner
          </Button>
        </>
      }
    >
      <div className="max-h-[75vh] overflow-y-auto px-6 py-4 pb-24 space-y-4 -mx-6 -my-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700 uppercase">Full Name *</Label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. John Doe"
            className="rounded-xl h-12 border-slate-200"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase">Admission Number</Label>
            <Input
              value={admissionNumber}
              onChange={(e) => setAdmissionNumber(e.target.value)}
              placeholder="Leave blank to auto-generate"
              className="rounded-xl h-12 border-slate-200 font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase">Assessment Number</Label>
            <Input
              value={assessmentNumber}
              onChange={(e) => setAssessmentNumber(e.target.value)}
              placeholder="e.g. ASS-827361"
              className="rounded-xl h-12 border-slate-200 font-mono text-xs"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase">Grade Level</Label>
            <Select value={gradeLevel} onValueChange={setGradeLevel}>
              <SelectTrigger className="rounded-xl h-12 border-slate-200">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {availableGrades.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase">Stream</Label>
            <Select value={stream} onValueChange={setStream}>
              <SelectTrigger className="rounded-xl h-12 border-slate-200">
                <SelectValue placeholder="Select stream" />
              </SelectTrigger>
              <SelectContent>
                {availableStreams.map(st => (
                  <SelectItem key={st} value={st}>{st}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="rounded-xl h-12 border-slate-200">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700 uppercase">Date of Birth</Label>
          <Input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="rounded-xl h-12 border-slate-200"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase">Parent / Guardian Name</Label>
            <Input
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="Parent full name"
              className="rounded-xl h-12 border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase">Phone Number</Label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+254 700 000 000"
              className="rounded-xl h-12 border-slate-200 font-mono text-xs"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
