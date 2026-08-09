// src/types/marks.ts

export interface Mark {
  id: string;
  title: string;
  url: string;
  createdAt: Date;
}

export type CreateMarkInput = Pick<Mark, 'title' | 'url'>;

export const MAX_MARKS_PER_PAGE = 10;