import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  PlusCircleIcon,
  ClockIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const iconMap = {
  HomeIcon,
  PlusCircleIcon,
  ClockIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
};

const Sidebar = ({ navigationItems }) => {
  const location = useLocation();

  return (
    <div className="bg-white shadow-lg w-64 flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-white">R</span>
          </div>
          <span className="ml-3 text-xl font-bold text-secondary-900">RoadGuard</span>
        </div>
      </div>
      
      <nav className="px-4 pb-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = location.pathname === item.href;
            
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                    ${isActive
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                    }
                  `}
                >
                  {Icon && <Icon className="mr-3 h-5 w-5" />}
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Notifications Section */}
      <div className="px-4 pb-4 border-t border-secondary-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">
            Notifications
          </h3>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-danger-100 text-danger-800">
            3
          </span>
        </div>
        <ul className="space-y-1">
          <li>
            <button className="w-full flex items-center px-3 py-2 text-sm text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 rounded-lg transition-colors">
              <BellIcon className="mr-3 h-4 w-4" />
              <span className="truncate">New service request</span>
            </button>
          </li>
          <li>
            <button className="w-full flex items-center px-3 py-2 text-sm text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 rounded-lg transition-colors">
              <BellIcon className="mr-3 h-4 w-4" />
              <span className="truncate">Payment received</span>
            </button>
          </li>
          <li>
            <button className="w-full flex items-center px-3 py-2 text-sm text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 rounded-lg transition-colors">
              <BellIcon className="mr-3 h-4 w-4" />
              <span className="truncate">New review</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
