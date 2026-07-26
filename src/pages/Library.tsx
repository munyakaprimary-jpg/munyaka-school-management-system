"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Search, Filter, Plus, Download, Users, Book } from 'lucide-react';
import { showSuccess } from "@/utils/toast";
import { BOOKS } from "@/lib/mock-data";

const Library = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredBooks = BOOKS.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === 'all' || book.category === selectedCategory)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Library & E-Resources</h1>
          <p className="text-muted-foreground">Browse books, manage circulation, and access digital resources.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl border-slate-200 gap-2" onClick={() => showSuccess('Catalog exported!')}>
            <Download size={18} />
            Export Catalog
          </Button>
          <Button className="rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => showSuccess('Book registered!')}>
            <Plus size={18} />
            Register New Book
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Books</p>
              <h3 className="text-2xl font-bold text-slate-900">{BOOKS.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Book size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available</p>
              <h3 className="text-2xl font-bold text-slate-900">182</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Borrowed</p>
              <h3 className="text-2xl font-bold text-slate-900">295</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Categories</p>
              <h3 className="text-2xl font-bold text-slate-900">4</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Book Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="Search books..." 
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
                  <SelectItem value="Core Text">Core Text</SelectItem>
                  <SelectItem value="Reference">Reference</SelectItem>
                  <SelectItem value="Supplementary">Supplementary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-slate-500">
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Title</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Author</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Category</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Stock</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooks.map((book) => (
                    <TableRow key={book.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-900">{book.title}</TableCell>
                      <TableCell className="text-slate-600">{book.author}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700">
                          {book.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {book.stock} ({book.borrowed} borrowed)
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={book.borrowed >= book.stock ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}>
                          {book.borrowed >= book.stock ? 'Out of Stock' : 'Available'}
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
    </div>
  );
};

export default Library;