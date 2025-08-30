import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from '../pages/admin/Dashboard';
import UserManagement from '../pages/admin/UserManagement';
import ServiceRequests from '../pages/admin/ServiceRequests';
import VerificationManagement from '../pages/admin/VerificationManagement';
import Analytics from '../pages/admin/Analytics';
import Settings from '../pages/admin/Settings';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

const AdminLayout = () => {
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: 'HomeIcon',
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: 'UsersIcon',
    },
    {
      name: 'Service Requests',
      href: '/admin/service-requests',
      icon: 'WrenchScrewdriverIcon',
    },
    {
      name: 'Verifications',
      href: '/admin/verifications',
      icon: 'DocumentTextIcon',
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: 'ChartBarIcon',
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: 'CogIcon',
    },
  ];

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="flex h-screen">
        <Sidebar navigationItems={navigationItems} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="service-requests" element={<ServiceRequests />} />
                <Route path="verifications" element={<VerificationManagement />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
