import React, { useState } from 'react';

const GRADES = ['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
const STREAMS = ['Green', 'Blue', 'Red', 'Gold', 'East', 'West'];

export default function ReportCards() {
  const [selectedGrade, setSelectedGrade] = useState('Grade 6');
  const [selectedStream, setSelectedStream] = useState('Green');
  const [selectedStudentName, setSelectedStudentName] = useState('NICOLE WAITHIRA MUHORO');

  const handleDownloadReport = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>CBC Report Card</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #111; max-width: 800px; margin: auto; line-height: 1.5; }
            .header { text-align: center; border-bottom: 3px solid #111; padding-bottom: 15px; margin-bottom: 25px; }
            .school { font-size: 22px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
            .address { font-size: 13px; margin-bottom: 2px; }
            .motto { font-size: 13px; font-style: italic; margin-bottom: 10px; }
            .title { font-size: 14px; font-weight: bold; text-transform: uppercase; background: #e2e8f0; padding: 6px; margin-top: 10px; }
            
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .info-table td { padding: 8px 12px; border: 1px solid #94a3b8; font-size: 13px; width: 50%; }
            
            .marks-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .marks-table th, .marks-table td { border: 1px solid #94a3b8; padding: 8px 12px; text-align: left; font-size: 13px; }
            .marks-table th { background-color: #f1f5f9; font-weight: bold; }
            
            .remarks { border: 1px solid #94a3b8; padding: 12px; margin-bottom: 30px; font-size: 13px; background: #f8fafc; }
            .footer { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school">Munyaka Primary and Junior School</div>
            <div class="address">P.O. BOX 5239-30100, ELDORET</div>
            <div class="motto">MOTTO: Knowledge is Power</div>
            <div class="title">Competency Based Curriculum Progress Report — Term 1, 2026</div>
          </div>

          <table class="info-table">
            <tr>
              <td><strong>Learner Name:</strong> ${selectedStudentName}</td>
              <td><strong>Assessment No:</strong> B004991382</td>
            </tr>
            <tr>
              <td><strong>Grade / Stream:</strong> ${selectedGrade} — ${selectedStream}</td>
              <td><strong>Overall Rank:</strong> 1 of 8</td>
            </tr>
          </table>

          <table class="marks-table">
            <thead>
              <tr>
                <th>Subject / Learning Area</th>
                <th>Mid Term</th>
                <th>End Term</th>
                <th>Average</th>
                <th>Rubric</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>English</td><td>78</td><td>82</td><td>80</td><td>EE</td></tr>
              <tr><td>Kiswahili</td><td>74</td><td>76</td><td>75</td><td>ME</td></tr>
              <tr><td>Mathematics</td><td>85</td><td>88</td><td>86.5</td><td>EE</td></tr>
              <tr><td>Science & Tech</td><td>80</td><td>82</td><td>81</td><td>EE</td></tr>
              <tr><td>Social Studies</td><td>72</td><td>75</td><td>73.5</td><td>ME</td></tr>
              <tr><td>Agriculture & Nutrition</td><td>76</td><td>78</td><td>77</td><td>ME</td></tr>
              <tr><td>Creative Arts</td><td>82</td><td>85</td><td>83.5</td><td>EE</td></tr>
              <tr><td>Religious Education</td><td>80</td><td>84</td><td>82</td><td>EE</td></tr>
            </tbody>
          </table>

          <div class="remarks">
            <strong>Class Teacher Remarks:</strong> Excellent performance and strong grasp of core concepts. Very disciplined learner. Maintain the same effort in Term 2.
          </div>

          <div class="footer">
            <div>Class Teacher Sign: .......................................</div>
            <div>Headteacher Sign & Stamp: .......................................</div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CBC_Report_${selectedStudentName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold text-slate-800">CBC Report Card Generator</h2>
      <p className="text-sm text-slate-600">Export clean, structured individual assessment report cards for your learners.</p>
      
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Select Grade</label>
            <select 
              value={selectedGrade} 
              onChange={(e) => setSelectedGrade(e.target.value)} 
              className="w-full p-2.5 border rounded-lg bg-white text-slate-800 font-medium"
            >
              {GRADES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Select Stream</label>
            <select 
              value={selectedStream} 
              onChange={(e) => setSelectedStream(e.target.value)} 
              className="w-full p-2.5 border rounded-lg bg-white text-slate-800 font-medium"
            >
              {STREAMS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Learner Name</label>
          <input 
            type="text" 
            value={selectedStudentName} 
            onChange={(e) => setSelectedStudentName(e.target.value)} 
            className="w-full p-2.5 border rounded-lg text-slate-800 font-medium" 
          />
        </div>

        <button 
          onClick={handleDownloadReport}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Download Clean Report Card
        </button>
      </div>
    </div>
  );
}
