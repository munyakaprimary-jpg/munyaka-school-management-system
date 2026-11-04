import React, { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { notifyDataChanged } from '@/hooks/useDashboardData';
import { generateCohortAdmissionNumber } from '../../utils/admissionUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  FileSignature,
  Hash,
  Loader2,
  School,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  readGradesAndStreams,
  getStreamsForGrade,
  GradesStreamsConfig,
} from '@/services/gradesStreamsConfig';
import { Learner } from '@/types/learners';
import { registerTransferredInLearner } from '@/lib/rosterService';
import { showSuccess, showError } from '@/utils/toast';

export interface TransferInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransferInComplete?: (learner: Learner) => void;
  actorName?: string;
}

interface FormState {
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  birthCertificateNo: string;
  admissionNumber: string;
  assessmentNo: string;
  nemisUpi: string;
  previousSchool: string;
  clearanceRef: string;
  reason: string;
  dateAdmitted: string;
  grade: string;
  stream: string;
}

const GENDER_OPTIONS: Array<FormState['gender']> = ['Male', 'Female', 'Other'];

const REASON_PRESETS = [
  'Parent / Guardian relocation',
  'Family transfer / new posting',
  'Better academic fit',
  'Medical / health-related',
  'Disciplinary transfer',
  'Other',
];

const generateUniqueAdmissionNo = (
  grade: string,
  existingLearners: Learner[],
  enrollmentYear: number
): string => {
  return generateCohortAdmissionNumber(grade, existingLearners);
};

const todayIso = (): string => new Date().toISOString().split('T')[0];

const TransferInModal: React.FC<TransferInModalProps> = ({
  isOpen,
  onClose,
  onTransferInComplete,
  actorName,
}) => {
  const [gradesConfig, setGradesConfig] = useState<GradesStreamsConfig>(() =>
    readGradesAndStreams(),
  );

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  const getExistingLearners = (): Learner[] => {
    try {
      const raw = localStorage.getItem('munyaka_learners') || localStorage.getItem('school_learners_data');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const currentYear = new Date().getFullYear();
  
  const buildInitialState = (): FormState => {
    const existingLearners = getExistingLearners();
    const defaultGrade = gradesConfig.grades[0] ?? 'Grade 1';
    return {
      fullName: '',
      gender: 'Male',
      dob: '',
      birthCertificateNo: '',
      admissionNumber: generateUniqueAdmissionNo(defaultGrade, existingLearners, currentYear),
      assessmentNo: '',
      nemisUpi: '',
      previousSchool: '',
      clearanceRef: '',
      reason: REASON_PRESETS[0],
      dateAdmitted: todayIso(),
      grade: defaultGrade,
      stream: '',
    };
  };

  const [form, setForm] = useState<FormState>(buildInitialState);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(buildInitialState());
      setFormError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  const availableStreams = useMemo((): string[] => {
    if (!form.grade) return [];
    return getStreamsForGrade(form.grade, gradesConfig);
  }, [form.grade, gradesConfig]);

  useEffect(() => {
    if (form.grade && availableStreams.length > 0) {
      if (!availableStreams.includes(form.stream)) {
        setForm((prev) => ({ ...prev, stream: availableStreams[0] }));
      }
    } else if (!form.grade) {
      setForm((prev) => ({ ...prev, stream: '' }));
    }
  }, [form.grade, availableStreams, form.stream]);

  useEffect(() => {
    const grade = form.grade || gradesConfig.grades[0] || 'Grade 1';
    const existingLearners = getExistingLearners() || [];
    const selectedYear = form.dateAdmitted
      ? new Date(form.dateAdmitted).getFullYear()
      : new Date().getFullYear();
    const newAdmNo = generateUniqueAdmissionNo(grade, existingLearners, selectedYear);
    setForm((prev) => ({ ...prev, admissionNumber: newAdmNo }));
  }, [form.grade]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegenerateAdmNo = () => {
    const existingLearners = getExistingLearners() || [];
    const selectedYear = form.dateAdmitted
      ? new Date(form.dateAdmitted).getFullYear()
      : new Date().getFullYear();
    
    const newAdmNo = generateUniqueAdmissionNo(
      form.grade || 'Grade 1',
      existingLearners,
      selectedYear
    );

    setForm((prev) => ({ ...prev, admissionNumber: newAdmNo }));
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const validate = (): string => {
    if (!String(form.fullName || '').trim()) return 'Please enter the learner\u2019s Full Name.';
    if (!form.gender) return 'Please select a Gender.';
    if (!form.dob) return 'Please provide the Date of Birth.';
    
    const hasAdmNo = String(form.admissionNumber || '').trim();
    if (!hasAdmNo) {
      return 'Please generate or enter an Admission Number.';
    }
    
    const hasBirthCert = String(form.birthCertificateNo || '').trim();
    const hasAssessment = String(form.assessmentNo || '').trim();
    if (!hasBirthCert && !hasAssessment) {
      return 'Please provide either a Birth Certificate Number or Assessment Number.';
    }
 
    if (!String(form.previousSchool || '').trim())
      return 'Please record the Previous School Name for audit purposes.';
    if (!String(form.clearanceRef || '').trim())
      return 'Please capture the Previous School Clearance / Transfer Reference Number.';
    if (!String(form.reason || '').trim()) return 'Please provide a Reason for Transfer.';
    if (!form.dateAdmitted) return 'Please select the Date Admitted.';
    if (!form.grade) return 'Please select a Grade Level.';
    if (!form.stream) return 'Please select a Stream.';
    return '';
  };

  const performInsert = (): Learner | null => {
    const existingRaw = localStorage.getItem('munyaka_learners') || localStorage.getItem('school_learners_data');
    let existing: Learner[] = [];
    try {
      existing = existingRaw ? (JSON.parse(existingRaw) as Learner[]) : [];
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }

    const admNo = String(form.admissionNumber || '').trim();
    const birthCertNo = String(form.birthCertificateNo || '').trim();
    const assessmentNo = String(form.assessmentNo || '').trim();
    
    if (existing.some((l) => (l.admNo || '').toLowerCase() === admNo.toLowerCase())) {
      showError(
        `Admission Number ${admNo} already exists. Please choose another.`,
      );
      return null;
    }

    const gradeVal = String(form.grade || 'Grade 1').trim();
    const streamVal = String(form.stream || 'BLUE').trim().toUpperCase();

    const learner: Learner = {
      id: `txfr-in-${Date.now().toString()}-${Math.floor(
        Math.random() * 1000,
      )}`,
      admissionNo: admNo,
      admNo,
      birthCertificateNo: birthCertNo || undefined,
      assessment: assessmentNo || undefined,
      fullName: String(form.fullName || '').trim(),
      name: String(form.fullName || '').trim(),
      grade: gradeVal,
      stream: streamVal,
      gender: form.gender,
      guardian: '',
      phone: '',
      location: 'Eldoret',
      status: 'Active',
      dob: form.dob,
      dateOfAdmission: form.dateAdmitted,
      nemisUpi: String(form.nemisUpi || '').trim() || admNo,
      previousSchool: String(form.previousSchool || '').trim(),
      previousSchoolClearanceRef: String(form.clearanceRef || '').trim(),
      transferReason: String(form.reason || '').trim(),
    };

    const updated = [learner, ...existing];
    try {
      localStorage.setItem('munyaka_learners', JSON.stringify(updated));
      localStorage.setItem('school_learners_data', JSON.stringify(updated));
      notifyDataChanged('munyaka_learners');
      notifyDataChanged('school_learners_data');
    } catch (err) {
      console.error('[TransferInModal] Failed to persist learner:', err);
      showError('Could not save the learner record. Please retry.');
      return null;
    }

    registerTransferredInLearner(
      {
        id: learner.id,
        admNo: learner.admNo,
        name: learner.name,
        grade: learner.grade,
        stream: learner.stream,
        gender: learner.gender,
      },
      {
        previousSchool: learner.previousSchool || '',
        clearanceRef: learner.previousSchoolClearanceRef || '',
        reason: learner.transferReason || '',
        dateAdmitted: learner.dateOfAdmission || todayIso(),
        actorName,
      },
    );

    return learner;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }

    setFormError('');
    setSubmitting(true);

    window.setTimeout(() => {
      try {
        const learner = performInsert();
        if (!learner) {
          setSubmitting(false);
          return;
        }

        showSuccess(
          `Learner ${learner.name} has been successfully transferred in and added to ${learner.grade} ${learner.stream} roster.`,
        );

        onTransferInComplete?.(learner);
        onClose();
      } catch (caught) {
        console.error('[TransferInModal] submit failed:', caught);
        showError('Something went wrong while saving. Please try again.');
        setSubmitting(false);
      }
    }, 350);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="max-w-2xl"
      title={
        <div className="flex items-center gap-3">
          <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
            <ArrowRightLeft size={18} />
          </span>
          <span>Transfer In Learner</span>
        </div>
      }
      description="Enroll an incoming learner into the selected Grade + Stream. Their record will be added to the class register, attendance, and marksheet rosters."
      footer={
        <>
          <Button
            variant="ghost"
            className="rounded-xl h-12 px-6 font-bold"
            onClick={handleClose}
            disabled={submitting}
            type="button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="transfer-in-form"
            disabled={submitting}
            className="rounded-xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black gap-2 shadow-lg shadow-indigo-100"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <UserPlus size={16} />
            )}
            {submitting ? 'Transferring in…' : 'Transfer In Learner'}
          </Button>
        </>
      }
    >
      <form
        id="transfer-in-form"
        onSubmit={handleSubmit}
        className="space-y-7 animate-in fade-in duration-200"
      >
        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <section className="space-y-4">
          <header className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600">
            <Users size={14} />
            <span>Learner Details</span>
          </header>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
              Full Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              placeholder="e.g. Achieng Otieno"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Gender <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={form.gender}
                onValueChange={(v) =>
                  update('gender', v as FormState['gender'])
                }
              >
                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Date of Birth <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="date"
                value={form.dob}
                max={todayIso()}
                onChange={(e) => update('dob', e.target.value)}
                className="rounded-xl h-12 bg-slate-50 border-none font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                NEMIS / UPI / Assessment No.
              </Label>
              <div className="relative">
                <Hash
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  value={form.nemisUpi}
                  onChange={(e) => update('nemisUpi', e.target.value)}
                  placeholder="Optional"
                  className="pl-9 rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Birth Certificate Number
              </Label>
              <Input
                value={form.birthCertificateNo}
                onChange={(e) =>
                  update('birthCertificateNo', e.target.value.toUpperCase())
                }
                placeholder="e.g. BC12345"
                className="rounded-xl h-12 bg-slate-50 border-none font-bold uppercase"
              />
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                Enter the official Birth Certificate number. Required for Parent Portal verification.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Assessment No. <span className="text-[9px] font-bold text-slate-400 normal-case tracking-normal">(KNEC / NEMIS)</span>
              </Label>
              <Input
                value={form.assessmentNo}
                onChange={(e) =>
                  update('assessmentNo', e.target.value.toUpperCase())
                }
                placeholder="Optional"
                className="rounded-xl h-12 bg-slate-50 border-none font-bold uppercase"
              />
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                KNEC or NEMIS assessment number (optional).
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
              Admission Number <span className="text-rose-500">*</span>
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  value={form.admissionNumber}
                  onChange={(e) =>
                    update('admissionNumber', e.target.value.toUpperCase())
                  }
                  placeholder="Auto-generated"
                  className="pl-9 uppercase rounded-xl h-12 bg-indigo-50 border border-indigo-200 font-bold text-indigo-700"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleRegenerateAdmNo}
                className="h-12 rounded-xl border-slate-200 bg-white hover:bg-slate-50 px-3 font-bold text-slate-600 gap-1.5"
                title="Generate a fresh admission number"
              >
                <Sparkles size={14} />
                Auto
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              Click Auto to generate a unique admission number in MUN-G[Grade]-[Seq]/[Year] format, or enter manually.
            </p>
          </div>
        </section>

        <section className="space-y-4 pt-2 border-t border-slate-100">
          <header className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-600 pt-4">
            <FileSignature size={14} />
            <span>Transfer Metadata</span>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Previous School Name <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <School
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  value={form.previousSchool}
                  onChange={(e) => update('previousSchool', e.target.value)}
                  placeholder="e.g. St. Mary's Academy, Nairobi"
                  className="pl-9 rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Clearance / Transfer Ref # <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={form.clearanceRef}
                onChange={(e) => update('clearanceRef', e.target.value)}
                placeholder="e.g. CLR/2024/0042"
                className="rounded-xl h-12 bg-slate-50 border-none font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Reason for Transfer <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={REASON_PRESETS.includes(form.reason) ? form.reason : '__custom__'}
                onValueChange={(v) => {
                  if (v === '__custom__') {
                    update('reason', '');
                  } else {
                    update('reason', v);
                  }
                }}
              >
                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                  <SelectValue placeholder="Pick a reason" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {REASON_PRESETS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom reason…</SelectItem>
                </SelectContent>
              </Select>
              {!REASON_PRESETS.includes(form.reason) && (
                <Textarea
                  value={form.reason}
                  onChange={(e) => update('reason', e.target.value)}
                  placeholder="Describe the reason for transfer…"
                  rows={2}
                  className="rounded-xl bg-slate-50 border-none mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Date Admitted <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Calendar
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  type="date"
                  value={form.dateAdmitted}
                  max={todayIso()}
                  onChange={(e) => update('dateAdmitted', e.target.value)}
                  className="pl-9 rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 pt-2 border-t border-slate-100">
          <header className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600 pt-4">
            <CheckCircle2 size={14} />
            <span>Placement Allocation</span>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Grade Level <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={form.grade || ''}
                onValueChange={(v) => {
                  setForm((prev) => ({
                    ...prev,
                    grade: v,
                    stream: '',
                  }));
                }}
              >
                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {gradesConfig.grades.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Stream <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={form.stream || ''}
                onValueChange={(v) => update('stream', v)}
                disabled={!form.grade || availableStreams.length === 0}
              >
                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue
                    placeholder={
                      !form.grade
                        ? 'Select grade first…'
                        : availableStreams.length === 0
                          ? 'No streams configured'
                          : 'Choose stream…'
                    }
                  />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {availableStreams.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.grade && form.stream && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold animate-in slide-in-from-top-2">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>
                On submit, the learner will be added to the{' '}
                <strong>
                  {form.grade} – {form.stream}
                </strong>{' '}
                class list, grade register, marksheet, and attendance roster.
              </span>
            </div>
          )}
        </section>
      </form>
    </Modal>
  );
};

export default TransferInModal;
