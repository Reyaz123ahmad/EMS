import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import SubscriptionBanner from '../components/shared/SubscriptionBanner';
import useSocket from '../hooks/useSocket';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Initialize real-time Socket.io listeners
  useSocket();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#fafafa] dark:bg-[#0a0a0a] text-[#111827] dark:text-[#fafafa] antialiased font-sans">
      {/* Sidebar (Desktop 240px + Mobile drawer) */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Header (56px) */}
        <Header setMobileOpen={setMobileOpen} />

        {/* Subscription Expiry / Warning Banner */}
        <SubscriptionBanner />

        {/* Dynamic Page Content with consistent 20px (p-5) padding */}
        <main className="flex-1 overflow-y-auto p-5">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
