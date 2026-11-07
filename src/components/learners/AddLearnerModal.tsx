import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { getLearners, saveLearners, addPendingSyncItem } from '@/utils/storage';
import { generateCohortAdmissionNumber } from '@/utils/admissionUtils';
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

  useEffect(() => {
    if (isOpen) {
      const data = getLearners();
      setExistingLearners(Array.isArray(data) ? data : []);
    }
  }, [isOpen]);

  const [formData, setFormData] = useState({
    fullName: '',
    admissionNo: '',
    grade: 'Grade 4',
    stream: 'Blue',
    guardian: '',
    phone: '+254',
    location: 'Eldoret',
    identifierType: 'assessment' as 'assessment' | 'birth_cert',
    identifierValue: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existingLearners = getLearners();
      const freshAdmNo = generateCohortAdmissionNumber(formData.grade, existingLearners);
      setFormData(prev => ({
        ...prev,
        admissionNo: freshAdmNo,
        phone: prev.phone && prev.phone !== '' ? prev.phone : '+254',
        location: prev.location || 'Eldoret'
      }));
    }
  }, [isOpen, formData.grade]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'grade') {
        const existingLearners = getLearners();
        updated.admissionNo = generateCohortAdmissionNumber(value, existingLearners);
      }
      return updated;
    });
  };

  const handleSaveLearner = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = (formData.fullName || '').trim();
    if (!fullName) {
      showError("Please enter full name.");
      return;
    }

    const phone = (formData.phone || '').trim();
    if (!phone.startsWith('+254')) {
      showError("Phone number must start with +254.");
      return;
    }

    setIsSaving(true);
    try {
      const selectedGrade = formData.grade;
      const selectedStream = formData.stream;
      const admissionNumber = formData.admissionNo || generateCohortAdmissionNumber(selectedGrade, existingLearners);
      const gender = (formData as any).gender || 'Not Specified';
      const dateOfBirth = (formData as any).dateOfBirth || '';
      const parentName = formData.guardian.trim() || '—';
      const phone = formData.phone.trim() || '+254';

      const idType = formData.identifierType || 'assessment';
      const identifierValue = formData.identifierValue.trim() || '';

      const newLearnerRecord = {
        id: admissionNumber || `MUN-${Date.now().toString().slice(-4)}`,
        admissionNo: admissionNumber,
        admissionNumber: admissionNumber,
        admNo: admissionNumber,
        idType: idType,
        idValue: identifierValue,
        assessmentNo: idType === 'assessment' ? identifierValue : '',
        assessmentNumber: idType === 'assessment' ? identifierValue : '',
        birthCertNo: idType === 'birth_cert' ? identifierValue : '',
        birthCertificateNo: idType === 'birth_cert' ? identifierValue : '',
        fullName: fullName,
        name: fullName,
        gradeLevel: selectedGrade,
        grade: selectedGrade,
        stream: selectedStream,
        gradeAndStream: `${selectedGrade} (${selectedStream})`,
        gender: gender,
        dob: dateOfBirth || '—',
        dateOfBirth: dateOfBirth || '—',
        parentGuardian: parentName || '—',
        parentName: parentName || '—',
        phoneNumber: phone || '—',
        phone: phone || '—',
        status: 'Active',
        academicYear: '2026',
        createdAt: new Date().toISOString()
      };

      await contextAddLearner(newLearnerRecord);

      const existingRaw = localStorage.getItem(STORAGE_KEYS.LEARNERS) || localStorage.getItem('munyaka_learners') || '[]';
      const existingLearnersStore = JSON.parse(existingRaw);
      const newStoreList = Array.isArray(existingLearnersStore) ? [newLearnerRecord, ...existingLearnersStore] : [newLearnerRecord];

      localStorage.setItem(STORAGE_KEYS.LEARNERS, JSON.stringify(newStoreList));
      localStorage.setItem('munyaka_learners', JSON.stringify(newStoreList));
      localStorage.setItem('munyaka_students', JSON.stringify(newStoreList));
      localStorage.setItem('school_learners_data', JSON.stringify(newStoreList));

      window.dispatchEvent(new CustomEvent('learners-updated', { detail: newStoreList }));
      window.dispatchEvent(new CustomEvent('munyaka:learners-updated', { detail: newStoreList }));
      window.dispatchEvent(new Event('storage'));

      addPendingSyncItem({
        id: newLearnerRecord.id,
        type: 'learner',
        action: 'create',
        payload: newLearnerRecord,
      });

      showSuccess("Learner successfully registered and saved to directory!");
      if (onLearnerAdded) {
        onLearnerAdded(newLearnerRecord);
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="admissionNo">Admission No.</Label>
            <Input
              id="admissionNo"
              name="admissionNo"
              placeholder="Auto-generated"
              value={formData.admissionNo}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">Grade *</Label>
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="identifierType">Identifier Type</Label>
            <Select
              value={formData.identifierType}
              onValueChange={(val: any) => handleSelectChange('identifierType', val)}
            >
              <SelectTrigger id="identifierType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assessment">Assessment Number / UPI</SelectItem>
                <SelectItem value="birth_cert">Birth Certificate No.</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="identifierValue">Identifier Number</Label>
            <Input
              id="identifierValue"
              name="identifierValue"
              placeholder={formData.identifierType === 'assessment' ? 'e.g. UPI123456' : 'e.g. BC987654'}
              value={formData.identifierValue}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="space-y-2">
            <Label htmlFor="guardian">Guardian Name *</Label>
            <Input
              id="guardian"
              name="guardian"
              placeholder="e.g. Mary Kiprop"
              value={formData.guardian}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (+254...) *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+254712345678"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g. Eldoret"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
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
            className="bg-gray-900 text-white hover:bg-gray-800"
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register Student
          </Button>
        </div>
      </form>
    </Modal>
  );
}
