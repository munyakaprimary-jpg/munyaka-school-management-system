import { useState, useEffect, useCallback } from 'react';
import { staffMasterService, StaffMember } from '@/services/staffMasterService';

export interface UseStaffDataResult {
  staff: StaffMember[];
  loading: boolean;
  error: string | null;
  refreshStaff: () => Promise<void>;
  addStaffMember: (member: Omit<StaffMember, 'id' | 'created_at' | 'updated_at'>) => Promise<StaffMember>;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => Promise<StaffMember>;
  deleteStaffMember: (id: string) => Promise<void>;
  toggleActiveStatus: (id: string) => Promise<StaffMember>;
}

export const useStaffData = (): UseStaffDataResult => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await staffMasterService.getAllStaff();
      setStaff(data);
    } catch (err: any) {
      console.error('[useStaffData] Error fetching staff:', err);
      setError(err?.message || 'Failed to load staff records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const addStaffMember = async (member: Omit<StaffMember, 'id' | 'created_at' | 'updated_at'>) => {
    const newMember = await staffMasterService.addStaff(member);
    await loadStaff();
    return newMember;
  };

  const updateStaffMember = async (id: string, updates: Partial<StaffMember>) => {
    const updated = await staffMasterService.updateStaff(id, updates);
    await loadStaff();
    return updated;
  };

  const deleteStaffMember = async (id: string) => {
    await staffMasterService.deleteStaff(id);
    await loadStaff();
  };

  const toggleActiveStatus = async (id: string) => {
    const target = staff.find((s) => s.id === id);
    if (!target) throw new Error('Staff member not found');
    const newStatus = target.status === 'active' ? 'inactive' : 'active';
    const updated = await staffMasterService.updateStaff(id, { status: newStatus });
    await loadStaff();
    return updated;
  };

  return {
    staff,
    loading,
    error,
    refreshStaff: loadStaff,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    toggleActiveStatus,
  };
};
