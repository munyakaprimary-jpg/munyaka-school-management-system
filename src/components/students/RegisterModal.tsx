import React, { useMemo, useState, useEffect } from 'react';
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ShieldCheck, Info, Calendar } from 'lucide-react';
import {
  readGradesAndStreams,
  getStreamsForGrade,
  GradesStreamsConfig,
} from '@/services/gradesStreamsConfig';
import {
  getTeacherAllowedGrades,
  getTeacherAllowedStreamsForGrade,
  isTeacherWithRestrictedLoad,
} from '@/utils/teacherLoadUtils';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullName: string;
  setFullName: (value: string) => void;
  admissionNumber: string;
  setAdmissionNumber: (value: string) => void;
  assessmentNo: string;
  setAssessmentNo: (value: string) => void;
  birthCertificateNo: string;
  setBirthCertificateNo: (value: string) => void;
  regGrade: string;
  setRegGrade: (value: string) => void;
  regStream: string;
  setRegStream: (value: string) => void;
  guardianName: string;
  setGuardianName: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  dateOfBirth: string;
  setDateOfBirth: (value: string) => void;
  enrollmentYear: number;
  setEnrollmentYear: (value: number) => void;
  gender?: 'Male' | 'Female' | 'Other';
  setGender?: (value: 'Male' | 'Female' | 'Other') => void;
  formError?: string;
  onRegister: (e?: React.FormEvent) => void;
  isSubmitting?: boolean;
  // Optional teacher-restriction props (for non-admin users)
  currentUserId?: string;
  currentUserEmail?: string;
  isCurrentUserAdmin?: boolean;
}

export default function RegisterModal({
  isOpen,
  onClose,
  fullName,
  setFullName,
  admissionNumber,
  setAdmissionNumber,
  assessmentNo,
  setAssessmentNo,
  birthCertificateNo,
  setBirthCertificateNo,
  regGrade,
  setRegGrade,
  regStream,
  setRegStream,
  guardianName,
  setGuardianName,
  phone,
  setPhone,
  dateOfBirth,
  setDateOfBirth,
  enrollmentYear,
  setEnrollmentYear,
  gender = 'Female',
  setGender,
  formError = '',
  onRegister,
  isSubmitting = false,
  currentUserId,
  currentUserEmail,
  isCurrentUserAdmin = false,
}: RegisterModalProps) {
  // Generate enrollment year options: from 2010 (or 15 years in the past) up to currentYear + 2
  const currentYear = new Date().getFullYear();
  const startYear = Math.min(2010, currentYear - 15);
  const endYear = currentYear + 2;
  const yearOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = endYear; y >= startYear; y--) {
      list.push(y);
    }
    return list;
  }, [startYear, endYear]);
  const [gradesConfig, setGradesConfig] = useState<GradesStreamsConfig>(() =>
    readGradesAndStreams()
  );

  useEffect(() => {
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
  }, []);

  // ── Teacher restriction logic ─────────────────────────────────────
  // For non-admin users with an assigned teaching load, restrict the
  // grade & stream options to only those the teacher is assigned to.
  const isTeacherRestricted = !isCurrentUserAdmin && isTeacherWithRestrictedLoad(
    currentUserId,
    currentUserEmail,
    isCurrentUserAdmin
  );

  const allowedGrades = useMemo(() => {
    if (!isTeacherRestricted) return gradesConfig.grades;
    const tGrades = getTeacherAllowedGrades(currentUserId, currentUserEmail, isCurrentUserAdmin);
    if (tGrades.length === 0) return gradesConfig.grades;
    // Intersect with configured grades to ensure ordering and validity
    return gradesConfig.grades.filter(g => tGrades.some(tg =>
      tg.toLowerCase().trim() === g.toLowerCase().trim() ||
      tg.replace(/\D/g, '') === g.replace(/\D/g, '')
    ));
  }, [isTeacherRestricted, currentUserId, currentUserEmail, isCurrentUserAdmin, gradesConfig.grades]);

  const allowedStreamsForGrade = useMemo(() => {
    if (!regGrade) return [];
    if (!isTeacherRestricted) {
      return getStreamsForGrade(regGrade, gradesConfig);
    }
    const tStreams = getTeacherAllowedStreamsForGrade(
      regGrade, currentUserId, currentUserEmail, isCurrentUserAdmin
    );
    if (tStreams.length === 0) return [];
    const configuredStreams = getStreamsForGrade(regGrade, gradesConfig);
    return configuredStreams.filter(s => tStreams.some(ts =>
      ts.toLowerCase().trim() === s.toLowerCase().trim()
    ));
  }, [regGrade, gradesConfig, isTeacherRestricted, currentUserId, currentUserEmail, isCurrentUserAdmin]);

  // Lock grade and stream to assigned teacher class if restricted and not admin
  useEffect(() => {
    if (!isCurrentUserAdmin && currentUserId) {
      try {
        const currentUserStr = localStorage.getItem('munyaka_current_user');
        if (currentUserStr) {
          const userObj = JSON.parse(currentUserStr);
          if (userObj?.assignedClass) {
            // parse assignedClass e.g. "Grade 9 Venus" -> grade: "Grade 9", stream: "Venus" (or first word/token)
            const parts = userObj.assignedClass.split(' ');
            if (parts.length >= 2) {
              const assignedG = `${parts[0]} ${parts[1]}`;
              const assignedSt = parts.slice(2).join(' ') || 'BLUE';
              if (allowedGrades.some(g => g.toLowerCase() === assignedG.toLowerCase())) {
                setRegGrade(assignedG);
                if (allowedStreamsForGrade.some(s => s.toLowerCase() === assignedSt.toLowerCase())) {
                  setRegStream(assignedSt);
                }
              }
            }
          }
        }
      } catch {}
    }
  }, [isCurrentUserAdmin, currentUserId, allowedGrades, allowedStreamsForGrade, setRegGrade, setRegStream]);

  useEffect(() => {
    if (!regGrade) return;
    if (regStream && allowedStreamsForGrade.length > 0 &&
        !allowedStreamsForGrade.some(s => s.toLowerCase().trim() === regStream.toLowerCase().trim())) {
      setRegStream(allowedStreamsForGrade[0]);
    }
  }, [allowedStreamsForGrade, regStream, regGrade, setRegStream]);

  const availableStreams = allowedStreamsForGrade;
  const isGradeDisabled = isTeacherRestricted && allowedGrades.length <= 1;
  const isStreamDisabled = isTeacherRestricted && allowedStreamsForGrade.length <= 1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Student"
      description="Enroll learner into the academic system. Provide at least one of Assessment Number or Birth Certificate Number."
      footer={
          <>
            <Button
              variant="ghost"
              className="rounded-xl h-12 px-6 font-bold"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="register-student-form"
              disabled={isSubmitting}
              className="rounded-xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register Student'}
            </Button>
          </>
        }
        maxWidth="max-w-xl"
      >
        <form id="register-student-form" onSubmit={onRegister} className="space-y-6">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}
      
              {/* Teacher-restriction notice */}
              {isTeacherRestricted && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-700 flex items-start gap-2 animate-in slide-in-from-top-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
                  <div>
                    <p className="font-bold">Teaching-Load Restriction Active</p>
                    <p className="text-indigo-600/80 font-medium mt-0.5">
                      Grade and Stream are limited to your assigned teaching classes
                      ({allowedGrades.length} grade{allowedGrades.length !== 1 ? 's' : ''}).
                    </p>
                  </div>
                </div>
              )}
      
              {/* 1. Full Name */}
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Full Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                />
              </div>

        {/* 3. Assessment No & 4. Birth Certificate No */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              Assessment No.
              <span className="text-[9px] font-bold text-slate-400 normal-case tracking-normal">
                (KNEC / NEMIS)
              </span>
            </Label>
            <Input
              value={assessmentNo}
              onChange={(e) => setAssessmentNo(e.target.value)}
              placeholder="Optional"
              className="uppercase rounded-xl h-12 bg-slate-50 border-none font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
              Birth Certificate No.
            </Label>
            <Input
              value={birthCertificateNo}
              onChange={(e) => setBirthCertificateNo(e.target.value)}
              placeholder="Optional"
              className="rounded-xl h-12 bg-slate-50 border-none font-bold uppercase"
            />
          </div>
        </div>

        {/* 5. Enrollment Year, Grade Level, Stream */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Enrollment Year
                    </Label>
                    <Select
                      value={String(enrollmentYear)}
                      onValueChange={(val) => setEnrollmentYear(Number(val))}
                    >
                      <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      Grade Level
                      {isTeacherRestricted && (
                        <span className="text-[9px] font-bold text-indigo-500 normal-case tracking-normal flex items-center gap-1">
                          <Info size={10} /> (your teaching load)
                        </span>
                      )}
                    </Label>
                    <Select
                      value={regGrade || ''}
                      onValueChange={(val) => {
                        setRegGrade(val);
                        setRegStream('');
                      }}
                      disabled={isGradeDisabled && !!regGrade}
                    >
                      <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold disabled:opacity-70 disabled:cursor-not-allowed">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {allowedGrades.length === 0 ? (
                          <SelectItem value="__none__" disabled>
                            No grades available
                          </SelectItem>
                        ) : (
                          allowedGrades.map((gradeName) => (
                            <SelectItem key={gradeName} value={gradeName}>
                              {gradeName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Stream
                    </Label>
                    <Select
                      value={regStream || ''}
                      onValueChange={setRegStream}
                      disabled={!regGrade || availableStreams.length === 0 || (isStreamDisabled && !!regStream)}
                    >
                      <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                        <SelectValue
                          placeholder={
                            !regGrade
                              ? "Select grade first..."
                              : availableStreams.length === 0
                              ? "No streams available"
                              : "Choose stream..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {availableStreams.length === 0 ? (
                          <SelectItem value="__none__" disabled>
                            {isTeacherRestricted ? "Not in your teaching load" : "No streams configured"}
                          </SelectItem>
                        ) : (
                          availableStreams.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
        
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Date of Birth <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="rounded-xl h-12 bg-slate-50 border-none font-bold pl-10 [color-scheme:light]"
                        max={new Date().toISOString().split('T')[0]}
                      />
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Gender <span className="text-[9px] font-bold text-slate-400 normal-case tracking-normal">(optional)</span>
                    </Label>
                    <Select
                      value={gender || 'Female'}
                      onValueChange={(val) => setGender?.(val as 'Male' | 'Female' | 'Other')}
                    >
                      <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Admission Number (Auto-generated) placed directly between Gender and Guardian Name */}
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Admission Number
                    </Label>
                    <Input
                      value={admissionNumber}
                      readOnly
                      placeholder="Auto-generated"
                      className="rounded-xl h-12 bg-indigo-50 border border-indigo-200 font-bold text-indigo-700 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      MUN-G[Grade]-[Seq]/[Year]
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Guardian Name <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="Parent / Guardian full name"
                      className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Phone <span className="text-[9px] font-bold text-slate-400 normal-case tracking-normal">(optional)</span>
                    </Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+254"
                      className="rounded-xl h-12 bg-slate-50 border-none font-bold"
                    />
                  </div>
                </div>
        </form>
      </Modal>
  );
}
