import React from "react";
import { useAuth } from "../../hooks/useAuth";
import StatsCard from "../common/StatsCard";
import { mockRequests } from "../../data/mockData";
import {
  Users,
  Package,
  FileText,
  Settings,
  Clock,
  CheckCircle,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();

  const userStats = [
    { title: "My Requests", value: "5", icon: FileText, color: "blue" },
    { title: "Pending", value: "2", icon: Clock, color: "yellow" },
    { title: "Approved", value: "2", icon: CheckCircle, color: "green" },
    { title: "Issued", value: "1", icon: Package, color: "purple" },
  ];

  const managerStats = [
    { title: "All Requests", value: "45", icon: FileText, color: "blue" },
    { title: "Pending Review", value: "12", icon: Clock, color: "yellow" },
    { title: "Assets Issued", value: "23", icon: Package, color: "green" },
    { title: "Returns Due", value: "5", icon: FileText, color: "red" },
  ];

  const adminStats = [
    { title: "Total Users", value: "150", icon: Users, color: "blue" },
    { title: "Total Assets", value: "340", icon: Package, color: "green" },
    { title: "Active Requests", value: "25", icon: FileText, color: "yellow" },
    { title: "Low Stock Items", value: "8", icon: Settings, color: "red" },
  ];

  const getStats = () => {
    switch (user.role) {
      case "admin":
        return adminStats;
      case "manager":
        return managerStats;
      default:
        return userStats;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white p-6">
      {/* Overview */}
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-6">Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getStats().map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>
      </div>

      {/* Recent Requests */}
      {user.role !== "user" && (
        <div className="bg-gray-850/90 backdrop-blur-lg rounded-2xl shadow-2xl shadow-black/40 p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Recent Requests</h3>
          <div className="space-y-3">
            {mockRequests.slice(0, 5).map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700 hover:bg-gray-750 transition-all"
              >
                <div>
                  <p className="font-medium text-white">
                    {request.requestorName}
                  </p>
                  <p className="text-sm text-gray-400">
                    {request.assetName} x{request.quantity}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium
                  ${
                    request.status === "pending"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : request.status === "issued"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {request.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
