import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from "@/components/ui/Modal";
import BackButton from "@/components/ui/BackButton";
import { Search, Filter, MoreVertical, UserCircle, Phone, GraduationCap, Plus, UserPlus, UserX } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { STUDENTS as initialStudents } from '@/lib/mock-data';
import { showSuccess } from '@/utils/toast';
import { TransferStudent } from '@/types/transfer';
import { cn } from '@/lib/utils'; // Add this import