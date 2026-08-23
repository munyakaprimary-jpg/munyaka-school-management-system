import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, Edit3, Check, Calendar } from "lucide-react";

interface AttendanceHeaderProps {
 selectedClass: string;
 setSelectedClass: (val: string) => void;
 selectedStream: string;
 setSelectedStream: (val: string) => void;
 selectedDate: string;
 setSelectedDate: (val: string) => void;
 isExporting: boolean;
 onExport: () => void;
 isEditing: boolean;
 setIsEditing: (val: boolean) => void;
 isRegisterSubmitted: boolean;
 availableStreams: string[];
}

const CLASS_OPTIONS = [
 { value: 'PP1', label: 'PP1' },
 { value: 'PP2', label: 'PP2' },
 { value: 'Grade 1', label: 'Grade 1' },
 { value: 'Grade 2', label: 'Grade 2' },
 { value: 'Grade 3', label: 'Grade 3' },
 { value: 'Grade 4', label: 'Grade 4' },
 { value: 'Grade 5', label: 'Grade 5' },
 { value: 'Grade 6', label: 'Grade 6' },
 { value: 'Grade 7', label: 'Grade 7' },
 { value: 'Grade 8', label: 'Grade 8' },
 { value: 'Grade 9', label: 'Grade 9' },
];

const AttendanceHeader = ({ 
 selectedClass,
 setSelectedClass,
 selectedStream,
 setSelectedStream,
 selectedDate,
 setSelectedDate,
 isExporting,
 onExport,
 isEditing,
 setIsEditing,
 isRegisterSubmitted,
 availableStreams
}: AttendanceHeaderProps) => {
 // ... rest of component code remains unchanged ...
 };

export default AttendanceHeader;