import React, { useState, useEffect } from "react";
import axios from "axios";
import { userRegisterSchema } from "../../schemas/authSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RegisterForm = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);

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

  // Load locations from public/location.json
  useEffect(() => {
    fetch("/location.json")
      .then((res) => res.json())
      .then((data) => {
        if (data?.locations?.length > 0) {
          setLocations(data.locations);
        }
      })
      .catch((err) => console.error("Failed to load locations.json:", err));
  }, []);

  // Watch for changes
  const selectedLocation = watch("location");
  const selectedDepartment = watch("department");

  // Update departments when location changes
  useEffect(() => {
    if (selectedLocation) {
      const loc = locations.find((l) => l.name === selectedLocation);
      if (loc) {
        setDepartments(loc.departments);
        setValue("department", "");
        setSections([]);
        setValue("section", "");
      }
    } else {
      setDepartments([]);
      setSections([]);
    }
  }, [selectedLocation, locations, setValue]);

  // Update sections when department changes
  useEffect(() => {
    if (selectedDepartment) {
      const dept = departments.find((d) => d.name === selectedDepartment);
      if (dept) {
        setSections(dept.sections);
        setValue("section", "");
      }
    } else {
      setSections([]);
    }
  }, [selectedDepartment, departments, setValue]);

  const onSubmit = async (data) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, data);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white px-4">
      <div className="w-full max-w-md bg-gray-850/90 backdrop-blur-lg rounded-2xl shadow-2xl shadow-black/40 p-8 mt-20">
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
              className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 
                         focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 
                         outline-none transition-all"
            >
              <option value="">Select Location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name}
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
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 
                           focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 
                           outline-none transition-all"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
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
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 
                           focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 
                           outline-none transition-all"
              >
                <option value="">Select Section</option>
                {sections.map((sec, idx) => (
                  <option key={idx} value={sec}>
                    {sec}
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
              <a
                href="/login"
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
  );
};

export default RegisterForm;
