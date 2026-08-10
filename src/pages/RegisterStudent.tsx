import React, { useState } from 'react';
import GradeStreamSelector from '../components/GradeStreamSelector';

const RegisterStudent: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    gradeId: '',
    streamId: '',
  });

  return (
    <div>
      <h1>Register Student</h1>
      <Formik
        initialValues={formData}
        onSubmit={(values) => {
          console.log(values);
        }}
      >
        {({ values, handleChange }) => (
          <form onSubmit={handleSubmit}>
            <GradeStreamSelector />
            {/* Other form fields */}
            <button type="submit">Submit</button>
          </form>
        )}
      </Formik>
    </div>
  );
};

export default RegisterStudent;