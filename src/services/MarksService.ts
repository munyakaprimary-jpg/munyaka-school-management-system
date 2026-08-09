// src/services/MarksService.ts

import { Inject } from 'inversify';
import { Mark } from '../types/marks.types';
import MarksRepository from '../repositories/MarksRepository';

export class MarksService {
  private repository: MarksRepository;

  constructor(repository: MarksRepository) {
    this.repository = repository;
  }

  async getMarks(pageNumber: number): Promise<Mark[]> {
    const pageSize = Number.MAX_SAFE_INTEGER;
    const marks = await this.repository.findAll((pageNumber - 1) * pageSize, pageSize);
    return marks.slice(0, MAX_MARKS_PER_PAGE);
  }

  async createMark(title: string, url: string): Promise<string> {
    return await this.repository.create({ title, url, createdAt: new Date() });
  }
}