import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI, leaveRequestAPI } from '../services/api';
import { FaClock, FaCheck, FaTimes, FaCalendarDay } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    today: 0
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, leavesResponse] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentLeaves(10)
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      if (leavesResponse.success) {
        setRecentLeaves(leavesResponse.data);
      }
    } catch (error) {
      console.error('Load dashboard error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, label, value, color, bgColor }) => (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
          </div>
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: bgColor }}
          >
            {icon}
          </div>
        </div>
      </div>
    </div>
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'รออนุมัติ', class: 'badge-warning' },
      approved: { label: 'อนุมัติ', class: 'badge-success' },
      rejected: { label: 'ไม่อนุมัติ', class: 'badge-danger' },
      cancelled: { label: 'ยกเลิก', class: 'badge-gray' },
      draft: { label: 'แบบร่าง', class: 'badge-gray' },
    };

    const config = statusConfig[status] || { label: status, class: 'badge-gray' };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner w-12 h-12 border-4 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          ภาพรวมระบบการลา
        </h1>
        <p className="text-gray-600">
          ยินดีต้อนรับ คุณ{user?.fullName} ({user?.position})
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<FaClock className="text-warning-500 text-2xl" />}
          label="รอการอนุมัติ"
          value={stats.pending}
          color="#F59E0B"
          bgColor="#FEF3C7"
        />
        <StatCard
          icon={<FaCheck className="text-success-500 text-2xl" />}
          label="อนุมัติแล้ว"
          value={stats.approved}
          color="#22C55E"
          bgColor="#DCFCE7"
        />
        <StatCard
          icon={<FaTimes className="text-danger-500 text-2xl" />}
          label="ไม่อนุมัติ"
          value={stats.rejected}
          color="#EF4444"
          bgColor="#FEE2E2"
        />
        <StatCard
          icon={<FaCalendarDay className="text-primary-500 text-2xl" />}
          label="จำนวนวันลารวม"
          value={stats.today}
          color="#3B82F6"
          bgColor="#DBEAFE"
        />
      </div>

      {/* Recent Leaves */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">ใบลาล่าสุด</h2>
          <button 
            onClick={() => window.location.href = '/leaves'}
            className="btn-outline text-sm"
          >
            ดูทั้งหมด
          </button>
        </div>
        <div className="card-body p-0">
          {recentLeaves.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>ยังไม่มีข้อมูลใบลา</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>ลำดับ</th>
                    <th>ผู้ลา</th>
                    <th>ประเภท</th>
                    <th>ช่วงเวลา</th>
                    <th>จำนวนวัน</th>
                    <th>สถานะ</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeaves.map((leave, index) => (
                    <tr key={leave.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div>
                          <p className="font-medium">{leave.userName}</p>
                          <p className="text-sm text-gray-500">{leave.employeeCode}</p>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: leave.leaveTypeColor }}>
                          {leave.leaveTypeName}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        {leave.startDate} - {leave.endDate}
                      </td>
                      <td className="text-center">{leave.totalDays} วัน</td>
                      <td>{getStatusBadge(leave.status)}</td>
                      <td>
                        <button 
                          onClick={() => window.location.href = `/leaves/${leave.id}`}
                          className="btn-outline btn-sm"
                        >
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => window.location.href = '/leaves/create'}
          className="card hover:shadow-lg transition-all group cursor-pointer"
        >
          <div className="card-body text-center py-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">ยื่นใบลา</h3>
            <p className="text-sm text-gray-600 mt-2">สร้างใบลาใหม่</p>
          </div>
        </button>

        <button
          onClick={() => window.location.href = '/leaves/history'}
          className="card hover:shadow-lg transition-all group cursor-pointer"
        >
          <div className="card-body text-center py-8">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-success-200 transition-colors">
              <span className="text-3xl">📚</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">ประวัติการลา</h3>
            <p className="text-sm text-gray-600 mt-2">ดูประวัติการลาทั้งหมด</p>
          </div>
        </button>

        <button
          onClick={() => window.location.href = '/reports'}
          className="card hover:shadow-lg transition-all group cursor-pointer"
        >
          <div className="card-body text-center py-8">
            <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-warning-200 transition-colors">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">รายงาน</h3>
            <p className="text-sm text-gray-600 mt-2">ดูสถิติและรายงาน</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
