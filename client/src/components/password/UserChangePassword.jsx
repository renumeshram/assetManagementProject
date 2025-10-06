import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  validateChangePasswordForm,
  validatePassword,
  validatePasswordMatch,
  getPasswordStrength,
  getContextualErrorMessage,
  changePasswordSchema,
} from "../../schemas/passwordManagementSchema";
import api from "../../utils/api";
import toast from "react-hot-toast";
const API_URL = import.meta.env.VITE_API_BASE_URL;

// Password Strength Indicator Component
const PasswordStrengthIndicator = ({ password, showDetails = false }) => {
  if (!password) return null;

  const strength = getPasswordStrength(password);

  const getColorClasses = () => {
    switch (strength.color) {
      case "green":
        return "bg-green-500";
      case "blue":
        return "bg-blue-500";
      case "yellow":
        return "bg-yellow-500";
      case "orange":
        return "bg-orange-500";
      default:
        return "bg-red-500";
    }
  };

  const getTextColor = () => {
    switch (strength.color) {
      case "green":
        return "text-green-400";
      case "blue":
        return "text-blue-400";
      case "yellow":
        return "text-yellow-400";
      case "orange":
        return "text-orange-400";
      default:
        return "text-red-400";
    }
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-400">Password Strength</span>
        <span className={`text-sm font-medium ${getTextColor()}`}>
          {strength.strength}
        </span>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getColorClasses()}`}
          style={{ width: `${strength.percentage}%` }}
        ></div>
      </div>

      {showDetails && (
        <div className="space-y-1">
          {strength.checks.map((check, index) => (
            <div key={index} className="flex items-center text-xs">
              {check.passed ? (
                <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
              ) : (
                <AlertCircle className="h-3 w-3 text-gray-500 mr-2" />
              )}
              <span
                className={check.passed ? "text-green-400" : "text-gray-500"}
              >
                {check.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UserChangePassword = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showStrengthDetails, setShowStrengthDetails] = useState(false);

  // If user is not available, show loading or redirect
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-white">Please log in to access this page.</div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: "" });
    }
  };

  const handleBlur = (fieldName) => {
    // Real-time field validation on blur
    if (fieldName === "newPassword" && formData.newPassword) {
      const validation = validatePassword(formData.newPassword);
      if (!validation.valid) {
        setFieldErrors({
          ...fieldErrors,
          newPassword: getContextualErrorMessage(validation.error, "user"),
        });
      }
    }

    if (
      fieldName === "confirmPassword" &&
      formData.newPassword &&
      formData.confirmPassword
    ) {
      const validation = validatePasswordMatch(
        formData.newPassword,
        formData.confirmPassword
      );
      if (!validation.valid) {
        setFieldErrors({ ...fieldErrors, confirmPassword: validation.error });
      }
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  const handleSubmit = async () => {
    // Create form data with user's sapId from context
    const submitData = {
      sapId: user.sapId, // Get sapId from context
      ...formData,
    };

    // Use the imported Zod validation function
    const validation = validateChangePasswordForm(submitData);

    if (!validation.success) {
      // Set field-specific errors from Zod validation
      setFieldErrors(validation.errors || {});
      toast.error("Please fix the errors below");
      return;
    }

    setLoading(true);
    setFieldErrors({}); // Clear any existing errors

    try {
      const response = await api.post(`${API_URL}/auth/change-password`, {
        sapId: user.sapId, // Use sapId from context
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });

      if (response.data) {
        setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setFieldErrors({});
        toast.success(response.data.msg || "Password changed successfully");
        
        // Logout user and redirect to login after successful password change
        setTimeout(() => {
          logout(); // Clear user session
          navigate("/login"); // Redirect to login page
        }, 2000); // Wait 2 seconds to show the success message
      }
    } catch (error) {
      console.log("🚀 ~ handleSubmit ~ error:", error);
      
      // Handle Axios error properly to show server error messages
      if (error.response && error.response.data && error.response.data.msg) {
        // Server responded with an error message (like "Old password is incorrect")
        toast.error(error.response.data.msg);
      } else if (error.request) {
        // Request was made but no response received
        toast.error("No response from server. Please try again.");
      } else {
        // Something else happened
        toast.error("Network error. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-md mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          <div className="flex items-center justify-center mb-8">
            <Lock className="h-8 w-8 text-blue-400 mr-2" />
            <h2 className="text-2xl font-bold text-white">Change Password</h2>
          </div>

          <div className="space-y-6">
            {/* SAP ID Display Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SAP ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <div className="w-full pl-10 pr-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 cursor-not-allowed">
                  {user.sapId}
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Your SAP ID cannot be changed
              </p>
            </div>

            {/* Current Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPasswords.old ? "text" : "password"}
                  name="oldPassword"
                  value={formData.oldPassword}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                    fieldErrors.oldPassword
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-600 focus:ring-blue-500"
                  }`}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("old")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPasswords.old ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {fieldErrors.oldPassword && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {fieldErrors.oldPassword}
                </p>
              )}
            </div>

            {/* New Password Field with Strength Indicator */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  New Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowStrengthDetails(!showStrengthDetails)}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
                >
                  <Info className="h-3 w-3 mr-1" />
                  {showStrengthDetails ? "Hide" : "Show"} Requirements
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("newPassword")}
                  onKeyPress={handleKeyPress}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                    fieldErrors.newPassword
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-600 focus:ring-blue-500"
                  }`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {fieldErrors.newPassword}
                </p>
              )}
              <PasswordStrengthIndicator
                password={formData.newPassword}
                showDetails={showStrengthDetails}
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("confirmPassword")}
                  onKeyPress={handleKeyPress}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                    fieldErrors.confirmPassword
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-600 focus:ring-blue-500"
                  }`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                "Change Password"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserChangePassword;