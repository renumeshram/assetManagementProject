import React, { createContext, useState } from 'react';
import {jwtDecode} from 'jwt-decode';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('asset_manager_user');
      console.log("🚀 ~ AuthProvider ~ saved:", saved)
      if(!saved) return null;

      const decoded = jwtDecode(JSON.parse(saved).token);
      console.log("🚀 ~ AuthProvider ~ decoded:", decoded)
      return {
        ...JSON.parse(saved), role: decoded.role}
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    setUser({
      ...userData,
      role: jwtDecode(userData.token).role
    });
    try {
      sessionStorage.setItem('asset_manager_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to save user data');
    }
  };

  const logout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem('asset_manager_user');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Failed to remove user data');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };