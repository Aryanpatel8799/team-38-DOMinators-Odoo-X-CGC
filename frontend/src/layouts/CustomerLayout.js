import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerDashboard from '../pages/customer/Dashboard';
import NewRequest from '../pages/customer/NewRequest';
import BookService from '../pages/customer/BookService';
import RequestHistory from '../pages/customer/RequestHistory';
import PaymentHistory from '../pages/customer/PaymentHistory';
import Notifications from '../pages/customer/Notifications';
import Profile from '../pages/customer/Profile';
import MechanicDiscovery from '../pages/customer/MechanicDiscovery';
import VehicleManagement from '../pages/customer/VehicleManagement';
import Chat from '../pages/customer/Chat';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';

const CustomerLayout = () => {
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/customer/dashboard',
      icon: 'HomeIcon',
    },
    {
      name: 'Find Mechanics',
      href: '/customer/mechanics',
      icon: 'WrenchScrewdriverIcon',
    },
    {
      name: 'New Request',
      href: '/customer/new-request',
      icon: 'PlusCircleIcon',
    },
    {
      name: 'Request History',
      href: '/customer/requests',
      icon: 'ClockIcon',
    },
    {
      name: 'My Vehicles',
      href: '/customer/vehicles',
      icon: 'TruckIcon',
    },
    {
      name: 'Payments',
      href: '/customer/payments',
      icon: 'CreditCardIcon',
    },
    {
      name: 'Messages',
      href: '/customer/chat',
      icon: 'ChatBubbleLeftIcon',
    },
    {
      name: 'Notifications',
      href: '/customer/notifications',
      icon: 'BellIcon',
    },
    {
      name: 'Profile',
      href: '/customer/profile',
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
                <Route path="dashboard" element={<CustomerDashboard />} />
                <Route path="mechanics" element={<MechanicDiscovery />} />
                <Route path="new-request" element={<NewRequest />} />
                <Route path="book-service" element={<BookService />} />
                <Route path="requests" element={<RequestHistory />} />
                <Route path="vehicles" element={<VehicleManagement />} />
                <Route path="payments" element={<PaymentHistory />} />
                <Route path="chat" element={<Chat />} />
                <Route path="notifications" element={<Notifications />} />
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

export default CustomerLayout;
