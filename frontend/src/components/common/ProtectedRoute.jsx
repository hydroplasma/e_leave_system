import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ProtectedRoute - Component สำหรับป้องกันเส้นทางที่ต้อง login
 * @param {Object} props
 * @param {React.Component} props.children - Component ที่ต้องการป้องกัน
 * @param {Array|String} props.roles - บทบาทที่อนุญาตให้เข้าถึง (optional)
 */
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, user, hasPermission } = useAuth();

  // รอโหลดข้อมูล authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner w-12 h-12 border-4 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  // ถ้ายังไม่ได้ login ให้ redirect ไป login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ถ้ากำหนด roles และผู้ใช้ไม่มีสิทธิ์
  if (roles && !hasPermission(roles)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="card max-w-md w-full mx-4">
          <div className="card-body text-center p-8">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              คุณไม่มีสิทธิ์เข้าถึง
            </h2>
            <p className="text-gray-600 mb-6">
              คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ
            </p>
            <button
              onClick={() => window.history.back()}
              className="btn-primary"
            >
              ย้อนกลับ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ถ้าผ่านการตรวจสอบทั้งหมด ให้แสดง children
  return children;
};

export default ProtectedRoute;
