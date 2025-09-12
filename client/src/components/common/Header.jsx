import React from "react";
import logo from '../../assets/img/nmdc.png';

const Header = ({ title, user, className = "" }) => (
  <div
    className={`px-6 py-4 bg-gray-850/90 backdrop-blur-lg border-b border-gray-700 shadow-md ${className}`}
  >
    <div className="flex justify-between items-center">
      {/* Left Section: Logo + Project Name + Page Title */}
      <div className="flex items-center space-x-3">
        {/* Company Logo */}
        <img
          src={logo} // <-- replace with your logo path
          alt="Company Logo"
          className="w-12 h-12 object-contain"
        />

        {/* Project Name + Page Title */}
        <div className="flex flex-col">
          <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            E-Consumables Management System
          </span>
          <h2 className="text-xl font-semibold text-gray-400 tracking-wide">
            {title}
          </h2>
        </div>
      </div>

      {/* Right Section: User Info */}
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <span className="text-gray-600">Welcome, {user?.name}</span>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0)}
            </div>
          </>
        ) : (
          <span className="text-gray-600">Welcome! Please login to continue.</span>
        )}
      </div>
    </div>
  </div>
);

export default Header;
