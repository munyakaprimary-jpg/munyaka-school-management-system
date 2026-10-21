import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { logActivity } from '@/services/activityLog';
import { notifyDataChanged } from '@/hooks/useDashboardData';
import { RegistrationConfirmationSlip, RegistrationSlipData } from '@/components/students/RegistrationConfirmationSlip';
import { generateLearnerId, findExistingLearner } from '@/services/learnerService';

const Registration = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    admNo: '',
    birthCertificateNo: '',
    grade: '4',
    stream: 'Blue',
    gender: 'Female',
    guardian: '',
    phone: '',
    address: '',
    specialNeeds: 'None / Regular',
  });

  const [formError, setFormError] = useState('');
  const [createdSlipData, setCreatedSlipData] = useState<RegistrationSlipData | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!String(formData.fullName || '').trim() || !String(formData.guardian || '').trim()) {
      setFormError('Please enter the learner\'s Full Name and Parent / Guardian name.');
      return;
    }
    
    const admNo = String(formData.admNo || '').trim();
    const bcNo = String(formData.birthCertificateNo || '').trim();

    if (!admNo && !bcNo) {
      setFormError('Please provide at least one identifier — either an Assessment Number or a Birth Certificate Number.');
      return;
    }

    if (admNo) {
      const assessmentRegex = /^[A-Za-z].*/;
      if (!assessmentRegex.test(admNo)) {
        setFormError('Assessment Number must strictly begin with an alphabetic letter (e.g., A827361).');
        return;
      }
    }

    const generatedAdmNumber = `MUN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const generatedAssessmentNumber = admNo || `B${Math.floor(100000000 + Math.random() * 900000000)}`;

    try {
      const saved = localStorage.getItem('school_learners_data');
      const learners: any[] = saved ? JSON.parse(saved) : [];
      const newLearner = {
        id: generateLearnerId(),
        admNo: generatedAdmNumber,
        assessmentNo: generatedAssessmentNumber,
        birthCertificateNo: bcNo || undefined,
        name: String(formData.fullName || '').trim(),
        grade: formData.grade,
        stream: formData.stream,
        gender: formData.gender,
        guardian: String(formData.guardian || '').trim(),
        phone: String(formData.phone || '').trim(),
        address: String(formData.address || '').trim(),
      };

      // Deduplication check — prevent duplicate student profiles
      if (findExistingLearner(learners, newLearner)) {
        setFormError('A learner with this admission number already exists in the registry.');
        return;
      }

      learners.unshift(newLearner);
      localStorage.setItem('school_learners_data', JSON.stringify(learners));
      notifyDataChanged('school_learners_data');
      logActivity({
        type: 'student_registration',
        title: `New student registered: ${String(formData.fullName || '').trim()} (${formData.gender}, Grade ${formData.grade})`,
      });
    } catch (err) {
      console.error('Failed to persist learner:', err);
    }

    setCreatedSlipData({
      admissionNo: generatedAdmNumber,
      assessmentNo: generatedAssessmentNumber,
      fullName: String(formData.fullName || '').trim(),
      gender: formData.gender,
      dateOfBirth: '2015-05-14',
      nationality: 'Kenyan',
      birthCertificateNo: bcNo || 'BC-998822',
      specialNeeds: formData.specialNeeds,
      gradeLevel: `Grade ${formData.grade}`,
      assignedStream: formData.stream,
      registrationDate: new Date().toLocaleString(),
      registrationOfficer: 'School Registrar / Admin',
      schoolAddress: 'P.O. BOX 5239-30100 ELDORET',
      centreCode: '26534178',
    });

    toast({
      title: 'Success',
      description: 'Student has been registered successfully.',
    });
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-3">
        <BackButton to="/students" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Student Registration</h1>
          <p className="text-muted-foreground">Register new students for the current academic year.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-none shadow-sm rounded-2xl bg-white mb-6 overflow-hidden">
          <CardHeader className="p-6 border-b">
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-center gap-2 animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="full-name" className="text-xs font-semibold text-slate-600">
                Full Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="full-name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. John Doe"
                className="rounded-xl h-12 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assessment-no" className="text-xs font-semibold text-slate-600">
                  Assessment Number
                </Label>
                <Input
                  id="assessment-no"
                  value={formData.admNo}
                  onChange={(e) => setFormData({ ...formData, admNo: e.target.value.toUpperCase() })}
                  placeholder="e.g. A827361"
                  className="rounded-xl h-12 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bc-no" className="text-xs font-semibold text-slate-600">
                  Birth Certificate No.
                </Label>
                <Input
                  id="bc-no"
                  value={formData.birthCertificateNo}
                  onChange={(e) => setFormData({ ...formData, birthCertificateNo: e.target.value })}
                  placeholder="e.g. BC12345"
                  className="rounded-xl h-12 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 font-mono"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium -mt-2">
              Provide <strong className="text-slate-500">at least one</strong> of the two identifiers above.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grade Level</Label>
                <Select
                  value={formData.grade}
                  onValueChange={(val) => setFormData({ ...formData, grade: val })}
                >
                  <SelectTrigger className="rounded-xl h-12 bg-slate-50 border border-slate-200">
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PP1">PP1</SelectItem>
                    <SelectItem value="PP2">PP2</SelectItem>
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                      <SelectItem key={n} value={n.toString()}>Grade {n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stream</Label>
                <Select
                  value={formData.stream}
                  onValueChange={(val) => setFormData({ ...formData, stream: val })}
                >
                  <SelectTrigger className="rounded-xl h-12 bg-slate-50 border border-slate-200">
                    <SelectValue placeholder="Select Stream" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Blue">Blue</SelectItem>
                    <SelectItem value="Green">Green</SelectItem>
                    <SelectItem value="Yellow">Yellow</SelectItem>
                    <SelectItem value="Alpha">Alpha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-6 border-b">
            <CardTitle>Guardian Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guardian-name" className="text-xs font-semibold text-slate-600">
                  Guardian Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="guardian-name"
                  value={formData.guardian}
                  onChange={(e) => setFormData({ ...formData, guardian: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  className="rounded-xl h-12 bg-slate-50 border border-slate-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone-number" className="text-xs font-semibold text-slate-600">
                  Phone Number
                </Label>
                <Input
                  id="phone-number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +254 700 000 000"
                  className="rounded-xl h-12 bg-slate-50 border border-slate-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs font-semibold text-slate-600">
                Physical Address / Location
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Eldoret West"
                className="rounded-xl h-12 bg-slate-50 border border-slate-200"
              />
            </div>
          </CardContent>
          <div className="p-6 pt-0 flex justify-end gap-3">
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 h-12 rounded-xl shadow-md">
              Register Student & Generate Slip
            </Button>
          </div>
        </Card>
      </form>

      {createdSlipData && (
        <RegistrationConfirmationSlip
          data={createdSlipData}
          isOpen={true}
          onClose={() => navigate('/students')}
        />
      )}
    </div>
  );
};

export default Registration;
