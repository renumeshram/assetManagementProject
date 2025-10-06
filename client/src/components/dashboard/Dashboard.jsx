// Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";
import AnimatedStatsCard from "../common/AnimationCard";
import api from "../../utils/api";
const API_URL = import.meta.env.VITE_API_BASE_URL;
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

  const [stats, setStats] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Map string -> Lucide icons
  const iconMap = {
    Users,
    Package,
    FileText,
    Settings,
    Clock,
    CheckCircle,
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const statsResponse = await api.get(`${API_URL}/dashboard/stats?role=${user.role}`);
        const requestsResponse = await api.get(`${API_URL}/dashboard/recent`);

        const statsData = statsResponse.data.data;

        // Format backend response into array for AnimatedStatsCard
        let formattedStats = [];

        if (user.role === "admin" || user.role === "superAdmin") {
          formattedStats = [
            { title: "Total Users", value: statsData.totalUsers, icon: "Users", color: "blue" },
            { title: "Total Assets", value: statsData.totalAssets, icon: "Package", color: "green" },
            { title: "Active Requests", value: statsData.totalRequests, icon: "FileText", color: "yellow" },
            { title: "Low Stock Items", value: statsData.totalLowStockItems, icon: "Settings", color: "red" },
          ];
        } else if (user.role === "manager") {
          formattedStats = [
            { title: "All Requests", value: statsData.allRequests, icon: "FileText", color: "blue" },
            { title: "Pending Review", value: statsData.pendingReview, icon: "Clock", color: "yellow" },
            { title: "Assets Issued", value: statsData.assetsIssued, icon: "Package", color: "green" },
            { title: "Returns Due", value: statsData.returnsDue, icon: "FileText", color: "red" },
          ];
        } else {
          formattedStats = [
            { title: "My Requests", value: statsData.myRequests, icon: "FileText", color: "blue" },
            { title: "Pending", value: statsData.pending, icon: "Clock", color: "yellow" },
            { title: "Approved", value: statsData.approved, icon: "CheckCircle", color: "green" },
            { title: "Issued", value: statsData.issued, icon: "Package", color: "purple" },
          ];
        }

        setStats(formattedStats);
        setRequests(requestsResponse.data.data); // expects backend { data: [...] }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.role]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white p-6">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* Overview */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold mb-6 opacity-0 animate-[fadeIn_0.6s_ease-out_0.2s_both]">
              Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const IconComponent = iconMap[stat.icon] || FileText;
                return (
                  <div
                    key={index}
                    className="opacity-0 animate-[slideInUp_0.6s_ease-out_both]"
                    style={{ animationDelay: `${0.1 + index * 0.15}s` }}
                  >
                    <AnimatedStatsCard
                      {...stat}
                      icon={IconComponent}
                      delay={300 + index * 200}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Requests */}
          {user.role !== "user" && (
            <div
              className="bg-gray-850/90 backdrop-blur-lg rounded-2xl shadow-2xl shadow-black/40 p-6 border border-gray-700 opacity-0 animate-[slideInUp_0.8s_ease-out_1s_both]"
            >
              <h3 className="text-lg font-semibold mb-4">Recent Requests</h3>
              <div className="space-y-3">
                {requests.map((request, index) => (
                  <div
                    key={request._id || index}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700 hover:bg-gray-750 transition-all opacity-0 animate-[slideInRight_0.5s_ease-out_both]"
                    style={{ animationDelay: `${1.2 + index * 0.1}s` }}
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
        </>
      )}

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
