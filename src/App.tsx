import express from 'express';
import MarksController from './controllers/MarksController';

const app = express();
app.use(express.json());

const marksController = new MarksController();

app.post('/exam-period', marksController.createExamPeriod);
app.put('/mark/update', marksController.updateMark);

export default app;