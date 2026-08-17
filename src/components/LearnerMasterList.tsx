import React from 'react';

interface Learner {
  id: string;
  name: string;
  email: string;
}

interface LearnerMasterListProps {
  learners: Learner[];
}

const LearnerMasterList: React.FC<LearnerMasterListProps> = ({ learners }) => {
  return (
    <div>
      <h2>Learner Master List</h2>
      <ul>
        {learners.map(learner => (
          <li key={learner.id}>
            {learner.name} - {learner.email}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LearnerMasterList;