import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, UserPlus, Shield, Phone, User, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStaffAdded?: (staff: any) => void;
}

const AVAILABLE_GRADES = [
  'Playgroup', 'PP1', 'PP2', 
  'Grade 1', 'Grade 2', 'Grade 3', 
  'Grade 4', 'Grade 5', 'Grade 6', 
  'Grade 7', 'Grade 8', 'Grade 9'
];

const AVAILABLE_STREAMS = ['East', 'West', 'North', 'South', 'Red', 'Blue', 'Green', 'Gold'];

export function AddStaffModal({ isOpen, onClose, onStaffAdded }: AddStaffModalProps) {
  const { toast } = useToast();

  // 1. State management for all input fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Teacher');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);

  // 2. Secure access code generator state that initializes with a random code (e.g. "MUN-" + 4 random alphanumeric characters)
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `MUN-${randomPart}`;
  };

  const [accessCode, setAccessCode] = useState<string>(() => generateRandomCode());

  // Reset or initialize state when modal opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setFullName('');
      setPhone('');
      setRole('Teacher');
      setSelectedGrades([]);
      setSelectedStreams([]);
      setAccessCode(generateRandomCode());
    } else {
      onClose();
    }
  };

  const handleGenerateNewCode = () => {
    const newCode = generateRandomCode();
    setAccessCode(newCode);
    toast({
      title: "New Access Code Generated",
      description: `Generated code: ${newCode}`,
    });
  };

  // 3. Checkbox handlers to select/deselect assigned grades and streams
  const handleGradeToggle = (grade: string) => {
    setSelectedGrades(prev => 
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
  };

  const handleStreamToggle = (stream: string) => {
    setSelectedStreams(prev =>
      prev.includes(stream) ? prev.filter(s => s !== stream) : [...prev, stream]
    );
  };

  // 4. Proper form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter staff member's full name.",
        variant: "destructive"
      });
      return;
    }

    // Gathers all form inputs into a complete staff object payload
    const newStaffMember = {
      id: `staff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fullName: fullName.trim(),
      name: fullName.trim(),
      phone: phone.trim(),
      role: role,
      accessCode: accessCode,
      code: accessCode,
      tempAccessCode: accessCode,
      assignedGrades: selectedGrades,
      assignedStreams: selectedStreams,
      assignedClasses: [...selectedGrades, ...selectedStreams],
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    try {
      // Unified Storage Writing across all recognized keys
      const existingRaw = localStorage.getItem('munyaka_staff') || localStorage.getItem('munyaka_staff_backup') || localStorage.getItem('staff_list') || '[]';
      const existingArray = JSON.parse(existingRaw);
      const updatedStaffArray = Array.isArray(existingArray) ? [...existingArray, newStaffMember] : [newStaffMember];

      const saveStaffRecord = (newList: any[]) => {
        // Write to primary and all fallback keys simultaneously
        localStorage.setItem('munyaka_staff', JSON.stringify(newList));
        localStorage.setItem('munyaka_staff_backup', JSON.stringify(newList));
        localStorage.setItem('staff_list', JSON.stringify(newList));
        localStorage.setItem('munyaka_staff_directory', JSON.stringify(newList));
        localStorage.setItem('munyaka_staff_db', JSON.stringify(newList));
        
        // Dispatch custom update events
        window.dispatchEvent(new CustomEvent('staff-updated', { detail: newList }));
        window.dispatchEvent(new Event('storage'));
      };

      saveStaffRecord(updatedStaffArray);

      if (onStaffAdded) {
        onStaffAdded(newStaffMember);
      }

      toast({
        title: "Staff Registered Successfully",
        description: `${fullName.trim()} has been added with access code ${accessCode}.`,
      });

      // Closes the modal upon successful registration
      onClose();
    } catch (err) {
      console.error('Failed to save staff to localStorage:', err);
      toast({
        title: "Error saving staff",
        description: "Could not save staff record to local storage.",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl bg-white border border-slate-100">
        <DialogHeader className="space-y-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Register New Staff Member</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                Configure staff profile, access credentials, and assigned teaching areas.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Full Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" /> Full Name *
              </Label>
              <Input
                id="fullName"
                placeholder="e.g. Teacher Jane Wanjiku"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-600" /> Phone Number
              </Label>
              <Input
                id="phone"
                placeholder="e.g. +254 712 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Role & Secure Access Code Generator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600" /> Staff Role
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role" className="rounded-xl border-slate-200 focus:ring-indigo-500 font-medium">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Teacher">Teacher</SelectItem>
                  <SelectItem value="Head Teacher">Head Teacher</SelectItem>
                  <SelectItem value="Deputy Head">Deputy Head</SelectItem>
                  <SelectItem value="Senior Teacher">Senior Teacher</SelectItem>
                  <SelectItem value="Bursar">Bursar</SelectItem>
                  <SelectItem value="Librarian">Librarian</SelectItem>
                  <SelectItem value="ICT Technician">ICT Technician</SelectItem>
                  <SelectItem value="Support Staff">Support Staff</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="accessCode" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Secure Access Code
                </Label>
                <button
                  type="button"
                  onClick={handleGenerateNewCode}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3 animate-spin-hover" /> Generate New
                </button>
              </div>
              <div className="relative">
                <Input
                  id="accessCode"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  required
                  className="font-mono font-bold tracking-widest text-indigo-700 bg-indigo-50/50 rounded-xl border-indigo-200 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Assigned Grades Checkboxes */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Assigned Grades ({selectedGrades.length} selected)
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-100">
              {AVAILABLE_GRADES.map((grade) => {
                const isChecked = selectedGrades.includes(grade);
                return (
                  <label
                    key={grade}
                    onClick={() => handleGradeToggle(grade)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer text-xs font-medium transition-all select-none ${
                      isChecked 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleGradeToggle(grade)}
                      className="hidden" // custom visual pill styling
                    />
                    <div className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border ${isChecked ? 'border-white bg-white/20' : 'border-slate-300'}`}>
                      {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className="truncate">{grade}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Assigned Streams Checkboxes */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Assigned Streams ({selectedStreams.length} selected)
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {AVAILABLE_STREAMS.map((stream) => {
                const isChecked = selectedStreams.includes(stream);
                return (
                  <label
                    key={stream}
                    onClick={() => handleStreamToggle(stream)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer text-xs font-medium transition-all select-none ${
                      isChecked 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleStreamToggle(stream)}
                      className="hidden"
                    />
                    <div className={`w-3.5 h-3.5 rounded-md flex items-center justify-center border ${isChecked ? 'border-white bg-white/20' : 'border-slate-300'}`}>
                      {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className="truncate">{stream}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-slate-200 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 font-bold px-6"
            >
              Register Staff Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
