import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ถ้าล็อกอินแล้ว redirect ไป dashboard
  if (isAuthenticated && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(''); // ล้าง error เมื่อพิมพ์ใหม่
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation
    if (!formData.username || !formData.password) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(formData);
      
      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <span className="text-4xl">🏫</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            ระบบบริหารจัดการการลา
          </h1>
          <p className="text-primary-100">
            โรงเรียนวงศ์ไววิทยา
          </p>
        </div>

        {/* Login Form */}
        <div className="card animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="card-body p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              เข้าสู่ระบบ
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อผู้ใช้
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="กรอกชื่อผู้ใช้หรืออีเมล"
                    autoFocus
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input pl-10 pr-10"
                    placeholder="กรอกรหัสผ่าน"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FaEye className="text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    จดจำการเข้าสู่ระบบ
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  disabled={isLoading}
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 text-base font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </button>
            </form>

            {/* Demo Accounts Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-2 font-semibold">
                บัญชีทดสอบ:
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>👤 Admin: <code className="bg-white px-2 py-0.5 rounded">admin</code></p>
                <p>👨‍🏫 ครู: <code className="bg-white px-2 py-0.5 rounded">teacher01</code></p>
                <p>🔑 Password: <code className="bg-white px-2 py-0.5 rounded">Password123!</code></p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-primary-100 text-sm">
          <p>© 2025 E-Leave System v1.0</p>
          <p className="mt-1">Developed by Kru Black</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
