import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../../schemas/authSchemas";
import { mockUsers } from "../../data/mockData";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "react-hot-toast";
import axios from "axios";
import Header from "../common/Header";
import Footer from "../common/Footer";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const LoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      sapId: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, data);
      console.log("🚀 ~ onSubmit ~ res:", res.data);
      if (res.data) {
        login(res.data);
        toast.success("Login successful!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        error.response?.data?.msg || "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      <Header />
      
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-gray-850/90 backdrop-blur-lg rounded-2xl shadow-2xl shadow-black/40 p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Sign In</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* SAP ID */}
            <div>
              <input
                type="text"
                placeholder="SAP ID"
                {...register("sapId")}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 outline-none transition-all"
              />
              {errors.sapId && (
                <p className="text-sm text-red-400 mt-1">
                  {errors.sapId.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <input
                type="password"
                placeholder="Password"
                {...register("password")}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 outline-none transition-all"
              />
              {errors.password && (
                <p className="text-sm text-red-400 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition-all font-semibold shadow-lg shadow-emerald-500/30 focus:ring-2 focus:ring-emerald-300/50 cursor-pointer"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <a href="/register" className="text-emerald-400 hover:underline">
              Register here
            </a>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default LoginForm;