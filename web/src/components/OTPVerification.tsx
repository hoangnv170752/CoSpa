/* eslint-disable no-unused-vars */
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../services/api';

interface OTPVerificationProps {
  email: string;
  onVerificationSuccess: () => void;
  onBack: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ email, onVerificationSuccess, onBack }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { setLoading, login } = useAuth();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.verifyOTP(email, otp);
      console.log('OTP verification successful:', response);

      // If verification includes login token, log the user in
      if (response.token) {
        login(response.user as { username?: string; email?: string }, response.token);
      }

      onVerificationSuccess();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Mã OTP không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      await authAPI.sendOTP(email);
      setCountdown(60);
      setCanResend(false);
      setOtp('');
    } catch {
      setError('Không thể gửi lại mã OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-form">
        <h2>Xác thực OTP</h2>
        <p>Chúng tôi đã gửi mã xác thực đến email: <strong>{email}</strong></p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Nhập mã OTP"
              value={otp}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
              maxLength={6}
              required
              className="otp-input"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={otp.length < 4}>
            Xác thực
          </button>
        </form>

        <div className="otp-actions">
          {canResend ? (
            <button onClick={handleResendOTP} className="resend-btn">
              Gửi lại mã OTP
            </button>
          ) : (
            <p className="countdown">
              Gửi lại mã sau {countdown}s
            </p>
          )}

          <button onClick={onBack} className="back-btn">
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
