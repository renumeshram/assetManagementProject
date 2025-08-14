import React from 'react';
import { LogOut } from 'lucide-react';
import { getMenuItems } from '../../data/menuItems';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ role, onNavigate, currentView }) => {
  const { logout } = useAuth();
  const menuItems = getMenuItems(role);

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-blue-400">Asset Manager</h1>
        <p className="text-gray-400 text-sm mt-1">Role: {role}</p>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-800 transition-colors ${
              currentView === item.view ? 'bg-blue-600 border-r-2 border-blue-400' : ''
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </button>
        ))}
      </nav>
      
      <div className="absolute bottom-6 left-6">
        <button
          onClick={logout}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;