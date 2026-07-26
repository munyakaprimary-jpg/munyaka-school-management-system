"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mpesa, Bank, Download, Plus, Warning } from 'lucide-react';
import { showSuccess } from "@/utils/toast";
import { FEES_DATA, TRANSACTIONS } from "@/lib/mock-data";

const Fees = () => {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("M-Pesa");
  const [amount, setAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRecordPayment = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsProcessing(false);
    showSuccess(`Payment of ${amount} via ${paymentMethod} recorded!`);
  };

  const handleGenerateReport = () => {
    showSuccess('Fee report generated successfully!');
  };

  const students = FEES_DATA.map(student => ({
    id: student.id,
    name: student.student,
    total: student.total,
    paid: student.paid,
    status: student.status
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Fees & Finance</h1>
          <p className="text-muted-foreground">Manage student fees, track payments, and generate financial reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl border-slate-200 bg-white shadow-sm"
            onClick={() => showSuccess('Student added!')}
          >
            <Plus size={18} className="mr-2 text-slate-500" />
            Add Student
          </Button>
          <Button 
            className="rounded-xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700"
            onClick={handleGenerateReport}
          >
            <Download size={18} className="mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-1 border-none shadow-sm rounded-3xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Student List</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Student Name</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Total Fees</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Paid</TableHead>
                  <TableHead className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-slate-900">
                      <span className="font-bold text-slate-900">{student.name}</span>
                    </TableCell>
                    <TableCell className="text-slate-600">{student.total}</TableCell>
                    <TableCell className="text-slate-600">{student.paid}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'Cleared' ? 'default' : student.status === 'Partial' ? 'secondary' : 'destructive'} className="bg-emerald-50 text-emerald-700">
                        {student.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 border-none shadow-sm rounded-3xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Record Payment</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-slate-700">Student</label>
                <Select>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-slate-700">Payment Method</label>
                <Select>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                    <SelectItem value="Bank">Bank Deposit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-slate-700">Amount (KES)</label>
                <Input 
                  type="number" 
                  placeholder="Enter amount" 
                  value={amount} 
                  onChange={(e) => setAmount(parseFloat(e.target.value))} 
                  className="rounded-xl h-12"
                />
              </div>
              <div className="flex items-center gap-4 pt-4 border-t">
                <Button 
                  size="lg" 
                  className="rounded-xl px-12 shadow-lg shadow-indigo-100" 
                  onClick={handleRecordPayment}
                  disabled={isProcessing || !selectedStudent || amount <= 0}
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin mr-2">⌛</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Mpesa size={18} className="mr-2" />
                      Record Payment
                    </>
                  )}
                </Button>
                <Button variant="outline" className="rounded-xl px-8">Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Fee Statements</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-slate-700">Student</label>
                <Select>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-slate-700">Date Range</label>
                <Select>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline" 
                className="rounded-xl px-12"
                onClick={() => showSuccess('Statement generated!')}
              >
                <Download size={18} className="mr-2" />
                Generate Statement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Fees;