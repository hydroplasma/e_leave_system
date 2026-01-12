import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LeaveCreate from './pages/leaves/LeaveCreate';
import LeaveList from './pages/leaves/LeaveList';
import LeaveHistory from './pages/leaves/LeaveHistory';
import LeaveDetail from './pages/leaves/LeaveDetail';
// import UserManagement from './pages/users/UserManagement';
// import Reports from './pages/reports/Reports';
// import Settings from './pages/settings/Settings';
// import Profile from './pages/profile/Profile';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Leave Routes */}
          <Route
            path="/leaves/create"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <LeaveCreate />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/leaves"
            element={
              <ProtectedRoute roles={['super_admin', 'director', 'vice_director', 'head', 'staff']}>
                <MainLayout>
                  <LeaveList />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/leaves/history"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <LeaveHistory />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/leaves/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <LeaveDetail />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* User Management Routes */}
          {/* <Route
            path="/users"
            element={
              <ProtectedRoute roles={['super_admin', 'director', 'staff']}>
                <MainLayout>
                  <UserManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          /> */}

          {/* Reports Routes */}
          {/* <Route
            path="/reports"
            element={
              <ProtectedRoute roles={['super_admin', 'director', 'vice_director', 'head', 'staff']}>
                <MainLayout>
                  <Reports />
                </MainLayout>
              </ProtectedRoute>
            }
          /> */}

          {/* Settings Routes */}
          {/* <Route
            path="/settings"
            element={
              <ProtectedRoute roles={['super_admin', 'director']}>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </ProtectedRoute>
            }
          /> */}

          {/* Profile Routes */}
          {/* <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </ProtectedRoute>
            }
          /> */}

          {/* 404 Page */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                  <h1 className="text-9xl font-bold text-gray-300">404</h1>
                  <p className="text-2xl text-gray-600 mb-4">ไม่พบหน้าที่คุณต้องการ</p>
                  <a href="/dashboard" className="btn-primary">
                    กลับหน้าหลัก
                  </a>
                </div>
              </div>
            }
          />
        </Routes>

        {/* Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
