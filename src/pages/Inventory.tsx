"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Package, Box, RefreshCw, MoreVertical } from 'lucide-react';
import { INVENTORY } from '@/lib/mock-data';

const Inventory = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tools & Resources</h1>
          <p className="text-muted-foreground">Manage school assets, CBC learning materials, and kits.</p>
        </div>
        <Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-emerald-100 bg-emerald-600 hover:bg-emerald-700">
          <Package size={18} /> Add New Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input placeholder="Search assets by name or category..." className="pl-12 h-14 rounded-3xl border-none shadow-sm bg-white" />
        </div>
        <Button variant="outline" className="h-14 px-6 rounded-3xl border-none shadow-sm bg-white gap-2 text-slate-600 font-bold">
          <RefreshCw size={18} /> Sync Inventory
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {INVENTORY.map((item) => (
          <Card key={item.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white group overflow-hidden">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center ${item.color}`}>
                  <Box size={28} />
                </div>
                <Button variant="ghost" size="icon" className="rounded-full text-slate-300">
                  <MoreVertical size={18} />
                </Button>
              </div>
              <div className="space-y-1 mb-6">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{item.item}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.category}</p>
              </div>
              <div className="flex items-end justify-between pt-6 border-t border-slate-50">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Stock</p>
                  <p className="text-2xl font-black text-slate-900">{item.qty}</p>
                </div>
                <Badge className={
                  item.status === 'Available' ? "bg-emerald-50 text-emerald-600 border-none px-3" :
                  item.status === 'Low Stock' ? "bg-amber-50 text-amber-600 border-none px-3" :
                  "bg-blue-50 text-blue-600 border-none px-3"
                }>
                  {item.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Inventory;