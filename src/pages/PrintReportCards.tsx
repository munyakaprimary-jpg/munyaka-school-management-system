"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import ReportCardLayoutSwitcher from "@/components/ReportCardLayoutSwitcher";

interface GradeBand {
  id: number;
  name: string;
  grade_range: string;
}

interface StudentMark {
  learning_area: string;
  score: number;
  performance_level: string;
}

const PrintReportCards = () => {
  const [gradeBand, setGradeBand] = useState<string>("");
  const [stream, setStream] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGradeBands = async () => {
      const { data, error } = await supabase
        .from('grade_bands')
        .select('id, name, grade_range');
      if (!error) {
        setGradeBands(data || []);
      }
    };
    fetchGradeBands();
  }, []);

  const [gradeBands, setGradeBands] = useState<GradeBand[]>([]);

  const handlePrint = async () => {
    if (!gradeBand && !stream) {
      toast({
        title: "Select Criteria",
        description: "Please select a grade band or stream",
      });
      return;
    }

    setIsGenerating(true);
    try {
      let query = supabase.from('students').select(`
        id,
        name,
        assessment_number,
        stream,
        current_grade,
        grade_band_id,
        grade_bands:grade_band_id(name),
        student_marks!inner(learning_area_id, score, performance_level)
      `).order('name');

      if (gradeBand) {
        query = query.eq('grade_band_id', parseInt(gradeBand));
      }
      if (stream) {
        query = query.eq('stream', stream);
      }

      const { data, error } = await query;

      if (error) throw error;

      const processed = data?.map(student => {
        const studentMarks = student.student_marks || [];
        return {
          ...student,
          student_marks: studentMarks,
          gradeBandName: student.grade_bands || ''
        };
      }) || [];

      setReportData(processed);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to generate report data",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const printablePages = useMemo(() => {
    if (!reportData.length) return [];

    return reportData.map((student, index) => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return null;

      const gradeBand = student.gradeBandName || '';
      const isLowerPrimary = gradeBand === 'Lower Primary';
      const isUpperOrJunior = gradeBand === 'Upper Primary' || gradeBand === 'Junior School';

      let layoutHTML = '';

      if (isLowerPrimary) {
        layoutHTML = `
          <div className="report-card lower-primary">
            <h1 className="text-2xl font-bold text-slate-900">Report Card</h1>
            <div className="grid grid-cols-2 gap-4 mt-4">
              ${student.student_marks?.map(ma => (
                <div key={ma.learning_area} className="p-3 border rounded">
                  <div className="font-bold text-slate-800">${ma.learning_area}</div>
                  <div className="text-2xl font-bold text-slate-900">
                    ${ma.score}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    ${ma.performance_level}
                  </div>
                </div>
              ))}
            </div>
          </div>
        `;
      } else {
        layoutHTML = `
          <div className="report-card upper-primary-junior">
            <h1 className="text-2xl font-bold text-slate-900">Report Card</h1>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="text-right font-bold">Name:</div>
              <div className="font-bold">${student.name}</div>
              <div className="text-right font-bold">Assessment #:</div>
              <div className="font-bold">${student.assessment_number}</div>
              <div className="text-right font-bold">Stream:</div>
              <div className="font-bold">${student.stream}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              ${student.student_marks?.map(ma => (
                <div key={ma.learning_area} className="p-2 border rounded text-center">
                  <div className="font-bold">${ma.score}</div>
                  <div className="text-xs text-slate-500">${ma.learning_area}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 border-t">
              <div className="text-sm text-slate-500">
                Generated on {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        `;
      }

      return (
        <div className="printable-page">
          {layoutHTML}
        </div>
      );
    });
  }, [reportData]);

  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const pages = printablePages.map(page => page.outerHTML).join('');
    printWindow.document.write(`<html><head>
      <style>
        @media print {
          .printable-page { page-break-after: always; }
        }
        body { font-family: sans-serif; }
      </style>
    </head><body>${printablePages.map(page => page.outerHTML).join('')}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Print Report Cards</h1>
          <p className="text-sm text-slate-500">Generate and print report cards for specific grade bands or streams.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setIsGenerating(false)}>Cancel</Button>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white">
        <CardHeader className="p-8">
          <CardTitle>Select Filter</CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Grade Band</Label>
            <Select>
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue placeholder="Select Grade Band" />
              </SelectTrigger>
              <SelectContent>
                {gradeBands.map(gb => (
                  <SelectItem key={gb.id} value={gb.name}>
                    {gb.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Stream</Label>
            <Select>
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue placeholder="Select Stream" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Blue">Blue</SelectItem>
                <SelectItem value="Green">Green</SelectItem>
                <SelectItem value="Alpha">Alpha</SelectItem>
                <SelectItem value="Beta">Beta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-4">
        <Button 
          onClick={handlePrint} 
          disabled={isGenerating}
          className="rounded-2xl px-10 h-12 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              Generating...
            </>
          ) : (
            <>
              <Printer size={18} className="mr-2" />
              Print Report Cards
            </>
          )}
        </Button>
      </div>

      {isGenerating ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent border-b-transparent border-l-transparent border-r-transparent"></div>
        </div>
      ) : (
        <div>
          <Card className="border-none shadow-sm rounded-3xl bg-white">
            <CardHeader className="p-8">
              <CardTitle>Print Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {printablePages.map((page, index) => (
                <div key={index} className="printable-page p-4 border rounded">
                  {/* Content will be injected here */}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <Button 
          onClick={handlePrintAll}
          className="rounded-2xl px-10 h-14 font-bold shadow-xl shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700"
        >
          Send to Printer
        </Button>
      </div>
    </div>
  );
};

export default PrintReportCards;