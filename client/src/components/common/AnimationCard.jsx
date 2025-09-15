// components/common/AnimatedStatsCard.js
import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';

const AnimatedStatsCard = ({ title, value, icon: Icon, color, delay = 0 }) => {
  const animatedValue = useCountUp(value, 2000, delay);
  
  const colorClasses = {
    blue: 'from-blue-600 to-blue-700 shadow-blue-500/25',
    green: 'from-green-600 to-green-700 shadow-green-500/25',
    yellow: 'from-yellow-600 to-yellow-700 shadow-yellow-500/25',
    purple: 'from-purple-600 to-purple-700 shadow-purple-500/25',
    red: 'from-red-600 to-red-700 shadow-red-500/25',
  };

  const iconColorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
  };

  return (
    <div className="group relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:transform hover:scale-[1.02] shadow-xl">
      {/* Background gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gray-800/50 ${iconColorClasses[color]} backdrop-blur-sm border border-gray-700/50`}>
            <Icon size={24} />
          </div>
        </div>
        
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {animatedValue.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-400 font-medium">{title}</p>
        </div>
      </div>
      
      {/* Subtle glow effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-br ${colorClasses[color]} rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300 -z-10`}></div>
    </div>
  );
};

export default AnimatedStatsCard;