import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { getMenuItems } from "../../data/menuItems";
import { useAuth } from "../../hooks/useAuth";

const Sidebar = ({ role, onNavigate, currentView }) => {
  const { logout } = useAuth();
  const menuItems = getMenuItems(role);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-gray-900/90 backdrop-blur-lg border-r border-gray-800 text-white min-h-screen flex flex-col transition-all duration-300 shadow-lg`}
    >
      {/* Top Section */}
      <div>
        {/* Brand + Collapse button */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          {!collapsed && (
            <h1 className="text-lg font-extrabold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
             E-CMS
            </h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Role */}
        {!collapsed && 
        (role !=='user'?(
          <p className="px-6 mt-2 text-gray-400 text-sm">Role: {role}</p>
        ):null)
        }

        {/* Menu */}
        <nav className="mt-6 space-y-1">
          {menuItems.map((item) => {
            const route = "/" + item.view;
            const isActive = location.pathname === route;

            return (
              <button
                key={item.view}
                onClick={() => navigate(route)}
                className={`w-full flex items-center ${
                  collapsed ? "justify-center px-0" : "px-6"
                } py-3 text-left rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5 opacity-80" />
                {!collapsed && (
                  <span className="ml-3 font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section (Logout) */}
      <div
        className={`p-6 border-t border-gray-800 ${
          collapsed ? "px-0 flex justify-center" : ""
        }`}
      >
        <button
          onClick={logout}
          className="flex items-center text-gray-400 hover:text-red-400 hover:bg-red-900/30 px-3 py-2 rounded-lg transition-all font-medium"
        >
          <LogOut className="w-5 h-5 mr-2" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
