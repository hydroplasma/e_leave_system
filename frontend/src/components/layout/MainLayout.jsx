import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaHome, FaFileAlt, FaHistory, FaChartBar, FaUsers, 
  FaCog, FaBars, FaTimes, FaBell, FaSignOutAlt, FaUser
} from 'react-icons/fa';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const menuItems = [
    { 
      path: '/dashboard', 
      icon: FaHome, 
      label: 'หน้าหลัก',
      roles: ['all']
    },
    { 
      path: '/leaves/create', 
      icon: FaFileAlt, 
      label: 'ยื่นใบลา',
      roles: ['all']
    },
    { 
      path: '/leaves', 
      icon: FaFileAlt, 
      label: 'ใบลาทั้งหมด',
      roles: ['super_admin', 'director', 'vice_director', 'head', 'staff']
    },
    { 
      path: '/leaves/history', 
      icon: FaHistory, 
      label: 'ประวัติการลา',
      roles: ['all']
    },
    { 
      path: '/reports', 
      icon: FaChartBar, 
      label: 'รายงาน',
      roles: ['super_admin', 'director', 'vice_director', 'head', 'staff']
    },
    { 
      path: '/users', 
      icon: FaUsers, 
      label: 'จัดการผู้ใช้',
      roles: ['super_admin', 'director', 'staff']
    },
    { 
      path: '/settings', 
      icon: FaCog, 
      label: 'ตั้งค่า',
      roles: ['super_admin', 'director']
    },
  ];

  const hasAccess = (roles) => {
    if (roles.includes('all')) return true;
    return roles.includes(user?.role);
  };

  const handleLogout = async () => {
    if (window.confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-primary-700 to-primary-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-primary-600">
          {sidebarOpen ? (
            <>
              <div>
                <h1 className="text-xl font-bold">E-Leave</h1>
                <p className="text-xs text-primary-200">ระบบบริหารจัดการการลา</p>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="text-white hover:bg-primary-600 p-2 rounded-lg"
              >
                <FaTimes />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setSidebarOpen(true)}
              className="text-white hover:bg-primary-600 p-2 rounded-lg mx-auto"
            >
              <FaBars />
            </button>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              if (!hasAccess(item.roles)) return null;
              
              const isActive = location.pathname === item.path || 
                             location.pathname.startsWith(item.path + '/');
              const Icon = item.icon;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-lg transition-all
                      ${isActive 
                        ? 'bg-white text-primary-700 shadow-lg' 
                        : 'text-white hover:bg-primary-600'
                      }
                    `}
                    title={!sidebarOpen ? item.label : ''}
                  >
                    <Icon className="text-xl flex-shrink-0" />
                    {sidebarOpen && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-primary-600">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-700 font-bold">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.fullName}</p>
                <p className="text-xs text-primary-200 truncate">{user?.position}</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-700 font-bold mx-auto">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Breadcrumb หรือ Title */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {menuItems.find(item => item.path === location.pathname)?.label || 'หน้าหลัก'}
              </h2>
            </div>

            {/* Right Side - Notifications & Profile */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <FaBell className="text-xl" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium text-gray-800">{user?.fullName}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setShowProfileMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                      <div className="p-4 border-b border-gray-200">
                        <p className="font-medium text-gray-800">{user?.fullName}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                      <ul className="py-2">
                        <li>
                          <Link
                            to="/profile"
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <FaUser /> โปรไฟล์
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/settings"
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowProfileMenu(false)}
                          >
                            <FaCog /> ตั้งค่า
                          </Link>
                        </li>
                        <li className="border-t border-gray-200 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2 text-danger-600 hover:bg-danger-50 w-full"
                          >
                            <FaSignOutAlt /> ออกจากระบบ
                          </button>
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
