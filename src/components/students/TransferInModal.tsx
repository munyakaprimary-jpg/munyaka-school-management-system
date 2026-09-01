import React, { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  IdCard,
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
  /** Invoked after the learner has been inserted into the roster. */
  onTransferInComplete?: (learner: Learner) => void;
  /** Current admin user — recorded against the academic-history log. */
  actorName?: string;
}

interface FormState {
  // ── Learner details ────────────────────────────────────────────────
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  admissionNumber: string;
  nemisUpi: string;

  // ── Transfer metadata ─────────────────────────────────────────────
  previousSchool: string;
  clearanceRef: string;
  reason: string;
  dateAdmitted: string;

  // ── Placement ─────────────────────────────────────────────────────
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

/**
 * Auto-generate a fresh Admission Number using the school's A-prefix
 * format. Six random digits keep collision risk negligible for the
 * sizes we expect while remaining easy to read aloud.
 */
const generateAdmissionNumber = (): string =>
  `A${Math.floor(100000 + Math.random() * 900000)}`;

const todayIso = (): string => new Date().toISOString().split('T')[0];

/**
 * Modal that walks the admin through registering an incoming
 * transfer learner. The submit handler:
 *
 *   1. Validates every required field.
 *   2. Creates an `ACTIVE` learner row in `school_learners_data`.
 *   3. Inserts the learner into every per-(grade, stream) roster.
 *   4. Logs a `TRANSFERRED_IN` entry to the academic-history audit log.
 *   5. Surfaces a success notification and lets the parent route the
 *      user to the updated class list / learner profile.
 */
const TransferInModal: React.FC<TransferInModalProps> = ({
  isOpen,
  onClose,
  onTransferInComplete,
  actorName,
}) => {
  /* ── live grades & streams config ──────────────────────────────── */
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

  /* ── form state ─────────────────────────────────────────────────── */
  const buildInitialState = (): FormState => ({
    fullName: '',
    gender: 'Male',
    dob: '',
    admissionNumber: generateAdmissionNumber(),
    nemisUpi: '',
    previousSchool: '',
    clearanceRef: '',
    reason: REASON_PRESETS[0],
    dateAdmitted: todayIso(),
    grade: gradesConfig.grades[0] ?? '',
    stream: '',
  });

  const [form, setForm] = useState<FormState>(buildInitialState);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* Reset every time the modal re-opens so the next transfer starts clean. */
  useEffect(() => {
    if (isOpen) {
      setForm(buildInitialState());
      setFormError('');
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* The streams available for the currently selected grade. */
  const availableStreams = useMemo((): string[] => {
    if (!form.grade) return [];
    return getStreamsForGrade(form.grade, gradesConfig);
  }, [form.grade, gradesConfig]);

  /* Auto-pick the first stream when the grade changes. */
  useEffect(() => {
    if (form.grade && availableStreams.length > 0) {
      if (!availableStreams.includes(form.stream)) {
        setForm((prev) => ({ ...prev, stream: availableStreams[0] }));
      }
    } else if (!form.grade) {
      setForm((prev) => ({ ...prev, stream: '' }));
    }
  }, [form.grade, availableStreams, form.stream]);

  /* ── handlers ───────────────────────────────────────────────────── */
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegenerateAdmNo = () => {
    setForm((prev) => ({ ...prev, admissionNumber: generateAdmissionNumber() }));
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const validate = (): string => {
    if (!form.fullName.trim()) return 'Please enter the learner\u2019s Full Name.';
    if (!form.gender) return 'Please select a Gender.';
    if (!form.dob) return 'Please provide the Date of Birth.';
    if (!form.admissionNumber.trim()) return 'Admission Number is required.';

    // Assessment-number format check (school convention: starts with a letter).
    if (!/^[A-Za-z]/.test(form.admissionNumber.trim())) {
      return 'Admission Number must start with an alphabetic letter (e.g. A827361).';
    }

    if (!form.previousSchool.trim())
      return 'Please record the Previous School Name for audit purposes.';
    if (!form.clearanceRef.trim())
      return 'Please capture the Previous School Clearance / Transfer Reference Number.';
    if (!form.reason.trim()) return 'Please provide a Reason for Transfer.';
    if (!form.dateAdmitted) return 'Please select the Date Admitted.';
    if (!form.grade) return 'Please select a Grade Level.';
    if (!form.stream) return 'Please select a Stream.';
    return '';
  };

  /**
   * Persist the learner row + roster insertion + history log atomically.
   *
   * Returns the persisted learner on success, or null on failure.
   */
  const performInsert = (): Learner | null => {
    const existingRaw = localStorage.getItem('school_learners_data');
    let existing: Learner[] = [];
    try {
      existing = existingRaw ? (JSON.parse(existingRaw) as Learner[]) : [];
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }

    // Reject duplicate admission numbers — they MUST be unique.
    const admNo = form.admissionNumber.trim();
    if (existing.some((l) => (l.admNo || '').toLowerCase() === admNo.toLowerCase())) {
      showError(
        `Admission Number ${admNo} already exists. Please choose another.`,
      );
      return null;
    }

    const now = new Date().toISOString();
    const learner: Learner = {
      id: `txfr-in-${Date.now().toString()}-${Math.floor(
        Math.random() * 1000,
      )}`,
      admNo,
      name: form.fullName.trim(),
      grade: form.grade,
      stream: form.stream,
      gender: form.gender,
      guardian: '',
      phone: '',
      status: 'Active',
      dob: form.dob,
      dateOfAdmission: form.dateAdmitted,
      nemisUpi: form.nemisUpi.trim() || admNo,
      previousSchool: form.previousSchool.trim(),
      previousSchoolClearanceRef: form.clearanceRef.trim(),
      transferReason: form.reason.trim(),
    };

    // 1. Insert into the active learner directory.
    const updated = [learner, ...existing];
    try {
      localStorage.setItem('school_learners_data', JSON.stringify(updated));
    } catch (err) {
      console.error('[TransferInModal] Failed to persist learner:', err);
      showError('Could not save the learner record. Please retry.');
      return null;
    }

    // 2. Append to per-class rosters (attendance / marksheet / register).
    // 3. Log a TRANSFERRED_IN entry in academic history.
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

    // Tiny UX delay so the spinner can render — keeps the experience
    // feeling responsive without making the user wait unnecessarily.
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

        {/* ── Section 1: Learner Details ─────────────────────────────── */}
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
                <IdCard
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
                    placeholder="A100200"
                    className="pl-9 uppercase rounded-xl h-12 bg-slate-50 border-none font-bold"
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
                Use the Auto button to generate a unique assessment number, or
                type your own.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 2: Transfer Metadata ─────────────────────────── */}
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

        {/* ── Section 3: Placement ──────────────────────────────────── */}
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

          {/* Live confirmation of the destination roster. */}
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