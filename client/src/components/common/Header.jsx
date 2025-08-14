import React from 'react';

const Header = ({ title, user }) => (
  <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
      <div className="flex items-center space-x-4">
        <span className="text-gray-600">Welcome, {user?.name}</span>
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
          {user?.name?.charAt(0)}
        </div>
      </div>
    </div>
  </div>
);

export default Header;