import React, { useState, useEffect } from "react";
import { userRegisterSchema } from "../../schemas/authSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import Header from "../common/Header";
import Footer from "../common/Footer";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RegisterForm = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState({
    locations: false,
    departments: false,
    sections: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(userRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      sapId: "",
      location: "",
      department: "",
      section: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Watch for changes
  const selectedLocation = watch("location");
  const selectedDepartment = watch("department");

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading((prev) => ({ ...prev, locations: true }));
    try {
      const res = await api.get(`${API_URL}/auth/locations`);
      
      if (res.data.success && Array.isArray(res.data.locations)) {
        setLocations(res.data.locations);
      } else {
        setLocations([]);
      }
    } catch (err) {
      console.error("Failed to load locations:", err);
      toast.error("Failed to load locations");
      setLocations([]);
    } finally {
      setLoading((prev) => ({ ...prev, locations: false }));
    }
  };

  // Fetch departments when location changes
  const fetchDepartments = async (locationId) => {
    setLoading((prev) => ({ ...prev, departments: true }));
    try {
      const res = await api.get(`${API_URL}/auth/departments-list`, {
        params: { locationId },
      });
      if (res.data.success && Array.isArray(res.data.data)) {
        setDepartments(res.data.data);
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
      toast.error("Failed to load departments");
      setDepartments([]);
    } finally {
      setLoading((prev) => ({ ...prev, departments: false }));
    }
  };

  // Fetch sections when department changes
  const fetchSections = async (departmentId) => {
    setLoading((prev) => ({ ...prev, sections: true }));
    try {
      const res = await api.get(`${API_URL}/auth/sections-list`, {
        params: { departmentId },
      });
      if (res.data.success && Array.isArray(res.data.data)) {
        setSections(res.data.data);
      } else {
        setSections([]);
      }
    } catch (err) {
      console.error("Failed to load sections:", err);
      toast.error("Failed to load sections");
      setSections([]);
    } finally {
      setLoading((prev) => ({ ...prev, sections: false }));
    }
  };

  // Update departments when location changes
  useEffect(() => {
    if (selectedLocation) {
      fetchDepartments(selectedLocation);
      setValue("department", "");
      setSections([]);
      setValue("section", "");
    } else {
      setDepartments([]);
      setSections([]);
    }
  }, [selectedLocation, setValue]);

  // Update sections when department changes
  useEffect(() => {
    if (selectedDepartment) {
      fetchSections(selectedDepartment);
      setValue("section", "");
    } else {
      setSections([]);
    }
  }, [selectedDepartment, setValue]);

  const onSubmit = async (data) => {
    try {
      const res = await api.post(`${API_URL}/auth/register`, data);
      console.log("🚀 ~ onSubmit ~ res:", res.data);

      if (res) {
        toast.success("Registration successful!");
        toast.success("Please login to continue.");
        reset();
        navigate("/login");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error.response?.data?.msg || "Registration failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <Header />
      
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-gray-850/90 backdrop-blur-lg rounded-2xl shadow-2xl shadow-black/40 p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">
            Create Your Account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div>
              <input
                type="text"
                placeholder="Full Name"
                {...register("name")}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 
                           focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 
                           outline-none transition-all"
              />
              {errors.name && (
                <p className="text-sm text-red-400 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Email"
                {...register("email")}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 
                           focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 
                           outline-none transition-all"
              />
              {errors.email && (
                <p className="text-sm text-red-400 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* SAP ID */}
            <div>
              <input
                type="number"
                placeholder="SAP ID"
                {...register("sapId", { valueAsNumber: true })}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 
                           focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 
                           outline-none transition-all"
              />
              {errors.sapId && (
                <p className="text-sm text-red-400 mt-1">
                  {errors.sapId.message}
                </p>
              )}
            </div>

            {/* Location Dropdown */}
            <div>
              <select
                {...register("location")}
                disabled={loading.locations}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 
                           focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 
                           outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loading.locations ? "Loading locations..." : "Select Location"}
                </option>
                {locations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.location}
                  </option>
                ))}
              </select>
              {errors.location && (
                <p className="text-sm text-red-400 mt-1">
                  {errors.location.message}
                </p>
              )}
            </div>

            {/* Department Dropdown (only visible if location chosen) */}
            {selectedLocation && (
              <div>
                <select
                  {...register("department")}
                  disabled={loading.departments}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 
                             focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 
                             outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loading.departments
                      ? "Loading departments..."
                      : "Select Department"}
                  </option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="text-sm text-red-400 mt-1">
                    {errors.department.message}
                  </p>
                )}
              </div>
            )}

            {/* Section Dropdown (only visible if department chosen) */}
            {selectedDepartment && (
              <div>
                <select
                  {...register("section")}
                  disabled={loading.sections}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 
                             focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 
                             outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loading.sections ? "Loading sections..." : "Select Section"}
                  </option>
                  {sections.map((sec) => (
                    <option key={sec._id} value={sec._id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
                {errors.section && (
                  <p className="text-sm text-red-400 mt-1">
                    {errors.section.message}
                  </p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <input
                type="password"
                placeholder="Password"
                {...register("password")}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 
                           focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 
                           outline-none transition-all"
              />
              {errors.password && (
                <p className="text-sm text-red-400 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <input
                type="password"
                placeholder="Confirm Password"
                {...register("confirmPassword")}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 
                           focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 
                           outline-none transition-all"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-400 mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Login Redirect */}
            <div className="flex items-center justify-center">
              <label className="flex items-center text-sm text-gray-400">
                Already Registered?
                
                  <a href="/login"
                  className="ml-2 text-emerald-400 hover:underline"
                >
                  Login here
                </a>
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 
                         transition-all font-semibold shadow-lg shadow-emerald-500/30 
                         focus:ring-2 focus:ring-emerald-300/50 cursor-pointer"
            >
              Register
            </button>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default RegisterForm;