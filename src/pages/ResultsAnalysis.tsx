...
              <tbody className="divide-y divide-slate-100">
                {studentResults.length > 0 ? (
                  studentResults.map((student) => (
                    <tr key={student.studentId} className="hover:bg-slate-50 transition-colors group">
                      <td className="sticky left-0 bg-white group-hover:bg-slate-50 z-10 px-6 py-4 font-black text-center border-r text-slate-900">
                        #{student.rank}
                      </td>
                      <td className="sticky left-16 bg-white group-hover:bg-slate-50 z-10 px-6 py-4 border-r">
                        <p className="font-bold text-slate-900">{student.name}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tight">Admin No: {student.assessmentNo}</p>
                      </td>
                      {selectedStreamId === "all" && (
                        <td className="px-4 py-4 text-center font-bold text-slate-600 border-r">
                          <Badge variant="outline" className="rounded-lg border-slate-200 text-xs">
                            {student.stream}
                          </Badge>
                        </td>
                      )}
                      {learningAreas.map(area => (
                        <td key={area.id} className="px-3 py-4 border-r text-center font-bold text-slate-700">
                          {student.scores[area.id] !== undefined ? student.scores[area.id] : "—"}
                        </td>
                      ))}
                      <td className="px-4 py-4 text-center bg-indigo-50/20 font-black text-indigo-900">
                        {student.totalMarks}
                      </td>
                      <td className="px-4 py-4 text-center bg-indigo-50/20 font-black text-indigo-700 text-base">
                        {student.meanScore}%
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge className={cn("font-black rounded-lg border-none text-xs px-2.5 py-0.5", 
                          student.level === 'EE' ? "bg-emerald-50 text-emerald-700" :
                          student.level === 'ME' ? "bg-blue-50 text-blue-700" :
                          student.level === 'AE' ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                        )}>
                          {student.level}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={learningAreas.length + 5} className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Search size={36} className="text-slate-200" />
                        <p className="text-slate-500 font-bold">No student result records found for the selected Grade and Stream filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Official Footer Notice (Visible ONLY on Print) */}
      <div className="hidden print:block text-center pt-8 border-t border-slate-300 text-xs text-slate-500 space-y-2">
        <div className="flex justify-between px-12 pt-6 pb-12 font-bold text-slate-800">
          <div>
            <p>Class Teacher Signature: .......................................</p>
            <p className="text-[9px] text-slate-400 font-normal mt-1">Date: {new Date().toLocaleDateString()}</p>
          </div>
          <div>
            <p>Headteacher Stamp & Sign: .......................................</p>
            <p className="text-[9px] text-slate-400 font-normal mt-1">Official Seal</p>
          </div>
        </div>
        <p>This is an official computer-generated Results Analysis Report for Munyaka Primary and Junior School.</p>
      </div>

    </div>
  );
};

export default ResultsAnalysis;