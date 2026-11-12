import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Hash } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { getLearners, addPendingSyncItem } from '@/utils/storage';
import { generateUniqueCohortAdmissionNumber, generateCohortAdmissionNumber } from '@/utils/admissionUtils';
import { Learner } from '@/types/learners';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { useLearners } from '@/context/LearnerContext';

interface AddLearnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLearnerAdded?: (newLearner: Learner) => void;
}

const GRADE_OPTIONS = [
  'PP1',
  'PP2',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Junior Secondary'
];

const STREAM_OPTIONS = [
  'Blue',
  'Red',
  'Green',
  'Yellow'
];

export default function AddLearnerModal({
  isOpen,
  onClose,
  onLearnerAdded,
}: AddLearnerModalProps) {
  const { addLearner: contextAddLearner } = useLearners();
  const [existingLearners, setExistingLearners] = useState<any[]>([]);
  const [randomCode, setRandomCode] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const data = getLearners();
      const learnersArr = Array.isArray(data) ? data : [];
      setExistingLearners(learnersArr);
      const res = generateUniqueCohortAdmissionNumber('Grade 6', learnersArr);
      setRandomCode(res.randomCode);
    }
  }, [isOpen]);

  const [formData, setFormData] = useState({
    fullName: '',
    admissionNo: '',
    grade: 'Grade 6',
    stream: 'Blue',
    gender: 'Male',
    dob: '',
    guardianName: '',
    guardianPhone: '+254',
    assessmentNo: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && randomCode) {
      const existing = getLearners();
      const res = generateUniqueCohortAdmissionNumber(formData.grade, existing, randomCode);
      setFormData(prev => ({
        ...prev,
        admissionNo: res.admissionNumber,
        guardianPhone: prev.guardianPhone && prev.guardianPhone !== '' ? prev.guardianPhone : '+254'
      }));
    }
  }, [isOpen, formData.grade, randomCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'grade') {
        const existing = getLearners();
        const res = generateUniqueCohortAdmissionNumber(value, existing, randomCode);
        updated.admissionNo = res.admissionNumber;
      }
      return updated;
    });
  };

  const handleRegenerateCode = () => {
    const existing = getLearners();
    const res = generateUniqueCohortAdmissionNumber(formData.grade, existing);
    setRandomCode(res.randomCode);
    setFormData(prev => ({ ...prev, admissionNo: res.admissionNumber }));
  };

  const handleSaveLearner = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullNameVal = (formData.fullName || '').trim();
    if (!fullNameVal) {
      showError("Please enter full name.");
      return;
    }

    const phoneVal = (formData.guardianPhone || '').trim();
    if (!phoneVal) {
      showError("Please enter guardian phone number.");
      return;
    }
    if (!phoneVal.startsWith('+254')) {
      showError("Phone number must start with +254.");
      return;
    }

    setIsSaving(true);
    try {
      const selectedGrade = formData.grade || 'Grade 6';
      const selectedStream = formData.stream || 'Blue';
      const admissionNumber = formData.admissionNo || generateCohortAdmissionNumber(selectedGrade, existingLearners);
      const genderVal = formData.gender || 'Male';
      const dobVal = formData.dob || '';
      const parentNameVal = (formData.guardianName || '').trim() || 'Parent / Guardian';
      const idVal = (formData.assessmentNo || '').trim() || '';

      const newLearner: Learner = {
        id: admissionNumber,
        admissionNo: admissionNumber,
        assessmentNo: idVal,
        fullName: fullNameVal,
        grade: selectedGrade,
        stream: selectedStream,
        gender: genderVal,
        dob: dobVal,
        guardianName: parentNameVal,
        guardianPhone: phoneVal,
        createdAt: new Date().toISOString()
      };

      await contextAddLearner(newLearner);

      const existingRaw = localStorage.getItem(STORAGE_KEYS.LEARNERS) || localStorage.getItem('munyaka_learners') || localStorage.getItem('munyaka_learners_directory') || '[]';
      const existingLearnersStore = JSON.parse(existingRaw);
      const newStoreList = Array.isArray(existingLearnersStore) ? [newLearner, ...existingLearnersStore] : [newLearner];

      localStorage.setItem(STORAGE_KEYS.LEARNERS, JSON.stringify(newStoreList));
      localStorage.setItem('munyaka_learners', JSON.stringify(newStoreList));
      localStorage.setItem('munyaka_learners_directory', JSON.stringify(newStoreList));
      localStorage.setItem('munyaka_students', JSON.stringify(newStoreList));
      localStorage.setItem('school_learners_data', JSON.stringify(newStoreList));

      window.dispatchEvent(new CustomEvent('learners-updated', { detail: newStoreList }));
      window.dispatchEvent(new CustomEvent('munyaka:learners-updated', { detail: newStoreList }));
      window.dispatchEvent(new Event('storage'));

      addPendingSyncItem({
        id: newLearner.id,
        type: 'learner',
        action: 'create',
        payload: newLearner,
      });

      showSuccess("Learner successfully registered and saved to directory!");
      if (onLearnerAdded) {
        onLearnerAdded(newLearner);
      }
      onClose();
    } catch (err: any) {
      console.error("[AddLearnerModal] Failed to register learner:", err);
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
      description="Enter learner details to register and save directly to the directory."
    >
      <form onSubmit={handleSaveLearner} className="space-y-4 pt-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Student Full Name *</Label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="e.g. Brian Kiprop"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admissionNo">Admission No. (Auto-generated)</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="admissionNo"
                name="admissionNo"
                placeholder="Auto-generated"
                value={formData.admissionNo}
                onChange={handleChange}
                className="pl-9 bg-slate-50 font-mono text-xs uppercase font-bold text-indigo-700"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleRegenerateCode}
              className="h-10 px-3 font-bold text-xs gap-1.5"
              title="Regenerate 4-character code"
            >
              <Sparkles size={14} />
              Regenerate
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Format: MUN-[4-Char]-[CohortYear]. Updates automatically when Grade changes.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assessmentNo">Assessment No. / Birth Certificate No. *</Label>
          <Input
            id="assessmentNo"
            name="assessmentNo"
            placeholder="e.g. B001234567"
            value={formData.assessmentNo}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="grade">Grade Level *</Label>
            <Select
              value={formData.grade}
              onValueChange={(val) => handleSelectChange('grade', val)}
            >
              <SelectTrigger id="grade">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_OPTIONS.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stream">Stream *</Label>
            <Select
              value={formData.stream}
              onValueChange={(val) => handleSelectChange('stream', val)}
            >
              <SelectTrigger id="stream">
                <SelectValue placeholder="Select Stream" />
              </SelectTrigger>
              <SelectContent>
                {STREAM_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select
              value={formData.gender}
              onValueChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth *</Label>
            <Input
              id="dob"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="guardianName">Parent / Guardian Name *</Label>
            <Input
              id="guardianName"
              name="guardianName"
              placeholder="e.g. Mary Kiprop"
              value={formData.guardianName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guardianPhone">Parent Phone (+254...) *</Label>
            <Input
              id="guardianPhone"
              name="guardianPhone"
              placeholder="+254712345678"
              value={formData.guardianPhone}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-2"
          >
            {isSaving && <Loader2 className="animate-spin" size={16} />}
            {isSaving ? 'Registering...' : 'Register Learner'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
