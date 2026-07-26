import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

const Assessments = () => {
  const performanceLevels = [
    { code: "EE", label: "Exceeding Expectation", color: "bg-emerald-100 text-emerald-700" },
    { code: "ME", label: "Meeting Expectation", color: "bg-blue-100 text-blue-700" },
    { code: "AE", label: "Approaching Expectation", color: "bg-amber-100 text-amber-700" },
    { code: "BE", label: "Below Expectation", color: "bg-red-100 text-red-700" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CBC Marksheet</h1>
        <p className="text-muted-foreground">Grade students based on specific learning outcomes.</p>
      </div>

      <Card className="border-none bg-blue-50/50 shadow-none rounded-2xl overflow-hidden border border-blue-100">
        <CardContent className="p-4 flex items-center gap-4">
          <Info className="text-blue-600 shrink-0" size={20} />
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Legend:</span>
            {performanceLevels.map(lvl => (
              <div key={lvl.code} className="flex items-center gap-2">
                <Badge className={`${lvl.color} font-bold shadow-none`}>{lvl.code}</Badge>
                <span className="text-[11px] font-medium text-slate-600">{lvl.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select defaultValue="math">
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Learning Area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="math">Mathematics</SelectItem>
            <SelectItem value="english">English Language</SelectItem>
            <SelectItem value="kiswahili">Kiswahili</SelectItem>
            <SelectItem value="science">Science & Tech</SelectItem>
            <SelectItem value="custom">Custom Subject...</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="formative">
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Assessment Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="formative">Formative (Task-based)</SelectItem>
            <SelectItem value="summative">Summative (End of Term)</SelectItem>
            <SelectItem value="project">Project / Portfolio</SelectItem>
            <SelectItem value="custom">Custom Assessment...</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Search Assessment Task..." className="rounded-xl" />
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Student</th>
                <th className="px-6 py-4 font-medium">Numbers & Algebra</th>
                <th className="px-6 py-4 font-medium">Geometry</th>
                <th className="px-6 py-4 font-medium">Teacher's Comment</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                { name: "Brian Kiptoo" },
                { name: "Mary Atieno" },
                { name: "Emmanuel Maina" },
              ].map((s, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 font-bold">{s.name}</td>
                  <td className="px-6 py-4">
                    <Select defaultValue="ME">
                      <SelectTrigger className="w-[80px] h-8 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {performanceLevels.map(lvl => (
                          <SelectItem key={lvl.code} value={lvl.code}>{lvl.code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4">
                    <Select defaultValue="EE">
                      <SelectTrigger className="w-[80px] h-8 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {performanceLevels.map(lvl => (
                          <SelectItem key={lvl.code} value={lvl.code}>{lvl.code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4">
                    <Input className="h-8 rounded-lg text-xs" placeholder="e.g. Consistent effort" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" className="rounded-xl px-12">Submit Marks</Button>
      </div>
    </div>
  );
};

export default Assessments;