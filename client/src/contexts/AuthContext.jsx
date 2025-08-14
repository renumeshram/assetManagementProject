import React, { createContext, useState } from 'react';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('asset_manager_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem('asset_manager_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to save user data');
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('asset_manager_user');
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