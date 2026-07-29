export interface Artifact {
  id: string;
  student: string;
  title: string;
  type: 'Image' | 'Audio' | 'Document' | 'Video';
  learningArea: string;
  date: string;
  grade: 'EE' | 'ME' | 'AE' | 'BE';
  description?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: string;
}

export const getGradeBadgeClass = (gradeLevel: Artifact['grade']) => {
  switch (gradeLevel) {
    case 'EE': return "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50";
    case 'ME': return "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50";
    case 'AE': return "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50";
    default: return "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-50";
  }
};