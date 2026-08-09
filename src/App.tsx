import marksControllerInstance from './controllers/MarksController';

const app = express();

app.use(express.json());

// Example endpoint using MarksController
app.get('/marks', (req, res) => {
  const result = marksControllerInstance.performOperation(); // Assuming performOperation is a method on MarksController
  res.json(result);
});

export default app;