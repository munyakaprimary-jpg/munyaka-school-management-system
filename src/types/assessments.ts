export interface LearningArea {
  id: string;
  name: string;
  type: 'Core' | 'Elective';
}

export interface ClusterData {
  id: string;
  name: string;
  description?: string;
  learningAreas: LearningArea[];
}

export interface ExamTypeOption {
  id: string;
  name: string;
  code: string;
  weight: number;
  category: string;
}
