import React, { useState } from 'react';
import { CloudSyncCard } from './CloudSyncView';

export const AdminHarmonizationHub: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-slate-950 min-h-screen text-slate-100">
      <CloudSyncCard />
    </div>
  );
};

export default AdminHarmonizationHub;
