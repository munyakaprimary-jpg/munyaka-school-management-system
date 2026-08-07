import React from 'react';
import { BrowserRouter as Router} from "react-router-dom";
import GradesAndStreamsProvider from "./Providers/GradesAndStreamsProvider";

const App = () => {
  return (
    <Router>
      <GradesAndStreamsProvider>
        {/* Your application routes here */}
      </GradesAndStreamsProvider>
    </Router>
  );
};

export default App;