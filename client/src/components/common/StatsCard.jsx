import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color = 'blue' }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${
        color === 'blue' ? 'bg-blue-100' :
        color === 'green' ? 'bg-green-100' :
        color === 'yellow' ? 'bg-yellow-100' :
        color === 'red' ? 'bg-red-100' :
        'bg-purple-100'
      }`}>
        <Icon className={`w-6 h-6 ${
          color === 'blue' ? 'text-blue-600' :
          color === 'green' ? 'text-green-600' :
          color === 'yellow' ? 'text-yellow-600' :
          color === 'red' ? 'text-red-600' :
          'text-purple-600'
        }`} />
      </div>
    </div>
  </div>
);

export default StatsCard;