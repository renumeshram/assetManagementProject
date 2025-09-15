import React, { useState } from "react";
import { Eye, EyeOff, Lock, User, Users, AlertCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  validateAdminSingleResetForm,
  validateAdminBulkResetForm,
  validateSapId,
  validatePassword,
  validatePasswordMatch,
  getPasswordStrength,
} from "../../schemas/passwordManagementSchema";

// Helper to map strength colors to CSS values
const getStrengthColor = (color) => {
  switch (color) {
    case "green":
      return "#22c55e"; // Tailwind green-500
    case "blue":
      return "#3b82f6"; // Tailwind blue-500
    case "yellow":
      return "#eab308"; // Tailwind yellow-500
    case "orange":
      return "#f97316"; // Tailwind orange-500
    default:
      return "#ef4444"; // Tailwind red-500
  }
};

// Password Strength Indicator (inline)
const PasswordStrengthIndicator = ({ strength }) => {
  if (!strength) return null;
  return (
    <div className="mt-1 flex items-center space-x-2">
      <div className="w-full bg-gray-600 rounded h-2 overflow-hidden">
        <div
          className="h-2 rounded transition-all duration-300"
          style={{
            width: `${strength.percentage}%`,
            backgroundColor: getStrengthColor(strength.color),
          }}
        />
      </div>
      <span
        className="text-sm font-semibold"
        style={{ color: getStrengthColor(strength.color) }}
      >
        {strength.strength}
      </span>
    </div>
  );
};

const AdminPasswordReset = () => {
  const [activeTab, setActiveTab] = useState("single");
  const [singleResetData, setSingleResetData] = useState({
    sapId: "",
    password: "",
  });
  const [bulkResetData, setBulkResetData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    single: false,
    bulk: false,
    bulkConfirm: false,
  });
  const [loading, setLoading] = useState({ single: false, bulk: false });
  const [errors, setErrors] = useState({ single: {}, bulk: {} });
  const [passwordStrength, setPasswordStrength] = useState({
    single: null,
    bulk: null,
  });

  // Single reset input handling
  const handleSingleInputChange = (e) => {
    const { name, value } = e.target;
    setSingleResetData((prev) => ({ ...prev, [name]: value }));

    if (name === "sapId" && value) {
      const validation = validateSapId(value);
      setErrors((prev) => ({
        ...prev,
        single: { ...prev.single, sapId: validation.error || "" },
      }));
    }

    if (name === "password") {
      const strength = getPasswordStrength(value);
      setPasswordStrength((prev) => ({ ...prev, single: strength }));

      const validation = validatePassword(value);
      setErrors((prev) => ({
        ...prev,
        single: { ...prev.single, password: validation.error || "" },
      }));
    }
  };

  // Bulk reset input handling
  const handleBulkInputChange = (e) => {
    const { name, value } = e.target;
    setBulkResetData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      const strength = getPasswordStrength(value);
      setPasswordStrength((prev) => ({ ...prev, bulk: strength }));

      const validation = validatePassword(value);
      setErrors((prev) => ({
        ...prev,
        bulk: { ...prev.bulk, password: validation.error || "" },
      }));

      if (bulkResetData.confirmPassword) {
        const match = validatePasswordMatch(
          value,
          bulkResetData.confirmPassword
        );
        setErrors((prev) => ({
          ...prev,
          bulk: { ...prev.bulk, confirmPassword: match.error || "" },
        }));
      }
    }

    if (name === "confirmPassword") {
      const match = validatePasswordMatch(bulkResetData.password, value);
      setErrors((prev) => ({
        ...prev,
        bulk: { ...prev.bulk, confirmPassword: match.error || "" },
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Submit single reset form
  const handleSingleReset = async () => {
    const validation = validateAdminSingleResetForm(singleResetData);

    if (!validation.success) {
      setErrors((prev) => ({ ...prev, single: validation.errors }));
      Object.values(validation.errors).forEach((err) => {
        if (err) toast.error(err);
      });
      return;
    }

    setLoading((prev) => ({ ...prev, single: true }));
    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.msg || "Password reset successful");
        setSingleResetData({ sapId: "", password: "" });
        setErrors((prev) => ({ ...prev, single: {} }));
        setPasswordStrength((prev) => ({ ...prev, single: null }));
      } else {
        toast.error(data.msg || "Failed to reset password");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, single: false }));
    }
  };

  // Submit bulk reset form
  const handleBulkReset = async () => {
    const validation = validateAdminBulkResetForm(bulkResetData);

    if (!validation.success) {
      setErrors((prev) => ({ ...prev, bulk: validation.errors }));
      Object.values(validation.errors).forEach((err) => {
        if (err) toast.error(err);
      });
      return;
    }

    setLoading((prev) => ({ ...prev, bulk: true }));
    try {
      const response = await fetch("/api/reset-all-passwords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: validation.data.password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.msg || "All user passwords reset successfully");
        setBulkResetData({ password: "", confirmPassword: "" });
        setErrors((prev) => ({ ...prev, bulk: {} }));
        setPasswordStrength((prev) => ({ ...prev, bulk: null }));
      } else {
        toast.error(data.msg || "Failed to reset passwords");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, bulk: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700">
          <div className="flex items-center justify-center p-6 border-b border-gray-700">
            <Users className="h-8 w-8 text-red-400 mr-2" />
            <h2 className="text-2xl font-bold text-white">
              Admin Password Management
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab("single")}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === "single"
                  ? "bg-gray-700 text-white border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white hover:bg-gray-750"
              }`}
            >
              <User className="h-5 w-5 inline mr-2" />
              Reset Single User
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === "bulk"
                  ? "bg-gray-700 text-white border-b-2 border-red-500"
                  : "text-gray-400 hover:text-white hover:bg-gray-750"
              }`}
            >
              <Users className="h-5 w-5 inline mr-2" />
              Reset All Users
            </button>
          </div>

          {/* Single Reset */}
          {activeTab === "single" && (
            <div className="p-8 space-y-6">
              {/* SAP ID */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  User SAP ID
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="sapId"
                    value={singleResetData.sapId}
                    onChange={handleSingleInputChange}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.single.sapId ? "border-red-500" : "border-gray-600"
                    }`}
                    placeholder="Enter user's SAP ID"
                  />
                </div>
                {errors.single.sapId && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.single.sapId}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPasswords.single ? "text" : "password"}
                    name="password"
                    value={singleResetData.password}
                    onChange={handleSingleInputChange}
                    className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.single.password
                        ? "border-red-500"
                        : "border-gray-600"
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("single")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPasswords.single ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.single.password && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.single.password}
                  </p>
                )}
                <PasswordStrengthIndicator strength={passwordStrength.single} />
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleSingleReset}
                disabled={loading.single}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center"
              >
                {loading.single ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>
          )}

          {/* Bulk Reset */}
          {activeTab === "bulk" && (
            <div className="p-8 space-y-6">
              {/* Warning */}
              <div className="p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
                <p className="text-yellow-300 font-medium">⚠️ Warning:</p>
                <p className="text-yellow-200 mt-1">
                  This will reset passwords for ALL non-admin users. This action
                  cannot be undone.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password for All Users
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPasswords.bulk ? "text" : "password"}
                    name="password"
                    value={bulkResetData.password}
                    onChange={handleBulkInputChange}
                    className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.bulk.password
                        ? "border-red-500"
                        : "border-gray-600"
                    }`}
                    placeholder="Enter new password for all users"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("bulk")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPasswords.bulk ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.bulk.password && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.bulk.password}
                  </p>
                )}
                <PasswordStrengthIndicator strength={passwordStrength.bulk} />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPasswords.bulkConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={bulkResetData.confirmPassword}
                    onChange={handleBulkInputChange}
                    className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.bulk.confirmPassword
                        ? "border-red-500"
                        : "border-gray-600"
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("bulkConfirm")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPasswords.bulkConfirm ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.bulk.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.bulk.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleBulkReset}
                disabled={loading.bulk}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center"
              >
                {loading.bulk ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  "Reset All User Passwords"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPasswordReset;