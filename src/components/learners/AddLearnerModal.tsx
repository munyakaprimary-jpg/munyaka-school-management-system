import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { saveLearnerToStorage } from '@/utils/learnerStorageSync';
import { generateCohortAdmissionNumber } from '../../utils/admissionUtils';

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
  const [formData, setFormData] = useState({
    fullName: '',
    admNo: '',
    assessmentNo: '',
    grade: 'Grade 1',
    stream: 'BLUE',
    gender: 'Female',
    dob: '',
    parentName: '',
    phone: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (formData.grade) {
      const existingRaw = localStorage.getItem('munyaka_learners') || localStorage.getItem('munyaka_learners_v2') || '[]';
      const existingLearners = JSON.parse(existingRaw);
      const freshAdmNo = generateCohortAdmissionNumber(formData.grade, existingLearners);
      setFormData(prev => ({ ...prev, admNo: freshAdmNo }));
    }
  }, [formData.grade]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveLearner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      showError("Please enter full name.");
      return;
    }

    setIsSaving(true);
    try {
      const existingRaw = localStorage.getItem('munyaka_learners') || localStorage.getItem('munyaka_learners_v2') || '[]';
      const existingLearners = JSON.parse(existingRaw);
      
      const generatedAdmNo = formData.admNo || generateCohortAdmissionNumber(formData.grade, existingLearners);
      const identifierValue = formData.assessmentNo.trim().toUpperCase() || '—';

      const newLearnerRecord = {
        id: `learner_${Date.now()}`,
        admNo: generatedAdmNo,
        admissionNumber: generatedAdmNo,
        admissionNo: generatedAdmNo,
        assessmentNo: identifierValue,
        assessmentNumber: identifierValue,
        birthCertNo: identifierValue,
        birthCertificateNo: identifierValue,
        identifierNo: identifierValue,
        name: formData.fullName.trim(),
        fullName: formData.fullName.trim(),
        grade: formData.grade,
        gradeLevel: formData.grade,
        stream: formData.stream,
        gender: formData.gender,
        dob: formData.dob || '—',
        dateOfBirth: formData.dob || '—',
        parentName: formData.parentName || '—',
        phone: formData.phone || '—',
        phoneNumber: formData.phone || '—',
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      saveLearnerToStorage(newLearnerRecord);

      // Dispatch storage event so the directory table refreshes instantly
      window.dispatchEvent(new Event('storage'));
      
      showSuccess("Learner successfully registered and saved to directory!");
      if (onLearnerAdded) {
        onLearnerAdded(newLearnerRecord);
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
      description="Add a new learner directly to the central storage and directory."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
          <Button
            onClick={handleSaveLearner}
            disabled={isSaving}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-lg shadow-indigo-100"
          >
            {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Save Learner
          </Button>
        </>
      }
    >
      <form onSubmit={handleSaveLearner} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Full Name *</Label>
          <Input
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="e.g. John Kamau"
            className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Grade</Label>
            <Select
              value={formData.grade}
              onValueChange={(val) => setFormData(prev => ({ ...prev, grade: val }))}
            >
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl">
                {availableGrades.map((g) => (
                  <SelectItem key={g} value={g} className="font-bold">{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Stream</Label>
            <Select
              value={formData.stream}
              onValueChange={(val) => setFormData(prev => ({ ...prev, stream: val }))}
            >
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                <SelectValue placeholder="Select Stream" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl">
                {availableStreams.map((s) => (
                  <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Admission No (Auto)</Label>
            <Input
              value={formData.admNo}
              onChange={(e) => setFormData(prev => ({ ...prev, admNo: e.target.value }))}
              placeholder="Auto-generated on save"
              className="rounded-xl h-12 bg-slate-50 border-none font-mono font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Assessment No / UPI</Label>
            <Input
              value={formData.assessmentNo}
              onChange={(e) => setFormData(prev => ({ ...prev, assessmentNo: e.target.value }))}
              placeholder="Assessment / Birth Cert No"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
            >
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl">
                <SelectItem value="Female" className="font-bold">Female</SelectItem>
                <SelectItem value="Male" className="font-bold">Male</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Date of Birth</Label>
            <Input
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Parent / Guardian Name</Label>
            <Input
              value={formData.parentName}
              onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
              placeholder="e.g. Mary Kamau"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Phone Number</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="e.g. 0712345678"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
