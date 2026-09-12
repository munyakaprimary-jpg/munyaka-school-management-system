export interface LearningArea {
  id?: string;
  name: string;
  type: 'Core' | 'Elective';
  description?: string;
  periodsPerWeek?: number;
  isDefault?: boolean;
}

export interface ClusterData {
  id: string;
  name: string;
  description?: string;
  learningAreas: LearningArea[];
  periodsPerWeek?: number;
}

export interface ExamTypeOption {
  id: string;
  name: string;
  code: string;
  weight: number;
  category: string;
}
