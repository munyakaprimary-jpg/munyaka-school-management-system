import React from 'react';
import GradeStreamSelector from '../components/GradeStreamSelector';

const MarksEntry: React.FC = () => {
  return (
    <div>
      <h1>Marks Entry</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        <GradeStreamSelector />
        {/* Other input fields */}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default MarksEntry;