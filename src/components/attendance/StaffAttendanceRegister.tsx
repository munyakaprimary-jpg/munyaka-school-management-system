import { useState, useEffect } from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Save,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CENTRAL_DB_KEY } from "@/components/AddMaterialModal";

interface Learner {
  id: string;
  name: string;
  admissionNumber?: string;
  admissionNo?: string;
  grade: string | number;
  stream?: string;
}

interface AttendanceRecord {
  learnerId: string;
  morningStatus: "present" | "absent" | "late";
  afternoonStatus: "present" | "absent" | "late";
}

export function StaffAttendanceRegister() {
  const { user } = useAuth();
  const roleLower = String(user?.role || '').toLowerCase();
  const isAdmin = roleLower === 'admin' || roleLower === 'owner' || roleLower === 'super_admin';
  const assignedGrade = !isAdmin ? (user?.assignedClass || user?.grade || 'Grade 1') : 'Grade 1';
  const assignedStream = !isAdmin ? (user?.assignedStream || user?.stream || 'East') : 'East';

  const [selectedGrade, setSelectedGrade] = useState<string>(assignedGrade);
  const [selectedStream, setSelectedStream] = useState<string>(assignedStream);

  // If teacher, enforce assigned grade and stream
  useEffect(() => {
    if (!isAdmin) {
      if (user?.assignedClass || user?.grade) {
        setSelectedGrade(user.assignedClass || user.grade || 'Grade 1');
      }
      if (user?.assignedStream || user?.stream) {
        setSelectedStream(user.assignedStream || user.stream || 'East');
      }
    }
  }, [user, isAdmin]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [learners, setLearners] = useState<Learner[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Load learners from munyaka_central_db or localStorage
  useEffect(() => {
    try {
      const centralRaw = localStorage.getItem(CENTRAL_DB_KEY);
      let roster: Learner[] = [];
      if (centralRaw) {
        const db = JSON.parse(centralRaw);
        roster = db.learners || db.students || db.pupils || [];
      }
      if (roster.length === 0) {
        const localRaw = localStorage.getItem("munyaka_learners") || localStorage.getItem("learners_list");
        if (localRaw) {
          roster = JSON.parse(localRaw);
        }
      }

      // Filter by selected grade and stream if available, or fallback to mock learners if empty
      let filteredRoster = roster.filter((l) => {
        const matchesGrade = String(l.grade).toLowerCase().includes(selectedGrade.toLowerCase());
        const matchesStream = !selectedStream || !l.stream || l.stream.toLowerCase() === selectedStream.toLowerCase();
        return matchesGrade && matchesStream;
      });

      if (filteredRoster.length === 0 && roster.length === 0) {
        // Fallback default mock learners for demo
        filteredRoster = [
          { id: "l-1", name: "Amina Omwamba", admissionNumber: "ADM-001", grade: selectedGrade, stream: selectedStream },
          { id: "l-2", name: "Brian Kiprono", admissionNumber: "ADM-002", grade: selectedGrade, stream: selectedStream },
          { id: "l-3", name: "Chloe Akinyi", admissionNumber: "ADM-003", grade: selectedGrade, stream: selectedStream },
          { id: "l-4", name: "David Mutua", admissionNumber: "ADM-004", grade: selectedGrade, stream: selectedStream },
          { id: "l-5", name: "Esther Wanjiku", admissionNumber: "ADM-005", grade: selectedGrade, stream: selectedStream },
        ];
      }

      setLearners(filteredRoster);

      // Initialize attendance records (default to 'present')
      const initialMap: Record<string, AttendanceRecord> = {};
      filteredRoster.forEach((l) => {
        initialMap[l.id] = {
          learnerId: l.id,
          morningStatus: "present",
          afternoonStatus: "present",
        };
      });

      // Try loading existing attendance from central db for this date
      if (centralRaw) {
        const db = JSON.parse(centralRaw);
        const attendanceLogs = db.attendanceLogs || db.attendance || {};
        const dateKey = `${selectedDate}_${selectedGrade}_${selectedStream}`;
        if (attendanceLogs[dateKey]) {
          setAttendance(attendanceLogs[dateKey]);
        } else {
          setAttendance(initialMap);
        }
      } else {
        setAttendance(initialMap);
      }
    } catch {
      // Fallback
    }
  }, [selectedGrade, selectedStream, selectedDate]);

  const handleStatusChange = (learnerId: string, rollType: "morningStatus" | "afternoonStatus", status: "present" | "absent" | "late") => {
    setAttendance((prev) => ({
      ...prev,
      [learnerId]: {
        ...(prev[learnerId] || { learnerId, morningStatus: "present", afternoonStatus: "present" }),
        [rollType]: status,
      },
    }));
    setSavedSuccess(false);
  };

  const markAll = (rollType: "morningStatus" | "afternoonStatus", status: "present" | "absent" | "late") => {
    setAttendance((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id] = {
          ...updated[id],
          [rollType]: status,
        };
      });
      return updated;
    });
    setSavedSuccess(false);
  };

  const handleSaveAttendance = () => {
    setIsSaving(true);
    try {
      const centralRaw = localStorage.getItem(CENTRAL_DB_KEY);
      const db = centralRaw ? JSON.parse(centralRaw) : {};
      if (!db.attendanceLogs) db.attendanceLogs = {};
      const dateKey = `${selectedDate}_${selectedGrade}_${selectedStream}`;
      db.attendanceLogs[dateKey] = attendance;
      localStorage.setItem(CENTRAL_DB_KEY, JSON.stringify(db));

      // Also dispatch storage event for sync
      window.dispatchEvent(new Event("storage"));
      setTimeout(() => {
        setIsSaving(false);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }, 600);
    } catch {
      setIsSaving(false);
    }
  };

  const filteredLearners = learners.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      (l.admissionNumber && l.admissionNumber.toLowerCase().includes(q)) ||
      (l.admissionNo && l.admissionNo.toLowerCase().includes(q))
    );
  });

  const totalLearners = learners.length;
  const morningPresentCount = Object.values(attendance).filter((a) => a.morningStatus === "present").length;
  const afternoonPresentCount = Object.values(attendance).filter((a) => a.afternoonStatus === "present").length;

  return (
    <div className="space-y-6">
      {/* Controls & Filter Header */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Individual Learner Rollcall Register</h2>
              <p className="text-xs text-gray-500">
                Mark morning and afternoon attendance per learner · munyaka_central_db synced
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all ${
              savedSuccess ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : savedSuccess ? (
              <CheckCircle2 size={15} />
            ) : (
              <Save size={15} />
            )}
            {savedSuccess ? "Attendance Saved!" : "Save Rollcall"}
          </button>
        </div>

        {/* Filters and Date */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Grade Level {!isAdmin && <span className="text-indigo-600 font-bold">(Assigned)</span>}
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => isAdmin && setSelectedGrade(e.target.value)}
              disabled={!isAdmin}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${
                !isAdmin ? "bg-gray-100 text-gray-700 cursor-not-allowed border-gray-200" : "border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              }`}
            >
              <option value="PP1">PP1</option>
              <option value="PP2">PP2</option>
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Grade 3">Grade 3</option>
              <option value="Grade 4">Grade 4</option>
              <option value="Grade 5">Grade 5</option>
              <option value="Grade 6">Grade 6</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value={assignedGrade}>{assignedGrade}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Stream {!isAdmin && <span className="text-indigo-600 font-bold">(Assigned)</span>}
            </label>
            <select
              value={selectedStream}
              onChange={(e) => isAdmin && setSelectedStream(e.target.value)}
              disabled={!isAdmin}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-medium ${
                !isAdmin ? "bg-gray-100 text-gray-700 cursor-not-allowed border-gray-200" : "border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              }`}
            >
              <option value="East">East</option>
              <option value="West">West</option>
              <option value="Green">Green</option>
              <option value="Blue">Blue</option>
              <option value={assignedStream}>{assignedStream}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Register Date</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Search Learner</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or ADM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary stats badge */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Roster</p>
            <p className="text-lg font-bold text-gray-900">{totalLearners} Learners</p>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <Users size={18} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-600 font-medium">Morning Present</p>
            <p className="text-lg font-bold text-emerald-700">{morningPresentCount} / {totalLearners}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-600 font-medium">Afternoon Present</p>
            <p className="text-lg font-bold text-indigo-700">{afternoonPresentCount} / {totalLearners}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <ShieldCheck size={18} />
          </div>
        </div>
      </div>

      {/* Bulk action buttons */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-gray-100/70 p-3 rounded-xl border border-gray-200">
        <span className="text-xs font-semibold text-gray-600">Quick Mark All:</span>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-gray-500 font-medium">Morning:</span>
            <button onClick={() => markAll("morningStatus", "present")} className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs rounded font-semibold transition-all">All Present</button>
            <button onClick={() => markAll("morningStatus", "absent")} className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs rounded font-semibold transition-all">All Absent</button>
          </div>
          <div className="h-4 w-px bg-gray-300 mx-1" />
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-gray-500 font-medium">Afternoon:</span>
            <button onClick={() => markAll("afternoonStatus", "present")} className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs rounded font-semibold transition-all">All Present</button>
            <button onClick={() => markAll("afternoonStatus", "absent")} className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs rounded font-semibold transition-all">All Absent</button>
          </div>
        </div>
      </div>

      {/* Individual Learner Roster Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Learner Name & ADM</th>
                <th className="py-3 px-4 text-center">Morning Rollcall</th>
                <th className="py-3 px-4 text-center">Afternoon Rollcall</th>
                <th className="py-3 px-4 text-right">Status Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
              {filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    No learners found matching your search or class criteria.
                  </td>
                </tr>
              ) : (
                filteredLearners.map((learner, index) => {
                  const rec = attendance[learner.id] || { learnerId: learner.id, morningStatus: "present", afternoonStatus: "present" };
                  return (
                    <tr key={learner.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-gray-400">{index + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{learner.name}</div>
                        <div className="text-[11px] text-gray-500">
                          {learner.admissionNumber || learner.admissionNo || `ADM-${learner.id}`} · {selectedGrade} {selectedStream}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex rounded-lg p-0.5 bg-gray-100 border border-gray-200">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(learner.id, "morningStatus", "present")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                              rec.morningStatus === "present" ? "bg-emerald-600 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(learner.id, "morningStatus", "late")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                              rec.morningStatus === "late" ? "bg-amber-500 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(learner.id, "morningStatus", "absent")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                              rec.morningStatus === "absent" ? "bg-red-600 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex rounded-lg p-0.5 bg-gray-100 border border-gray-200">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(learner.id, "afternoonStatus", "present")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                              rec.afternoonStatus === "present" ? "bg-emerald-600 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(learner.id, "afternoonStatus", "late")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                              rec.afternoonStatus === "late" ? "bg-amber-500 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(learner.id, "afternoonStatus", "absent")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                              rec.afternoonStatus === "absent" ? "bg-red-600 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          rec.morningStatus === "present" && rec.afternoonStatus === "present"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : rec.morningStatus === "absent" || rec.afternoonStatus === "absent"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {rec.morningStatus === "present" && rec.afternoonStatus === "present" ? (
                            <>Full Day Present</>
                          ) : rec.morningStatus === "absent" || rec.afternoonStatus === "absent" ? (
                            <>Absent Recorded</>
                          ) : (
                            <>Late Arrival</>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
