export interface Notice {
  id: string;
  title: string;
  message: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
}

export interface NoticeInput {
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
}