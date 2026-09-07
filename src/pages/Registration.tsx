import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X, AlertCircle } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { logActivity } from '@/services/activityLog';
import { notifyDataChanged } from '@/hooks/useDashboardData';

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
  });

  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ─── Required fields: full name and guardian ────────────────────
    if (!String(formData.fullName || '').trim() || !String(formData.guardian || '').trim()) {
          setFormError('Please enter the learner\'s Full Name and Parent / Guardian name.');
          return;
        }
    
        // ─── Identifier validation: at least one of Assessment No or ─────
        // Birth Certificate No must be supplied.
        const admNo = String(formData.admNo || '').trim();
        const bcNo = String(formData.birthCertificateNo || '').trim();

    if (!admNo && !bcNo) {
      setFormError('Please provide at least one identifier — either an Assessment Number or a Birth Certificate Number.');
      return;
    }

    // If Assessment Number is supplied, it must start with a letter.
    if (admNo) {
      const assessmentRegex = /^[A-Za-z].*/;
      if (!assessmentRegex.test(admNo)) {
        setFormError('Assessment Number must strictly begin with an alphabetic letter (e.g., A827361).');
        return;
      }
    }

    // Persist the new learner — include whichever identifier was supplied
    try {
      const saved = localStorage.getItem('school_learners_data');
      const learners: any[] = saved ? JSON.parse(saved) : [];
      learners.unshift({
        id: Date.now().toString(),
        admNo,
        birthCertificateNo: bcNo || undefined,
        name: String(formData.fullName || '').trim(),
                grade: formData.grade,
                stream: formData.stream,
                gender: formData.gender,
                guardian: String(formData.guardian || '').trim(),
                phone: String(formData.phone || '').trim(),
                address: String(formData.address || '').trim(),
      });
      localStorage.setItem('school_learners_data', JSON.stringify(learners));
      notifyDataChanged('school_learners_data');
      logActivity({
        type: 'student_registration',
        title: `New student registered: ${String(formData.fullName || '').trim()} (${formData.gender}, ${formData.grade})`,
      });
    } catch (err) {
      console.error('Failed to persist learner:', err);
    }

    toast({
      title: 'Success',
      description: 'Student has been registered successfully.',
    });
    navigate('/students');
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
            {/* Validation error message */}
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-center gap-2 animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Full Name — always required */}
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

            {/* Identifier row: Assessment No. + Birth Certificate No.
                Either one is sufficient. */}
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
            <Button
              type="button"
              variant="outline"
              className="rounded-xl gap-2 text-slate-600 border-slate-200"
              onClick={() => navigate('/students')}
            >
              <X size={16} /> Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              className="rounded-xl px-8 h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100"
            >
              Register Student
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default Registration;