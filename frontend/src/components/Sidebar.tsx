import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  BarChart2, 
  ShoppingCart, 
  Briefcase, 
  Bell, 
  Settings 
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { 
      icon: Home, 
      label: 'Dashboard', 
      path: '/' 
    },
    { 
      icon: BarChart2, 
      label: 'Analytics', 
      path: '/analytics' 
    },
    { 
      icon: ShoppingCart, 
      label: 'Trading', 
      path: '/trading' 
    },
    { 
      icon: Briefcase, 
      label: 'Portfolio', 
      path: '/portfolio' 
    },
    { 
      icon: Bell, 
      label: 'Alerts', 
      path: '/alerts' 
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      path: '/settings' 
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path 
      ? 'bg-gray-200 text-gray-900' 
      : 'text-gray-500 hover:bg-gray-100';
  };

  return (
    <div className="w-64 bg-white border-r">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Crypto Trading Bot</h1>
      </div>
      <nav className="p-4">
        {menuItems.map((item) => (
          <Link 
            key={item.path}
            to={item.path}
            className={`
              flex items-center p-2 rounded transition-colors 
              ${isActive(item.path)}
            `}
          >
            <item.icon className="mr-3 h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;