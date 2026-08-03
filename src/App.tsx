import './favicon.ico';
import './styles/globals.css';

import { Suspense } from 'react';

// Update this line to match your home/dashboard component file name and path
import Home from './pages/Index';

const App = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <Home />
  </Suspense>
);

export default App;