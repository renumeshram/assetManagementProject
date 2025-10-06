import { useState, useEffect } from 'react';
import { User, Lock, ArrowLeft, CheckCircle, Clock } from 'lucide-react';

// Configure your API base URL
import api from "../../utils/api";
const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [sapId, setSapId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSapIdSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post(`${API_URL}/forgot-password/request-otp`,{ sapId });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      setMaskedEmail(data.maskedEmail);
      setStep(2);
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post(`${API_URL}/forgot-password/verify-otp`,{ sapId, otp: otpCode });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify OTP');
      }

      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    
    setOtp(['', '', '', '', '', '']);
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post(`${API_URL}/forgot-password/resend-otp`, { sapId });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      setResendTimer(60);
      setCanResend(false);
      
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successMsg.textContent = 'OTP resent successfully!';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post(`${API_URL}/forgot-password/reset-password`, { sapId, newPassword });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {step === 1 && 'Forgot Password'}
              {step === 2 && 'Verify OTP'}
              {step === 3 && 'Reset Password'}
              {step === 4 && 'Success!'}
            </h1>
            <p className="text-gray-400 text-sm">
              {step === 1 && 'Enter your SAP ID to receive verification code'}
              {step === 2 && `We've sent a code to ${maskedEmail}`}
              {step === 3 && 'Create your new password'}
              {step === 4 && 'Your password has been reset'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  SAP ID
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    value={sapId}
                    onChange={(e) => setSapId(e.target.value)}
                    className="w-full bg-gray-700 text-white pl-12 pr-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                    placeholder="Enter your SAP ID"
                  />
                </div>
              </div>

              <button
                onClick={handleSapIdSubmit}
                disabled={loading || !sapId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-4 text-center">
                  Enter 6-Digit Code
                </label>
                <div className="flex gap-2 justify-center mb-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 bg-gray-700 text-white text-center text-xl font-bold rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                    />
                  ))}
                </div>
                
                {resendTimer > 0 && (
                  <div className="flex items-center justify-center text-gray-400 text-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Resend OTP in {resendTimer}s</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleOtpSubmit}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                onClick={handleResendOtp}
                disabled={!canResend || loading}
                className={`w-full text-sm transition py-2 rounded-lg ${
                  canResend && !loading
                    ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? 'Resending...' : "Didn't receive code? Resend OTP"}
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-700 text-white pl-12 pr-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                    placeholder="Enter new password"
                  />
                </div>
                <p className="text-gray-500 text-xs mt-1">Must be at least 8 characters</p>
              </div>

              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-700 text-white pl-12 pr-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <button
                onClick={handlePasswordReset}
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <CheckCircle className="w-20 h-20 text-green-500" />
              </div>
              <p className="text-gray-300 mb-8">
                Your password has been successfully reset. You can now login with your new password.
              </p>
              <button
                onClick={() => {
                  setStep(1);
                  setSapId('');
                  setMaskedEmail('');
                  setOtp(['', '', '', '', '', '']);
                  setNewPassword('');
                  setConfirmPassword('');
                  setResendTimer(0);
                  setCanResend(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Back to Login
              </button>
            </div>
          )}

          {step > 1 && step < 4 && (
            <button
              onClick={() => {
                setStep(step - 1);
                setError('');
              }}
              className="mt-6 flex items-center justify-center w-full text-gray-400 hover:text-gray-300 text-sm transition"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
          )}
        </div>

        <div className="text-center mt-6">
          <a href="#" className="text-gray-500 hover:text-gray-400 text-sm transition">
            Remember your password? Sign in
          </a>
        </div>
      </div>
    </div>
  );
}