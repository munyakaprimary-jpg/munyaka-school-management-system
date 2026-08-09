// src/controllers/MarksController.ts

import { Request, Response } from 'express';
import HttpStatus from '@httpstatus/codes';
import { MarksService } from '../services/MarksService';

export class MarksController {
  private marksService: MarksService;

  constructor(marksService: MarksService) {
    this.marksService = marksService;
  }

  async getMarks(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1 } = req.query;
      const pageNumber = parseInt(page.toString(), 10);
      const marks = await this.marksService.getMarks(pageNumber);
      res.status(HttpStatus.OK).json(marks);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to retrieve marks' });
    }
  }

  async createMark(req: Request, res: Response): Promise<void> {
    try {
      const { title, url }: CreateMarkInput = req.body;
      const markId = await this.marksService.createMark(title, url);
      res.status(HttpStatus.CREATED).json({ id: markId });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to create mark' });
    }
  }
}