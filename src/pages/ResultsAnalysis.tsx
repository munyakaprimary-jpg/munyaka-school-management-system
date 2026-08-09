<Select value={examType} onValueChange={setExamType}>
                <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {DEFAULT_EXAM_TYPES.map(e => <SelectItem key={e.id} value={e.code}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Term</label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none font-bold text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="term1">Term 1</SelectItem>
                  <SelectItem value="term2">Term 2</SelectItem>
                  <SelectItem value="term3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Search Student</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  placeholder="Name / ID..." 
                  className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ResultsAnalysis;