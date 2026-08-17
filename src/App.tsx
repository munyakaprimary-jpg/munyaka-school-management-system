import React from 'react';
import { Provider } from 'react-redux';
import store from './store';
import LearnerMasterList from './components/LearnerMasterList';
import Dashboard from './components/Dashboard';

const App: React.FC = () => (
 <Provider store={store}>
 <div>
 <LearnerMasterList />
 <Dashboard />
 </div>
 </Provider>
);

export default App;