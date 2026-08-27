import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Fingerprint, Monitor, UserCheck, Clock, AlertTriangle, UserX, ChevronRight, MapPin, Search, Calendar } from 'lucide-react';
import { useStaffAttendance } from '@/hooks/useStaffAttendance';
import { useGeolocation } from '@/hooks/useGeolocation';
import BackButton from '@/components/ui/BackButton';
import { format } from "date-fns";

const StaffAttendancePage = () => {
  const navigate = useNavigate();
  const { location } = useGeolocation();
  const { masterRegister } = useStaffAttendance(location);
  const [searchTerm, setSearchTerm] = useState("");

  const staffList = Object.values(masterRegister);

  // Compute stats based on today's register
  const presentCount = staffList.filter(s => s.morning?.status === 'present').length;
  const departedCount = staffList.filter(s => s.afternoon?.status === 'departed' || s.morning?.status === 'departed').length;
  const earlyDepartureCount = staffList.filter(s => s.morning?.status === 'early_departure').length;
  const notCheckedInCount = staffList.filter(s => !s.morning || s.morning.status === 'absent').length;

  const filteredStaff = staffList.filter(staff => 
    (staff.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    staff.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );