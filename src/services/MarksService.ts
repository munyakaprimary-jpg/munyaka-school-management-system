import { Knex } from 'knex';

export class MarksService {
  constructor(private knex: Knex) {}

  public async createExamPeriod(learnerId: string, classGrade: string, academicYear: string, term: string, examType: string): Promise<void> {
    const existingMarks = await this.knex('Marks').where({ learner_id: learnerId, term });

    if (existingMarks.length === 0) {
      await this.knex('Marks').insert({
        learner_id,
        class_grade,
        academic_year,
        term,
        exam_type,
        marks: {},
      });
    }
  }

  public async getAllMarks(): Promise<any[]> {
    return await this.knex('Marks');
  }

  public async updateMark(learnerId: string, classGrade: string, academicYear: string, term: string, examType: string, subject: string, mark: any): Promise<void> {
    await this.knex('Marks').update({ [subject]: mark }).where({
      learner_id,
      class_grade,
      academic_year,
      term,
      exam_type,
    });
  }
}