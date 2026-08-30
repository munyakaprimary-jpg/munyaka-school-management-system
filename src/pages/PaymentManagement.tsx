import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import BackButton from "@/components/ui/BackButton";
import { cn } from "@/lib/utils";
import { useFileDownload } from "@/utils/fileDownloader";
import { showSuccess, showError } from "@/utils/toast";
import {
  Laptop,
  Wifi,
  HardDrive,
  Cpu,
  Globe,
  BookOpen,
  Video,
  Download,
  ExternalLink,
  Monitor,
  Activity,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  Database,
  HardDrive,
  Lock,
  Loader2,
  AlertCircle,
  UserCheck,
  Eye,
  EyeOff,
  Lock,
  Download,
  FileSpreadsheet,
  Database,
  HardDrive,
  Lock,
  Loader2,
  AlertCircle as AlertCircleIcon,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Undo2,
  Package,
  Minus,
  Plus as PlusIcon,
  Edit,
  MoreVertical,
  ArrowRight,
  ShieldAlert,
  Download,
  FileSpreadsheet,
  Database,
  HardDrive,
  Lock,
  Loader2,
  AlertCircle as AlertCircleIcon,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Undo2,
  Package,
  Minus,
  Plus as PlusIcon,
  Edit,
  MoreVertical,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PaymentManagement = () => {
  // ... rest of component