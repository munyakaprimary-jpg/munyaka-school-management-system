import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTrigger } from '@/components/ui/dialog';
import PasswordForm from '../components/PasswordForm';

const LearningAreas: React.FC = () => {
  const [passwordModalOpen, setPasswordModalOpen] = React.useState(false);

  return (
    <div className='container mx-auto p-4'>
      <h1>Learning Areas</h1>
      <button
        onClick={() => setPasswordModalOpen(true)}
        className='btn btn-primary mt-4'
      >
        Edit Learning Areas
      </button>

      <PasswordForm
        onConfirm={(password) => {
          // Perform password validation and confirmation here
          if (password === 'admin123') {
            setPasswordModalOpen(false);
            alert('Edit function unlocked!');
            // Code to handle the actual edit functionality goes here
          } else {
            alert('Invalid password. Please try again.');
          }
        }}
      />
    </div>
  );
};

export default LearningAreas;