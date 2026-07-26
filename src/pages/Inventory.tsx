"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, RefreshCw, Search, Filter, Plus, AlertCircle } from 'lucide-react';
import { showSuccess } from "@/utils/toast";
import { INVENTORY, ASSET_LOGS } from "@/lib/mock-data";

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredInventory = INVENTORY.filter(item => 
    item.item.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === 'all' || item.category === selectedCategory)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tools & Inventory</h1>
          <p className="text-muted-foreground">Manage school assets, equipment, and inventory levels.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl border-slate-200 gap-2" onClick={() => showSuccess('Inventory synced!')}>
            <RefreshCw size={18} />
            Sync Inventory
          </Button>
          <Button className="rounded-2xl shadow-lg shadow-emerald-100 bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => showSuccess('Asset added!')}>
            <Plus size={18} />
            Add New Asset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Items</p>
              <h3 className="text-2xl font-bold text-slate-900">{INVENTORY.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available</p>
              <h3 className="text-2xl font-bold text-slate-900">89</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
              <h3 className="text-2xl font-bold text-slate-900">3</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Use</p>
              <h3 className="text-2xl font-bold text-slate-900">24</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Asset Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="Search items..." 
                  className="rounded-xl h-12 pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="rounded-xl h-12 w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Agriculture">Agriculture</SelectItem>
                  <SelectItem value="Science & Tech">Science & Tech</SelectItem>
                  <SelectItem value="Creative Arts">Creative Arts</SelectItem>
                  <SelectItem value="Library">Library</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-slate-500">
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Item</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Category</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Quantity</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-900">{item.item}</TableCell>
                      <TableCell className="text-slate-600">{item.category}</TableCell>
                      <TableCell className="text-slate-600">{item.qty}</TableCell>
                      <TableCell>
                        <Badge className={item.status === 'Available' ? 'bg-emerald-50 text-emerald-700' : item.status === 'Low Stock' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Recent Asset Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-slate-500">
                  <TableHead className="font-bold uppercase text-[10px] tracking-wider">Item</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-wider">Issued To</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-wider">Date</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ASSET_LOGS.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-slate-900">{log.item}</TableCell>
                    <TableCell className="text-slate-600">{log.issuedTo}</TableCell>
                    <TableCell className="text-slate-600">{log.date}</TableCell>
                    <TableCell>
                      <Badge className={log.status === 'In Use' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}>
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;