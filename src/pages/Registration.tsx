<Card className="border-none shadow-sm rounded-2xl bg-white mb-6">
  <CardHeader>
    <CardTitle>Basic Information</CardTitle>
  </CardHeader>
  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="space-y-2">
      <Label htmlFor="fullname">Full Name</Label>
      <Input 
        id="fullname" 
        name="fullName" 
        value={formData.fullName} 
        onChange={handleChange} 
        placeholder="Enter full name" 
        className="rounded-xl h-12 bg-slate-50 border-none font-bold" 
        required
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="assessment">Assessment Number (KNEC)</Label>
      <Input 
        id="assessment" 
        name="assessment" 
        value={formData.assessment} 
        onChange={handleChange} 
        placeholder="e.g. 1002003004" 
        className="rounded-xl h-12 bg-slate-50 border-none" 
        required
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="grade">Grade Level</Label>
      <Select 
        id="grade" 
        name="grade" 
        value={formData.grade} 
        onChange={handleChange}
        required
      >
        <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
          <SelectValue placeholder="Select grade" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {/* Dynamically generate grade options from GRADES_DATA plus PP1 and PP2 */}
          <SelectItem value="PP1">PP1</SelectItem>
          <SelectItem value="PP2">PP2</SelectItem>
          {GRADES_DATA.map(g => (
            <SelectItem 
              key={g.id} 
              value={g.name.replace(/[^0-9]/g, '') || g.name 
            >
              {g.name}
            </SelectItem>
          ))}
          <SelectItem value="Grade 9">Grade 9</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label htmlFor="stream">Stream</Label>
      <Select 
        id="stream" 
        name="stream" 
        value={formData.stream} 
        onChange={handleChange}
      >
        <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none">
          <SelectValue placeholder="Select stream" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {streams.map(stream => (
            <SelectItem key={stream} value={stream}>
              {stream}
            </SelectItem>
          ))}
        </SelectContent>
      </div>
    </div>
  );