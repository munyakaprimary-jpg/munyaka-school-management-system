import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { generateLearnerId, findExistingLearner } from '@/services/learnerService';
import { useLearners } from '@/context/LearnerContext';
import { db } from '@/config/firebase';
import { setDoc, doc } from 'firebase/firestore';

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
  const { addLearner } = useLearners();
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

  const handleSaveLearner = async (formData: any) => {
    const newId = formData.id || `learner-${Date.now()}`;
    const newLearner = {
      ...formData,
      id: newId,
      assessmentNo: formData.assessmentNo || formData.assessmentNumber || formData.assessment || '',
      admissionNo: formData.admissionNo || formData.admissionNumber || '',
      name: formData.name || formData.fullName || '',
      grade: formData.grade || formData.gradeLevel || 'Grade 1',
      stream: formData.stream || '',
      gender: formData.gender || 'Male',
      status: 'Active',
      createdAt: formData.createdAt || new Date().toISOString()
    };

    // 1. Update localStorage array first for instant offline access
    const currentList = JSON.parse(localStorage.getItem('cached_learners') || '[]');
    // Filter out duplicate id if any
    const filteredList = currentList.filter((l: any) => l.id !== newId);
    const updatedList = [newLearner, ...filteredList];
    localStorage.setItem('cached_learners', JSON.stringify(updatedList));

    // 2. Save directly to Firestore collection
    try {
      await setDoc(doc(db, "learners", newId), newLearner);
    } catch (err) {
      console.warn("[Firestore] Offline mode: saved learner locally:", err);
    }

    // 3. Dispatch update event to instantly refresh Directory state
    window.dispatchEvent(new Event('learners_updated'));
    window.dispatchEvent(new Event('learners-updated'));
    window.dispatchEvent(new Event('students-updated'));
  };

  const handleRegisterLearner = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent accidental page reload
    if (!fullName.trim()) {
      showError("Please enter full name.");
      return;
    }

    setIsSaving(true);
    try {
      const learnerId = `learner-${Date.now()}`;
      const genAdm = admissionNumber.trim() || `MUN-${Math.floor(100 + Math.random() * 900)}-2025`;

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

      // 1. Immediately update local storage array (Offline-first guarantee)
      const existingLearners = JSON.parse(localStorage.getItem('cached_learners') || '[]');
      const filteredList = existingLearners.filter((l: any) => l.id !== learnerId);
      const updatedList = [newLearner, ...filteredList];
      localStorage.setItem('cached_learners', JSON.stringify(updatedList));

      // 2. Write directly to Firestore
      try {
        await setDoc(doc(db, "learners", learnerId), newLearner);
      } catch (cloudErr) {
        console.warn("[Firestore] Offline mode: Saved learner locally", cloudErr);
      }

      // 3. Notify Context and Learners Directory
      if (typeof addLearner === 'function') {
        addLearner(newLearner);
      }

      // Dispatch event so LearnersDirectory updates instantly
      window.dispatchEvent(new Event('learners_updated'));
      window.dispatchEvent(new Event('learners-updated'));
      window.dispatchEvent(new Event('students-updated'));
      window.dispatchEvent(new Event('storage'));

      showSuccess("Learner successfully registered and saved to directory!");
      onClose();
    } catch (err) {
      console.error("[AddLearner] Failed to register learner:", err);
      showError("Failed to save learner. Please check form fields.");
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
          <Button type="button" variant="ghost" className="rounded-xl font-bold" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            form="register-learner-form"
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100"
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Register Learner
          </Button>
        </>
      }
    >
      <form id="register-learner-form" onSubmit={handleRegisterLearner} className="max-h-[75vh] overflow-y-auto px-6 py-4 pb-24 space-y-4 -mx-6 -my-4">
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
      </form>
    </Modal>
  );
}
