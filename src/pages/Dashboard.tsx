import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { Learner } from '../features/learners/learnersSlice';
import LearnerMasterList from '../components/LearnerMasterList';

const Dashboard = () => {
  const dispatch = useDispatch();
  const learners = useSelector((state: RootState) => state.learners);

  useEffect(() => {
    // Simulate fetching learners from an API
    const simulatedLearners: Learner[] = [
      { id: '1', name: 'John Doe', email: 'john.doe@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com' },
    ];
    simulatedLearners.forEach(learner => dispatch(addLearner(learner)));
  }, [dispatch]);

  return (
    <div>
      <h1>Dashboard</h1>
      <LearnerMasterList learners={learners} />
    </div>
  );
};

export default Dashboard;