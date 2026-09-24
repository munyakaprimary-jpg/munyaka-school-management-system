import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Shield,
  UserCheck,
  UserX,
  Key,
  Mail,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AddPreRegModal from "./AddPreRegModal";
import DispatchInviteModal from "./DispatchInviteModal";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: "active" | "suspended" | "pending" | "invited";
  lastLogin?: string;
  accessLevel: "Admin" | "Teacher" | "Staff" | "Restricted";
  avatar?: string;
}

const initialStaff: StaffMember[] = [
  {
    id: "stf-1",
    name: "Dr. Elizabeth Koech",
    email: "elizabeth.koech@munyaka.ac.ke",
    phone: "+254 712 345 678",
    role: "Principal / Administrator",
    department: "Administration",
    status: "active",
    lastLogin: "Today, 08:30 AM",
    accessLevel: "Admin",
  },
  {
    id: "stf-2",
    name: "John Kamau",
    email: "john.kamau@munyaka.ac.ke",
    phone: "+254 722 987 654",
    role: "Senior Teacher (Mathematics)",
    department: "Academics",
    status: "active",
    lastLogin: "Today, 07:45 AM",
    accessLevel: "Teacher",
  },
  {
    id: "stf-3",
    name: "Amina Odhiambo",
    email: "amina.odhiambo@munyaka.ac.ke",
    phone: "+254 733 456 789",
    role: "ICT Lab Instructor",
    department: "ICT & Digital Learning",
    status: "active",
    lastLogin: "Yesterday, 04:15 PM",
    accessLevel: "Staff",
  },
  {
    id: "stf-4",
    name: "Peter Mwangi",
    email: "peter.mwangi@munyaka.ac.ke",
    phone: "+254 744 112 233",
    role: "Bursar / Accounts",
    department: "Finance",
    status: "pending",
    accessLevel: "Admin",
  },
  {
    id: "stf-5",
    name: "Sarah Wanjiku",
    email: "sarah.wanjiku@munyaka.ac.ke",
    phone: "+254 755 667 889",
    role: "Librarian",
    department: "Library",
    status: "invited",
    accessLevel: "Staff",
  },
];

export default function StaffAccessMaster() {
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showPreRegModal, setShowPreRegModal] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<StaffMember | null>(null);

  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      const matchesSearch =
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole =
        roleFilter === "all" || staff.accessLevel.toLowerCase() === roleFilter.toLowerCase();
      return matchesSearch && matchesRole;
    });
  }, [staffList, searchQuery, roleFilter]);

  // Toggle selection for single staff
  const toggleSelectStaff = (id: string, e?: React.MouseEvent | React.ChangeEvent) => {
    e?.stopPropagation();
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Toggle select all visible
  const toggleSelectAll = () => {
    if (selectedStaffIds.length === filteredStaff.length && filteredStaff.length > 0) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(filteredStaff.map((s) => s.id));
    }
  };

  const handleStatusToggle = (id: string) => {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "active" ? "suspended" : "active" }
          : s
      )
    );
  };

  const handleDelete = (id: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== id));
    setSelectedStaffIds((prev) => prev.filter((i) => i !== id));
    if (selectedStaff?.id === id) setSelectedStaff(null);
  };

  const handleBulkDelete = () => {
    if (selectedStaffIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedStaffIds.length} selected staff member(s)?`)) {
      setStaffList((prev) => prev.filter((s) => !selectedStaffIds.includes(s.id)));
      setSelectedStaffIds([]);
    }
  };

  const handleBulkActivate = () => {
    if (selectedStaffIds.length === 0) return;
    setStaffList((prev) =>
      prev.map((s) => (selectedStaffIds.includes(s.id) ? { ...s, status: "active" } : s))
    );
    setSelectedStaffIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Staff Access & Permissions</h2>
          <p className="text-sm text-gray-500">
            Manage portal access, roles, credentials, and authentication privileges for staff.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedStaffIds.length > 0 && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-semibold text-indigo-700">
                {selectedStaffIds.length} selected
              </span>
              <button
                onClick={handleBulkActivate}
                className="text-xs px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium"
              >
                Activate
              </button>
              <button
                onClick={handleBulkDelete}
                className="text-xs px-2.5 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-1"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
          <Button
            onClick={() => setShowPreRegModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2"
          >
            <Plus size={16} /> Pre-Register Staff
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Access Levels</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredStaff.length > 0 &&
                      selectedStaffIds.length === filteredStaff.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="p-4">Staff Member</th>
                <th className="p-4">Role & Department</th>
                <th className="p-4">Access Level</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Login</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    No staff members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const isSelected = selectedStaffIds.includes(staff.id);
                  return (
                    <tr
                      key={staff.id}
                      onClick={(e) => toggleSelectStaff(staff.id, e)}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? "bg-indigo-50/70 hover:bg-indigo-50" : "hover:bg-gray-50/50"
                      }`}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectStaff(staff.id, e)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{staff.name}</div>
                        <div className="text-xs text-gray-500">{staff.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-800">{staff.role}</div>
                        <div className="text-xs text-gray-400">{staff.department}</div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            staff.accessLevel === "Admin"
                              ? "bg-purple-100 text-purple-700"
                              : staff.accessLevel === "Teacher"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <Shield size={11} /> {staff.accessLevel}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            staff.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : staff.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : staff.status === "invited"
                              ? "bg-sky-100 text-sky-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {staff.status === "active" && <CheckCircle2 size={12} />}
                          {staff.status === "pending" && <AlertCircle size={12} />}
                          {staff.status === "invited" && <Mail size={12} />}
                          <span className="capitalize">{staff.status}</span>
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {staff.lastLogin || "Never logged in"}
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setInviteTarget(staff);
                              setInviteModalOpen(true);
                            }}
                            title="Dispatch Invite"
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            <Mail size={15} />
                          </button>
                          <button
                            onClick={() => handleStatusToggle(staff.id)}
                            title={staff.status === "active" ? "Suspend Access" : "Activate Access"}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              staff.status === "active"
                                ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {staff.status === "active" ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                          <button
                            onClick={() => handleDelete(staff.id)}
                            title="Delete Staff"
                            className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showPreRegModal && (
        <AddPreRegModal
          isOpen={showPreRegModal}
          onClose={() => setShowPreRegModal(false)}
          onSubmit={(newStaff: any) => setStaffList((prev: any) => [newStaff, ...prev])}
        />
      )}

      {inviteModalOpen && inviteTarget && (
        <DispatchInviteModal
          isOpen={inviteModalOpen}
          onClose={() => {
            setInviteModalOpen(false);
            setInviteTarget(null);
          }}
          onConfirm={() => {
            setInviteModalOpen(false);
            setInviteTarget(null);
          }}
          staff={{
            id: inviteTarget.id || '1',
            staffId: (inviteTarget as any).staffId || inviteTarget.id || '1',
            fullName: (inviteTarget as any).fullName || inviteTarget.name || '',
            nationalId: (inviteTarget as any).nationalId || '',
            email: inviteTarget.email || '',
            phone: inviteTarget.phone || '',
            systemRole: (inviteTarget as any).systemRole || 'subject_teacher',
            department: inviteTarget.department || 'General',
            assignedSubjects: (inviteTarget as any).assignedSubjects || [],
            tempAccessCode: (inviteTarget as any).tempAccessCode || 'MUN-KEY',
            status: inviteTarget.status === 'active' ? 'Active' : inviteTarget.status === 'suspended' ? 'Suspended' : 'Pre-Registered',
            datePreRegistered: (inviteTarget as any).createdAt || new Date().toISOString()
          }}
        />
      )}
    </div>
  );
}
