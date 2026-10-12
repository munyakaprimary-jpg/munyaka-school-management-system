import React from 'react';
import OwnersSidebar from '../components/OwnersSidebar';

export default function OwnersPortalLayout({ activeTab, setActiveTab, children }: any) {
  return (
    <div className="flex flex-row min-h-screen w-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Independent Dedicated Sidebar */}
      <OwnersSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Owner Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
