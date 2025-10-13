import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Sidebar from "../common/Sidebar";
import Header from "../common/Header";
import Footer from "../common/Footer";
import Dashboard from "../dashboard/Dashboard";
import RequestForm from "../requests/RequestForm";
import DirectRequestForm from "../requests/DirectRequestForm";
import RequestsList from "../requests/RequestsList";
import TransactionsList from "../transactions/TransactionsList";
import InventoryList from "../inventory/InventoryList";
import UsersList from "../users/UsersList";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddAsset from "../inventory/AddAsset";
import CreateInventory from "../inventory/CreateInventory";
import EwasteReport from "../ewaste/EwasteReport";
import PasswordReset from "../password/PasswordReset";
import UserChangePassword from "../password/UserChangePassword";
import LocationManagement from "../location/LocationManagement";



const AppLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

  const pageTitles = {
    "/dashboard": "Dashboard",
    "/request": "New Request",
    "/my-requests": "My Requests",
    "/requests": "All Requests",
    "/transactions": "Transactions",
    "/direct-request": "Direct Request",
    "/reports": "Reports",
    "/users": "Users Management",
    "/inventory": "Inventory Management",
    "/create-inventory": "Create Inventory",
  };

  const pageTitle = pageTitles[location.pathname] || "Dashboard";

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Sidebar */}
      <Sidebar role={user.role} className="bg-gray-850/90 backdrop-blur-lg border-r border-gray-700" />

      {/* Main Section */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header
          title={pageTitle}
          user={user}
          className="bg-gray-850/90 backdrop-blur-lg border-b border-gray-700"
        />

        {/* Page Content */}
        <main className="flex-1 p-6 bg-gray-900/80 backdrop-blur-lg border-t border-gray-800">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/request" element={<RequestForm />} />
            <Route path="/my-requests" element={<RequestsList />} />
            <Route path="/requests" element={<RequestsList />} />
            <Route path="/transactions" element={<TransactionsList />} />
            <Route path="/direct-request" element={<DirectRequestForm />} />
            <Route path="/reports" element={<EwasteReport />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/inventory" element={<InventoryList />} />
            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            <Route path="/add-asset" element= {<AddAsset/>}/>
            <Route path="/create-inventory" element= {<CreateInventory/>}/>
            <Route path="/manage-passwords" element= {<PasswordReset role={"admin"}/>}/>
            <Route path="/manage-admin-passwords" element= {<PasswordReset role={"superAdmin"}/>}/>
            <Route path="/change-password" element= {<UserChangePassword/>}/>
            <Route path="/location-management" element={<LocationManagement/>}/>
          </Routes>
        </main>
        <Footer/>
      </div>

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
        toastClassName="bg-gray-800 text-white border border-gray-700 shadow-lg"
      />
    </div>
  );
};

export default AppLayout;
