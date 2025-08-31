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
  CogIcon
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
    </div>
  );
};

export default Sidebar;
