import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../services/api';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select: boolean;
            cancel_on_tap_outside: boolean;
          }) => void;
          renderButton: (element: HTMLElement, config: {
            theme: string;
            size: string;
            width: number;
            text: string;
            shape: string;
            logo_alignment: string;
          }) => void;
        };
      };
    };
  }
}

interface AuthFormProps {
  onOTPRequired: (email: string) => void;
}

interface FormData {
  username: string;
  email: string;
  password: string;
  role: string;
}

const AuthForm: React.FC<AuthFormProps> = ({ onOTPRequired }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    role: 'FREELANCER'
  });
  const [error, setError] = useState('');
  const [googleInitialized, setGoogleInitialized] = useState(false);
  const { setLoading, login } = useAuth();

  // Initialize Google OAuth when component mounts
  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google && !googleInitialized) {
        console.log('Initializing Google OAuth...');
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              setError('');
              setLoading(true);
              console.log('Google OAuth callback:', response);

              const result = await authAPI.googleAuth(response.credential);
              console.log('Google auth successful:', result);
              login(result.user as { username?: string; email?: string }, result.token);
            } catch (error) {
              console.error('Google auth API error:', error);
              const err = error as { response?: { data?: { message?: string; error?: string } } };
              const errorMessage = err.response?.data?.message ||
                                 err.response?.data?.error ||
                                 'Đăng nhập Google thất bại';
              setError(errorMessage);
            } finally {
              setLoading(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        // Render the Google Sign-In button
        const buttonElement = document.getElementById('google-signin-button');
        if (buttonElement) {
          window.google.accounts.id.renderButton(buttonElement, {
            theme: 'filled_blue',
            size: 'large',
            width: 350,
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          });
        }

        setGoogleInitialized(true);
      }
    };

    // Check if Google script is loaded
    if (window.google) {
      initializeGoogle();
    } else {
      // Wait for Google script to load
      const checkGoogle = setInterval(() => {
        if (window.google) {
          initializeGoogle();
          clearInterval(checkGoogle);
        }
      }, 100);

      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkGoogle), 10000);
    }
  }, [googleInitialized, login, setLoading]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login user with username
        console.log('Attempting login with:', { username: formData.username });
        const response = await authAPI.login(formData.username, formData.password);
        console.log('Login successful:', response);
        login(response.user as { username?: string; email?: string }, response.token);
      } else {
        // Register user
        console.log('Attempting registration with:', formData);
        const response = await authAPI.register(formData);
        console.log('Registration successful:', response);

        // After successful registration, send OTP
        console.log('Sending OTP to:', formData.email);
        await authAPI.sendOTP(formData.email);
        onOTPRequired(formData.email);
      }
    } catch (err) {
      console.error('Auth error:', err);
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error.response?.data?.message || error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{isLogin ? 'Đăng nhập' : 'Đăng ký'}</h2>

        {error && <div className="error-message">{error}</div>}

        <div className="google-signin-container">
          <div id="google-signin-button" className="google-signin-button"></div>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <input
                type="text"
                name="username"
                placeholder="Tên đăng nhập"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <input
              type={isLogin ? "text" : "email"}
              name={isLogin ? "username" : "email"}
              placeholder={isLogin ? "Tên đăng nhập" : "Email"}
              value={isLogin ? formData.username : formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="FREELANCER">Freelancer</option>
                <option value="WORKSPACE_OWNER">Workspace Owner</option>
              </select>
            </div>
          )}

          <button type="submit" className="submit-btn">
            {isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        <p className="toggle-form">
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="toggle-btn"
          >
            {isLogin ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
