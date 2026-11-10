import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const SYSTEM_ROLES = [
  { id: 'HOI', label: 'HOI (Head of Institution / Principal)' },
  { id: 'DHOI', label: 'DHOI (Deputy Head of Institution)' },
  { id: 'Class Teacher', label: 'Class Teacher' },
  { id: 'Subject Teacher', label: 'Subject Teacher' },
  { id: 'ICT Teacher', label: 'ICT Teacher' },
  { id: 'Library Teacher', label: 'Library Teacher' },
  { id: 'Lab Teacher', label: 'Lab Teacher' },
  { id: 'Bursar', label: 'Bursar' },
  { id: 'Store Master', label: 'Store Master' },
];

export default function AddUserModal({ isOpen, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Subject Teacher',
    staffId: '',
    password: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showError('Please enter name and email');
      return;
    }
    if (onSubmit) {
      onSubmit(formData);
    } else {
      try {
        const existing = JSON.parse(localStorage.getItem('munyaka_user_accounts') || '[]');
        const newUser = {
          id: `usr-${Date.now()}`,
          ...formData,
          role: formData.role.toUpperCase(),
          status: 'Active',
          createdAt: new Date().toISOString()
        };
        const updated = [...existing, newUser];
        localStorage.setItem('munyaka_user_accounts', JSON.stringify(updated));
        localStorage.setItem('munyaka_users', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
        showSuccess('User account created successfully');
        onClose();
      } catch (err) {
        showError('Failed to create user account');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Modal Container */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Add New User
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Create a new user account for staff access
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John Kamau"
              className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
            />
          </div>

          {/* Email & Phone Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@school.sc.ke"
                className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+254 700 000 000"
                className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Role & Staff ID Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
              >
                {SYSTEM_ROLES.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Staff ID
              </label>
              <input
                type="text"
                value={formData.staffId}
                onChange={e => setFormData({ ...formData, staffId: e.target.value })}
                placeholder="T001"
                className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter password"
              className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
