import React from 'react';

interface PasswordFormProps {
  onConfirm: (password: string) => void;
}

const PasswordForm: React.FC<PasswordFormProps> = ({ onConfirm }) => {
  const [password, setPassword] = React.useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(password);
  };

  return (
    <dialog id="admin-password-form" className="modal">
      <form onSubmit={handleSubmit} className="modal-box">
        <h3 className="font-bold text-lg">Admin Password Required</h3>
        <p className="py-4">Enter the admin password to continue.</p>
        <div className="form-control w-full max-w-xs">
          <label htmlFor="password" className="label">
            <span className="label-text">Password</span>
          </label>
          <input
            id="password"
            type="password"
            placeholder="your password"
            className="input input-bordered w-full max-w-xs"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="modal-action">
          <button type="submit" className="btn">
            Confirm
          </button>
        </div>
      </form>
    </dialog>
  );
};

export default PasswordForm;