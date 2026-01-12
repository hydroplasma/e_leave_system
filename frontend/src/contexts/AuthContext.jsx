import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ตรวจสอบ authentication เมื่อ app load
  useEffect(() => {
    checkAuth();
  }, []);

  // ตรวจสอบว่ายังล็อกอินอยู่หรือไม่
  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getMe();
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // เข้าสู่ระบบ
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        const { user, token, refreshToken } = response.data;
        
        // เก็บข้อมูลใน localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
        
        toast.success('เข้าสู่ระบบสำเร็จ');
        return { success: true, user };
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'เข้าสู่ระบบไม่สำเร็จ');
      return { success: false, message: error.message };
    }
  };

  // ออกจากระบบ
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // ลบข้อมูลจาก localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      setUser(null);
      setIsAuthenticated(false);
      
      toast.info('ออกจากระบบแล้ว');
    }
  };

  // เปลี่ยนรหัสผ่าน
  const changePassword = async (passwords) => {
    try {
      const response = await authAPI.changePassword(passwords);
      
      if (response.success) {
        toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
        return { success: true };
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error(error.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
      return { success: false, message: error.message };
    }
  };

  // ตรวจสอบสิทธิ์
  const hasPermission = (requiredRoles) => {
    if (!user || !requiredRoles) return false;
    
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    
    return user.role === requiredRoles;
  };

  // ตรวจสอบว่าเป็น Admin หรือไม่
  const isAdmin = () => {
    return hasPermission(['super_admin', 'director', 'vice_director']);
  };

  // ตรวจสอบว่าเป็นหัวหน้างานหรือไม่
  const isHead = () => {
    return hasPermission(['head', 'super_admin', 'director', 'vice_director']);
  };

  // อัพเดทข้อมูลผู้ใช้
  const updateUser = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    changePassword,
    hasPermission,
    isAdmin,
    isHead,
    updateUser,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook สำหรับใช้ Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
};

export default AuthContext;
