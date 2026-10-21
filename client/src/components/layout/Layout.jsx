import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

function Layout({ children }) {
  return (
    <div className="flex h-screen bg-[#F8FAFC] antialiased selection:bg-emerald-500 selection:text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
