import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LearningAreas from './pages/LearningAreas';
import Fees from './pages/Fees';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<h1>Welcome to Your Website</h1>} />
        <Route path="/learning-areas" element={<LearningAreas />} />
        <Route path="/fees" element={<Fees />} />
      </Routes>
    </Router>
  );
};

export default App;