
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MechanicDashboard from '../pages/mechanic/Dashboard';
import AssignedRequests from '../pages/mechanic/AssignedRequests';
import Earnings from '../pages/mechanic/Earnings';
import Profile from '../pages/mechanic/Profile';
import VerificationForm from '../components/mechanic/VerificationForm';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

const MechanicLayout = () => {
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/mechanic/dashboard',
      icon: 'HomeIcon',
    },
    {
      name: 'Assigned Requests',
      href: '/mechanic/requests',
      icon: 'WrenchScrewdriverIcon',
    },
    {
      name: 'Earnings',
      href: '/mechanic/earnings',
      icon: 'CurrencyDollarIcon',
    },
    {
      name: 'Verification',
      href: '/mechanic/verification',
      icon: 'DocumentTextIcon',
    },
    {
      name: 'Profile',
      href: '/mechanic/profile',
      icon: 'UserIcon',
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
                <Route path="dashboard" element={<MechanicDashboard />} />
                <Route path="requests" element={<AssignedRequests />} />
                <Route path="earnings" element={<Earnings />} />
                <Route path="verification" element={<VerificationForm />} />
                <Route path="profile" element={<Profile />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MechanicLayout;
