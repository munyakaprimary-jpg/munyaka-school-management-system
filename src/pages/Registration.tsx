import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { X } from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import { GRADES_DATA } from '@/lib/mock-data';

const Registration = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Dynamically extract grade levels from GRADES_DATA (PP1, PP2, Grade 1-9)
  const gradeLevels = GRADES_DATA.map(g => g.name);

  // Dynamically extract unique streams from all grades
  const streams = GRADES_DATA.reduce((acc, grade) => {
    grade.streams.forEach(stream => {
      if (!acc.includes(stream.name)) {
        acc.push(stream.name);
      }
    });
    return acc;
  }, [] as string[]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Success",
      description: "Student has been registered successfully.",
    });
    navigate('/students');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton to="/students" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Registration</h1>
            <p className="text-muted-foreground">Register new students for the current academic year.</p>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="rounded-xl gap-2 text-slate-600 border-slate-200"
          onClick={() => navigate('/students')}
        >
          <X size={16} /> Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-none shadow-sm rounded-2xl bg-white mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullname">Full Name</Label>
              <Input id="fullname" placeholder="e.g. John Doe" required className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assessment">Assessment Number (KNEC)</Label>
              <Input id="assessment" placeholder="e.g. 1002003004" required className="rounded-xl h-12 uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Grade Level</Label>
              <Select required>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select Grade Level" />
                </SelectTrigger>
                <SelectContent>
                  {gradeLevels.map(grade => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stream</Label>
              <Select required>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select Stream" />
                </SelectTrigger>
                <SelectContent>
                  {streams.map(stream => (
                    <SelectItem key={stream} value={stream}>{stream}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white">
          <CardHeader>
            <CardTitle>Guardian Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="guardian">Guardian Name</Label>
              <Input id="guardian" placeholder="Full name" required className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="e.g. 0712345678" required className="rounded-xl h-12" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Physical Address/Location</Label>
              <Input id="address" placeholder="e.g. Eldoret West" className="rounded-xl h-12" />
            </div>
          </CardContent>
          <div className="p-6 pt-0 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              className="rounded-xl font-bold px-6"
              onClick={() => navigate('/students')}
            >
              Cancel
            </Button>
            <Button type="submit" size="lg" className="rounded-xl px-8 h-14 bg-indigo-600 shadow-xl shadow-indigo-100">
              Register Student
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default Registration;