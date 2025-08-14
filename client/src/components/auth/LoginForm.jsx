import React, { useState } from 'react';
import { loginSchema } from '../../schemas/authSchemas';
import { mockUsers } from '../../data/mockData';
import { useAuth } from '../../hooks/useAuth';

const LoginForm = () => {
  const [formData, setFormData] = useState({ sapId: '', password: '' });
  const [errors, setErrors] = useState({});
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      loginSchema.parse(formData);
      
      // Mock authentication
      const mockUser = mockUsers.find(u => u.sapId === formData.sapId);
      if (mockUser) {
        login(mockUser);
      } else {
        setErrors({ sapId: 'Invalid credentials' });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = {};
        error.errors.forEach(err => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Asset Manager</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SAP ID
            </label>
            <input
              type="text"
              value={formData.sapId}
              onChange={(e) => setFormData({...formData, sapId: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your SAP ID"
            />
            {errors.sapId && <p className="text-red-500 text-sm mt-1">{errors.sapId}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
          
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Sign In
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Demo credentials: SAP001 (user), SAP002 (manager), SAP003 (admin)<br/>
            Password: any 6+ characters
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;