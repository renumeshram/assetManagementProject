import React from "react";

const StatsCard = ({ title, value, icon: Icon, color = "blue" }) => {
  // Tailwind color mappings for dark theme
  const colorClasses = {
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.4)]", // glow effect
    },
    green: {
      bg: "bg-green-500/10",
      text: "text-green-400",
      glow: "shadow-[0_0_15px_rgba(34,197,94,0.4)]",
    },
    yellow: {
      bg: "bg-yellow-500/10",
      text: "text-yellow-400",
      glow: "shadow-[0_0_15px_rgba(234,179,8,0.4)]",
    },
    red: {
      bg: "bg-red-500/10",
      text: "text-red-400",
      glow: "shadow-[0_0_15px_rgba(239,68,68,0.4)]",
    },
    purple: {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      glow: "shadow-[0_0_15px_rgba(168,85,247,0.4)]",
    },
  };

  const { bg, text, glow } = colorClasses[color] || colorClasses.blue;

  return (
    <div
      className={`bg-gray-900/60 border border-gray-800 rounded-2xl p-6 shadow-md 
        hover:shadow-xl hover:border-gray-700 transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        {/* Title + Value */}
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-100 mt-2">{value}</p>
        </div>

        {/* Icon with glow */}
        <div
          className={`p-3 rounded-full ${bg} ${text} ${glow} transition-all duration-300`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
