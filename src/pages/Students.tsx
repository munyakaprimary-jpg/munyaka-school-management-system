"use client";

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/ui/BackButton';
import { Search, Plus, UserPlus, Download, Loader2, X, Eye, Trash2, Lock, AlertCircle, History, UserX } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useGradesStreams } from '@/hooks/useGradesStreams';

const Students = () => {
  const { grades, streams, isLoading } = useGradesStreams();
  const [studentsList, setStudentsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterStream, setFilterStream] = useState("all");
  
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

  // Admin Auth Deletion State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);

  // Registration Form State
  const [fullName, setFullName] = useState("");
  const [assessmentNo, setAssessmentNo] = useState("");
  const [regGrade, setRegGrade] = useState("");
  const [regStream, setRegStream] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Dynamically get streams for the selected grade from central store
  const availableStreams = useMemo(() => {
    if (!regGrade) return [];
    return streams.filter(s => s.gradeId === regGrade);
  }, [streams, regGrade]);

  // Reset stream when grade changes and no longer matches available streams
  React.useEffect(() => {
    if (regStream && availableStreams.length > 0 && !availableStreams.some(s => s.name === regStream)) {
      setRegStream(availableStreams[0]?.name || '');
    }
  }, [regGrade, availableStreams, regStream]);

  // Get unique streams for the filter dropdown
  const uniqueStreams = useMemo(() => {
    const streamNames = new Set<string>();
    streams.forEach(s => streamNames.add(s.name));
    return Array.from(streamNames).sort();
  }, [streams]);