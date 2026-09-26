import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { initialSeedData } from '@/data/initialSeedData';

interface SchoolState {
  learners: any[];
  staff: any[];
  fees: any[];
  attendance: any;
  exams: any[];
  marks: any[];
  timetable: any;
  settings: any;
  notices: any[];
  events: any[];
  setLearners: (learners: any[]) => void;
  setStaff: (staff: any[]) => void;
  setFees: (fees: any[]) => void;
  setAttendance: (attendance: any) => void;
  setExams: (exams: any[]) => void;
  setMarks: (marks: any) => void;
  setTimetable: (timetable: any) => void;
  setSettings: (settings: any) => void;
  refreshStore: () => void;
  syncFromStorage: () => void;
}

export const useSchoolStore = create<SchoolState>()(
  persist(
    (set, get) => ({
      learners: initialSeedData.students || initialSeedData.learners || [],
      staff: initialSeedData.staff || [],
      fees: (initialSeedData as any).fees || [],
      attendance: (initialSeedData as any).attendance || {},
      exams: (initialSeedData as any).exams || [],
      marks: (initialSeedData as any).marks || [],
      timetable: (initialSeedData as any).timetable || {},
      settings: (initialSeedData as any).settings || {},
      notices: (initialSeedData as any).notices || [],
      events: (initialSeedData as any).events || [],
      
      setLearners: (learners: any[]) => {
        localStorage.setItem('munyaka_students', JSON.stringify(learners));
        localStorage.setItem('school_learners_data', JSON.stringify(learners));
        set({ learners });
        window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
      },
      setStaff: (staff: any[]) => {
        localStorage.setItem('munyaka_staff', JSON.stringify(staff));
        localStorage.setItem('munyaka_staff_directory', JSON.stringify(staff));
        localStorage.setItem('munyaka_master_staff_list', JSON.stringify(staff));
        set({ staff });
        window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
        window.dispatchEvent(new CustomEvent('staff-changed'));
      },
      setFees: (fees: any[]) => {
        localStorage.setItem('munyaka_fees', JSON.stringify(fees));
        set({ fees });
        window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
      },
      setAttendance: (attendance: any) => {
        localStorage.setItem('munyaka_attendance', JSON.stringify(attendance));
        set({ attendance });
        window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
      },
      setExams: (exams: any[]) => {
        localStorage.setItem('all_set_exams', JSON.stringify(exams));
        set({ exams });
        window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
      },
      setMarks: (marks: any) => {
        localStorage.setItem('marked_student_submissions', JSON.stringify(marks));
        set({ marks });
        window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
      },
      setTimetable: (timetable: any) => {
        localStorage.setItem('school-timetable-data', JSON.stringify(timetable));
        set({ timetable });
        window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
      },
      setSettings: (settings: any) => {
        localStorage.setItem('munyaka_system_settings_v3', JSON.stringify(settings));
        set({ settings });
        window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
      },
      refreshStore: () => {
        get().syncFromStorage();
        window.dispatchEvent(new CustomEvent('munyaka:data-changed'));
      },
      syncFromStorage: () => {
        set({
          learners: initialSeedData.students || initialSeedData.learners || [],
          staff: initialSeedData.staff || [],
          fees: (initialSeedData as any).fees || [],
          attendance: (initialSeedData as any).attendance || {},
          exams: (initialSeedData as any).exams || [],
          marks: (initialSeedData as any).marks || [],
          timetable: (initialSeedData as any).timetable || {},
          settings: (initialSeedData as any).settings || {},
          notices: (initialSeedData as any).notices || [],
          events: (initialSeedData as any).events || []
        });
      }
    }),
    {
      name: 'school-storage',
      version: 100,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        if (version < 100) {
          console.log(`[useSchoolStore] Migrating store from version ${version} to 100 — resetting cache to initialSeedData.`);
          return {
            learners: initialSeedData.students || initialSeedData.learners || [],
            staff: initialSeedData.staff || [],
            fees: (initialSeedData as any).fees || [],
            attendance: (initialSeedData as any).attendance || {},
            exams: (initialSeedData as any).exams || [],
            marks: (initialSeedData as any).marks || [],
            timetable: (initialSeedData as any).timetable || {},
            settings: (initialSeedData as any).settings || {},
            notices: (initialSeedData as any).notices || [],
            events: (initialSeedData as any).events || []
          };
        }
        return persistedState;
      },
    }
  )
);

export const SchoolStoreProvider = ({ children }: { children?: any }) => children ?? null;

export default useSchoolStore;
