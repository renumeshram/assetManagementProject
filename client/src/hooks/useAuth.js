import React from 'react';
import { AuthContext } from '../contexts/AuthContext';

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export { useAuth };