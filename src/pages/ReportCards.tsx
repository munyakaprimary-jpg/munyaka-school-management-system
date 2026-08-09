{/* Filters & Info Section */}
      <div className="flex flex-col lg:flex-row gap-8 items-start no-print">
        {/* Left Side: Filters Stack */}
        <div className="w-full lg:w-72 space-y-6">
          <div className="space-y-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Academic Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="rounded-xl h-10 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="2026">2026</SelectItem><SelectItem value="2025">2025</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Grade Level</Label>
              <Select value={grade} onValueChange={setGrade} disabled={isLoading}>
                <SelectTrigger className="rounded-xl h-10 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {isLoading ? (
                    <SelectItem disabled value="">Loading grades...</SelectItem>
                  ) : sortedGrades.length === 0 ? (
                    <SelectItem disabled value="">No grades configured</SelectItem>
                  ) : (
                    sortedGrades.map(g => (
                      <SelectItem key={g.id} value={g.name.replace(/[^0-9]/g, '') || g.name}>
                        {g.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Stream</Label>
              <Select value={stream} onValueChange={setStream}>
                <SelectTrigger className="rounded-xl h-10 border-slate-200">
                  <SelectValue placeholder="All Streams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Streams</SelectItem>
                  {availableStreams.length > 0 ? (
                    availableStreams.map(s => (
                      <SelectItem key={s.name} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled value="none">
                      No streams found in Grades & Streams
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Active Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger className="rounded-xl h-10 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="term1">Term 1</SelectItem><SelectItem value="term2">Term 2</SelectItem><SelectItem value="term3">Term 3</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml_1">Exam Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="rounded-xl h-10 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="opener">Opener</SelectItem><SelectItem value="midterm">Midterm</SelectItem><SelectItem value="endterm">Endterm</SelectItem></SelectContent>
              </Select>
            </div>

            {/* Dynamic Term Calendar Dates Settings */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar size={12} className="text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900">Term Calendar Dates</span>
              </div>
              
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 ml-1">Closing Date</Label>
                <Input 
                  type="date"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  className="h-9 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-500 ml-1">Next Term Opening Date</Label>
                <Input 
                  type="date"
                  value={openingDate}
                  onChange={(e) => setOpeningDate(e.target.value)}
                  className="h-9 rounded-xl bg-slate-50 border-slate-200 text-xs font-bold"
                />
              </div>
            </div>

            <div className="pt-2 space-y-1">
              <Label className="text-[10px] font-black uppercase text-indigo-600 ml-1">Search Individual Learner</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input 
                  placeholder="Type Learner Name / ULI..." 
                  className="pl-9 h-10 rounded-xl bg-slate-50 border-indigo-200 text-xs font-bold focus:bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Page Info */}
        <div className="flex-1 space-y-2">
          <p className="text-slate-500 text-sm font-medium">
            {searchTerm.trim() 
              ? `Filtered individual search: Previewing ${filteredStudents.length} report card(s) for "${searchTerm}". Click "Download Current" to download.` 
              : `Previewing ${filteredStudents.length} report cards for Grade ${grade} (${year}). Type a learner's name in the search box to download an individual report.`}
          </p>
        </div>
      </div>