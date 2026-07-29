"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from 'lucide-react';
import { cn } from "@/lib/utils";
import { showSuccess } from '@/utils/toast';
import PromoteStudentsModal from '@/components/ui/PromoteStudentsModal';

// Modular Components
import PromotionHeader from '@/components/promote/PromotionHeader';
import WarningBanner from '@/components/promote/WarningBanner';
import PromotionStats from '@/components/promote/PromotionStats';
import PromotionFilters from '@/components/promote/PromotionFilters';
import PromotionPreviewTable, { StudentPreview } from '@/components/promote/PromotionPreviewTable';
import PromotionHistoryTable, { PromotionRecord } from '@/components/promote/PromotionHistoryTable';
import SuccessMessage from '@/components/promote/SuccessMessage';

// Types
interface Student {
  id: string;
  name: string;
  grade: string;
  stream: string;
  status: 'Active' | 'Graduated' | 'Archived';
}

// Mock data for students
const MOCK_STUDENTS: Student[] = [
  { id: "1", name: "Brian Kiptoo", grade: "Grade 6", stream: "Blue", status: "Active" },
  { id: "2", name: "Mary Atieno", grade: "Grade 6", stream: "Blue", status: "Active" },
  { id: "3", name: "Emmanuel Maina", grade: "Grade 6", stream: "Green", status: "Active" },
  { id: "4", name: "Sheila Chepkoech", grade: "Grade 5", stream: "Alpha", status: "Active" },
  { id: "5", name: "David Mutua", grade: "Grade 5", stream: "Alpha", status: "Active" },
  { id: "6", name: "Grace Wanjiku", grade: "Grade 4", stream: "Beta", status: "Active" },
  { id: "7", name: "Joseph Kariuki", grade: "Grade 4", stream: "Beta", status: "Active" },
  { id: "8", name: "Faith Njeri", grade: "Grade 3", stream: "Alpha", status: "Active" },
  { id: "9", name: "George Ochieng", grade: "Grade 3", stream: "Beta", status: "Active" },
  { id: "10", name: "Helen Moraa", grade: "Grade 2", stream: "Alpha", status: "Active" },
  { id: "11", name: "Samuel Kamau", grade: "Grade 2", stream: "Beta", status: "Active" },
  { id: "12", name: "Winnie Achieng", grade: "Grade 1", stream: "Blue", status: "Active" },
  { id: "13", name: "Peter Odhiambo", grade: "Grade 1", stream: "Green", status: "Active" },
  { id: "14", name: "Jane Mwangi", grade: "Grade PP2", stream: "Yellow", status: "Active" },
  { id: "15", name: "David Maina", grade: "Grade PP1", stream: "Yellow", status: "Active" },
];

const MOCK_STATS = {
  totalStudents: 15,
  activeStudents: 15,
  graduatedStudents: 0,
  studentsByGrade: [
    { grade: "Grade PP1", count: 1 },
    { grade: "Grade PP2", count: 1 },
    { grade: "Grade 1", count: 2 },
    { grade: "Grade 2", count: 2 },
    { grade: "Grade 3", count: 2 },
    { grade: "Grade 4", count: 2 },
    { grade: "Grade 5", count: 2 },
    { grade: "Grade 6", count: 2 },
  ],
  studentsByStream: [
    { stream: "Blue", count: 3 },
    { stream: "Green", count: 2 },
    { stream: "Alpha", count: 3 },
    { stream: "Beta", count: 2 },
    { stream: "Yellow", count: 2 },
  ]
};

const Promote = () => {
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStream, setFilterStream] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [promotionHistory, setPromotionHistory] = useState<PromotionRecord[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = !filterGrade || student.grade === filterGrade;
    const matchesStream = !filterStream || student.stream === filterStream;
    const matchesStatus = !filterStatus || student.status === filterStatus;
    return matchesSearch && matchesGrade && matchesStream && matchesStatus;
  });

  // Helper functions
  const getNextGrade = (currentGrade: string): string => {
    const gradeMatch = currentGrade.match(/Grade (\d+)/);
    if (gradeMatch) {
      const currentNum = parseInt(gradeMatch[1]);
      return `Grade ${currentNum + 1}`;
    }
    if (currentGrade === "Grade PP2") return "Grade 1";
    if (currentGrade === "Grade PP1") return "Grade PP2";
    return currentGrade;
  };

  const isHighestGrade = (grade: string, highestGrade: string): boolean => {
    const gradeMatch = grade.match(/Grade (\d+)/);
    const highestMatch = highestGrade.match(/Grade (\d+)/);
    
    if (gradeMatch && highestMatch) {
      const currentNum = parseInt(gradeMatch[1]);
      const highestNum = parseInt(highestMatch[1]);
      return currentNum >= highestNum;
    }
    return false;
  };

  const getHighestGrade = (): string => {
    const maxGrade = Math.max(...students.map(s => {
      const match = s.grade.match(/Grade (\d+)/);
      return match ? parseInt(match[1]) : 0;
    }));
    return `Grade ${maxGrade}`;
  };

  // Generate promotion preview
  const getPromotionPreview = (): StudentPreview[] => {
    const highestGrade = getHighestGrade();
    return students.map(student => {
      const nextGrade = getNextGrade(student.grade);
      const isHighest = isHighestGrade(student.grade, highestGrade);
      return {
        ...student,
        nextGrade,
        isHighest,
        status: isHighest ? 'Graduated' : student.status
      };
    });
  };

  // Handle promotion execution
  const handlePromoteStudents = (promotedStudents: Student[]) => {
    setStudents(promotedStudents);
    
    // Add to promotion history
    const promotionRecord: PromotionRecord = {
      id: `PROM-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      promotedBy: "System Admin",
      totalPromoted: promotedStudents.length,
      newGrades: promotedStudents.map(s => ({
        student: s.name,
        from: s.grade,
        to: getNextGrade(s.grade)
      }))
    };
    
    setPromotionHistory([promotionRecord, ...promotionHistory]);
    setShowSuccessMessage(true);
    
    // Hide success message after 5 seconds
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  // Get promotion preview data
  const promotionPreview = getPromotionPreview();

  // Prepare stats data
  const statsData = {
    totalStudents: MOCK_STATS.totalStudents,
    activeStudents: MOCK_STATS.activeStudents,
    graduatedStudents: MOCK_STATS.graduatedStudents,
    highestGrade: getHighestGrade()
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Success Message */}
      <SuccessMessage visible={showSuccessMessage} />

      {/* Header */}
      <PromotionHeader onPromoteClick={() => setIsPromoteModalOpen(true)} />

      {/* Warning Banner */}
      <WarningBanner />

      {/* Tabs for Preview and History */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8">
          <TabsTrigger value="preview" className="rounded-xl px-8 h-full font-bold text-xs">Promotion Preview</TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl px-8 h-full font-bold text-xs">Promotion History</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-8">
          {/* Statistics Cards */}
          <PromotionStats stats={statsData} />

          {/* Filters */}
          <PromotionFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterGrade={filterGrade}
            onGradeChange={setFilterGrade}
            filterStream={filterStream}
            onStreamChange={setFilterStream}
            filterStatus={filterStatus}
            onStatusChange={setFilterStatus}
            grades={MOCK_STATS.studentsByGrade}
            streams={MOCK_STATS.studentsByStream}
          />

          {/* Promotion Preview Table */}
          <PromotionPreviewTable students={promotionPreview} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <PromotionHistoryTable history={promotionHistory} />
        </TabsContent>
      </Tabs>

      {/* Promote Students Modal */}
      <PromoteStudentsModal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        students={filteredStudents}
        onPromote={handlePromoteStudents}
        highestGrade={getHighestGrade()}
      />
    </div>
  );
};

export default Promote;
</dyad-write

I've successfully refactored the `src/pages/Promote.tsx` file into a more modular structure. Here's what I've done:

## Summary of Refactoring

### **New Modular Components Created:**

1. **`src/components/promote/PromotionStats.tsx`**
   - Statistics cards component with reusable `StatsCard` sub-component
   - Displays total students, active students, graduated, and highest grade

2. **`src/components/promote/PromotionPreviewTable.tsx`**
   - Promotion preview table with student data display
   - Shows current grade, next grade, stream, and status for each student

3. **`src/components/promote/PromotionHistoryTable.tsx`**
   - History table component for displaying past promotion records
   - Shows promotion ID, date, promoted by, and total promoted

4. **`src/components/promote/PromotionFilters.tsx`**
   - Filter component with search, grade, stream, and status filters
   - Reusable select dropdowns with proper typing

5. **`src/components/promote/WarningBanner.tsx`**
   - Warning banner component with critical action messaging
   - Displays safety information about the promotion process

6. **`src/components/promote/SuccessMessage.tsx`**
   - Success notification component
   - Shows when promotion is successfully executed

7. **`src/components/promote/PromotionHeader.tsx`**
   - Header component with back button and promote action button
   - Consistent styling with the rest of the application

### **Benefits of the Refactoring:**

1. **Separation of Concerns**: Each component has a single responsibility
2. **Reusability**: Components can be reused in other parts of the application
3. **Maintainability**: Easier to update individual components without affecting others
4. **Testability**: Smaller components are easier to test individually
5. **Readability**: The main page is now much cleaner and easier to understand
6. **Type Safety**: Proper TypeScript interfaces for all components

### **Main Page Improvements:**

- Reduced from ~500 lines to ~200 lines
- Clearer data flow and state management
- Better organization of logic and presentation
- Easier to extend with new features in the future

The refactored code maintains all the original functionality while being significantly more organized and maintainable.### **Additional Improvements:**

8. **Better Type Safety**: All components now have proper TypeScript interfaces
9. **Consistent Styling**: All components follow the same design patterns
10. **Performance**: Smaller components can be optimized independently

### **File Structure:**

```
src/
├── components/
│   ├── promote/
│   │   ├── PromotionStats.tsx
│   │   ├── PromotionPreviewTable.tsx
│   │   ├── PromotionHistoryTable.tsx
│   │   ├── PromotionFilters.tsx
│   │   ├── WarningBanner.tsx
│   │   ├── SuccessMessage.tsx
│   │   └── PromotionHeader.tsx
│   └── ui/
│       └── PromoteStudentsModal.tsx
└── pages/
    └── Promote.tsx
```

### **Key Changes in Main Page:**

1. **Cleaner Imports**: Only imports modular components
2. **Better State Management**: Clear separation of data and presentation
3. **Reduced Complexity**: Main page now focuses on orchestration
4. **Improved Readability**: Easy to understand the flow of data and components

The refactored code is now much more maintainable and follows React best practices for component composition. Each component can be developed, tested, and maintained independently, making the codebase more robust and easier to extend in the future.

<dyad-chat-summary>Refactored Promote.tsx into modular components for better maintainability and separation of concerns.</dyad-chat-summary><dyad-write path="src/pages/Promote.tsx" description="Refactored main Promote page using modular components">
"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from 'lucide-react';
import { cn } from "@/lib/utils";
import { showSuccess } from '@/utils/toast';
import PromoteStudentsModal from '@/components/ui/PromoteStudentsModal';

// Modular Components
import PromotionHeader from '@/components/promote/PromotionHeader';
import WarningBanner from '@/components/promote/WarningBanner';
import PromotionStats from '@/components/promote/PromotionStats';
import PromotionFilters from '@/components/promote/PromotionFilters';
import PromotionPreviewTable, { StudentPreview } from '@/components/promote/PromotionPreviewTable';
import PromotionHistoryTable, { PromotionRecord } from '@/components/promote/PromotionHistoryTable';
import SuccessMessage from '@/components/promote/SuccessMessage';

// Types
interface Student {
  id: string;
  name: string;
  grade: string;
  stream: string;
  status: 'Active' | 'Graduated' | 'Archived';
}

// Mock data for students
const MOCK_STUDENTS: Student[] = [
  { id: "1", name: "Brian Kiptoo", grade: "Grade 6", stream: "Blue", status: "Active" },
  { id: "2", name: "Mary Atieno", grade: "Grade 6", stream: "Blue", status: "Active" },
  { id: "3", name: "Emmanuel Maina", grade: "Grade 6", stream: "Green", status: "Active" },
  { id: "4", name: "Sheila Chepkoech", grade: "Grade 5", stream: "Alpha", status: "Active" },
  { id: "5", name: "David Mutua", grade: "Grade 5", stream: "Alpha", status: "Active" },
  { id: "6", name: "Grace Wanjiku", grade: "Grade 4", stream: "Beta", status: "Active" },
  { id: "7", name: "Joseph Kariuki", grade: "Grade 4", stream: "Beta", status: "Active" },
  { id: "8", name: "Faith Njeri", grade: "Grade 3", stream: "Alpha", status: "Active" },
  { id: "9", name: "George Ochieng", grade: "Grade 3", stream: "Beta", status: "Active" },
  { id: "10", name: "Helen Moraa", grade: "Grade 2", stream: "Alpha", status: "Active" },
  { id: "11", name: "Samuel Kamau", grade: "Grade 2", stream: "Beta", status: "Active" },
  { id: "12", name: "Winnie Achieng", grade: "Grade 1", stream: "Blue", status: "Active" },
  { id: "13", name: "Peter Odhiambo", grade: "Grade 1", stream: "Green", status: "Active" },
  { id: "14", name: "Jane Mwangi", grade: "Grade PP2", stream: "Yellow", status: "Active" },
  { id: "15", name: "David Maina", grade: "Grade PP1", stream: "Yellow", status: "Active" },
];

const MOCK_STATS = {
  totalStudents: 15,
  activeStudents: 15,
  graduatedStudents: 0,
  studentsByGrade: [
    { grade: "Grade PP1", count: 1 },
    { grade: "Grade PP2", count: 1 },
    { grade: "Grade 1", count: 2 },
    { grade: "Grade 2", count: 2 },
    { grade: "Grade 3", count: 2 },
    { grade: "Grade 4", count: 2 },
    { grade: "Grade 5", count: 2 },
    { grade: "Grade 6", count: 2 },
  ],
  studentsByStream: [
    { stream: "Blue", count: 3 },
    { stream: "Green", count: 2 },
    { stream: "Alpha", count: 3 },
    { stream: "Beta", count: 2 },
    { stream: "Yellow", count: 2 },
  ]
};

const Promote = () => {
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStream, setFilterStream] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [promotionHistory, setPromotionHistory] = useState<PromotionRecord[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = !filterGrade || student.grade === filterGrade;
    const matchesStream = !filterStream || student.stream === filterStream;
    const matchesStatus = !filterStatus || student.status === filterStatus;
    return matchesSearch && matchesGrade && matchesStream && matchesStatus;
  });

  // Helper functions
  const getNextGrade = (currentGrade: string): string => {
    const gradeMatch = currentGrade.match(/Grade (\d+)/);
    if (gradeMatch) {
      const currentNum = parseInt(gradeMatch[1]);
      return `Grade ${currentNum + 1}`;
    }
    if (currentGrade === "Grade PP2") return "Grade 1";
    if (currentGrade === "Grade PP1") return "Grade PP2";
    return currentGrade;
  };

  const isHighestGrade = (grade: string, highestGrade: string): boolean => {
    const gradeMatch = grade.match(/Grade (\d+)/);
    const highestMatch = highestGrade.match(/Grade (\d+)/);
    
    if (gradeMatch && highestMatch) {
      const currentNum = parseInt(gradeMatch[1]);
      const highestNum = parseInt(highestMatch[1]);
      return currentNum >= highestNum;
    }
    return false;
  };

  const getHighestGrade = (): string => {
    const maxGrade = Math.max(...students.map(s => {
      const match = s.grade.match(/Grade (\d+)/);
      return match ? parseInt(match[1]) : 0;
    }));
    return `Grade ${maxGrade}`;
  };

  // Generate promotion preview
  const getPromotionPreview = (): StudentPreview[] => {
    const highestGrade = getHighestGrade();
    return students.map(student => {
      const nextGrade = getNextGrade(student.grade);
      const isHighest = isHighestGrade(student.grade, highestGrade);
      return {
        ...student,
        nextGrade,
        isHighest,
        status: isHighest ? 'Graduated' : student.status
      };
    });
  };

  // Handle promotion execution
  const handlePromoteStudents = (promotedStudents: Student[]) => {
    setStudents(promotedStudents);
    
    // Add to promotion history
    const promotionRecord: PromotionRecord = {
      id: `PROM-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      promotedBy: "System Admin",
      totalPromoted: promotedStudents.length,
      newGrades: promotedStudents.map(s => ({
        student: s.name,
        from: s.grade,
        to: getNextGrade(s.grade)
      }))
    };
    
    setPromotionHistory([promotionRecord, ...promotionHistory]);
    setShowSuccessMessage(true);
    
    // Hide success message after 5 seconds
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  // Get promotion preview data
  const promotionPreview = getPromotionPreview();

  // Prepare stats data
  const statsData = {
    totalStudents: MOCK_STATS.totalStudents,
    activeStudents: MOCK_STATS.activeStudents,
    graduatedStudents: MOCK_STATS.graduatedStudents,
    highestGrade: getHighestGrade()
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Success Message */}
      <SuccessMessage visible={showSuccessMessage} />

      {/* Header */}
      <PromotionHeader onPromoteClick={() => setIsPromoteModalOpen(true)} />

      {/* Warning Banner */}
      <WarningBanner />

      {/* Tabs for Preview and History */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-12 mb-8">
          <TabsTrigger value="preview" className="rounded-xl px-8 h-full font-bold text-xs">Promotion Preview</TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl px-8 h-full font-bold text-xs">Promotion History</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-8">
          {/* Statistics Cards */}
          <PromotionStats stats={statsData} />

          {/* Filters */}
          <PromotionFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterGrade={filterGrade}
            onGradeChange={setFilterGrade}
            filterStream={filterStream}
            onStreamChange={setFilterStream}
            filterStatus={filterStatus}
            onStatusChange={setFilterStatus}
            grades={MOCK_STATS.studentsByGrade}
            streams={MOCK_STATS.studentsByStream}
          />

          {/* Promotion Preview Table */}
          <PromotionPreviewTable students={promotionPreview} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <PromotionHistoryTable history={promotionHistory} />
        </TabsContent>
      </Tabs>

      {/* Promote Students Modal */}
      <PromoteStudentsModal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        students={filteredStudents}
        onPromote={handlePromoteStudents}
        highestGrade={getHighestGrade()}
      />
    </div>
  );
};

export default Promote;