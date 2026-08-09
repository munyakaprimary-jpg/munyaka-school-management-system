import { Request, Response } from 'express';
import MarksService from '../services/MarksService';

export class MarksController {
  private marksService: MarksService;

  constructor() {
    this.marksService = new MarksService(knex);
    this.createExamPeriod = this.createExamPeriod.bind(this);
    this.updateMark = this.updateMark.bind(this);
  }

  public createExamPeriod(req: Request, res: Response): void {
    const { learnerId, classGrade, academicYear, term, examType } = req.body;

    this.marksService
      .createExamPeriod(learnerId, classGrade, academicYear, term, examType)
      .then(() => res.status(201).send('Exam period created successfully'))
      .catch((error) => res.status(500).json({ error }));
  }

  public updateMark(req: Request, res: Response): void {
    const { learnerId, classGrade, academicYear, term, examType, subject, mark } = req.body;

    this.marksService
      .updateMark(learnerId, classGrade, academicYear, term, examType, subject, mark)
      .then(() => res.status(200).send('Mark updated successfully'))
      .catch((error) => res.status(500).json({ error }));
  }
}