import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { leaveRequestAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaEye, FaCalendar, FaChartBar } from 'react-icons/fa';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';

const LeaveHistory = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [quotas, setQuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() + 543);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load leaves
      const leavesResponse = await leaveRequestAPI.getAll({
        userId: user.id,
        limit: 100
      });
      
      if (leavesResponse.success) {
        setLeaves(leavesResponse.data.leaves);
      }

      // Load quotas
      const meResponse = await authAPI.getMe();
      if (meResponse.success) {
        setQuotas(meResponse.data.leaveQuotas);
      }
    } catch (error) {
      console.error('Load data error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'รออนุมัติ', class: 'badge-warning' },
      approved: { label: 'อนุมัติ', class: 'badge-success' },
      rejected: { label: 'ไม่อนุมัติ', class: 'badge-danger' },
      cancelled: { label: 'ยกเลิก', class: 'badge-gray' }
    };
    const c = config[status] || { label: status, class: 'badge-gray' };
    return <span className={`badge ${c.class}`}>{c.label}</span>;
  };

  // Prepare chart data
  const leaveTypeData = quotas.map(q => ({
    name: q.name,
    used: q.used_days,
    remaining: q.remaining_days,
    total: q.total_days
  }));

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const count = leaves.filter(l => {
      const startMonth = new Date(l.start_date).getMonth() + 1;
      return startMonth === month;
    }).length;
    
    return {
      month: `${month}`,
      count
    };
  });

  const statusData = [
    { name: 'อนุมัติ', value: leaves.filter(l => l.status === 'approved').length },
    { name: 'รออนุมัติ', value: leaves.filter(l => l.status === 'pending').length },
    { name: 'ไม่อนุมัติ', value: leaves.filter(l => l.status === 'rejected').length },
    { name: 'ยกเลิก', value: leaves.filter(l => l.status === 'cancelled').length }
  ].filter(d => d.value > 0);

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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">ประวัติการลา</h1>
        <p className="text-gray-600">ประวัติการลาของคุณทั้งหมด</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">ยื่นใบลาทั้งหมด</p>
            <p className="text-3xl font-bold text-primary-600">{leaves.length}</p>
            <p className="text-xs text-gray-500 mt-1">ใบลา</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">อนุมัติแล้ว</p>
            <p className="text-3xl font-bold text-success-600">
              {leaves.filter(l => l.status === 'approved').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">ใบลา</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">รออนุมัติ</p>
            <p className="text-3xl font-bold text-warning-600">
              {leaves.filter(l => l.status === 'pending').length}
            </p>
            <p className="text-xs text-gray-500 mt-1">ใบลา</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">จำนวนวันรวม</p>
            <p className="text-3xl font-bold text-gray-800">
              {leaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.total_days, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">วัน</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Leave Type Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaChartBar /> โควต้าการลาแต่ละประเภท
            </h2>
          </div>
          <div className="card-body">
            {leaveTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leaveTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="used" fill="#EF4444" name="ใช้ไป" />
                  <Bar dataKey="remaining" fill="#10B981" name="คงเหลือ" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">ไม่มีข้อมูล</p>
            )}
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold">สถานะใบลา</h2>
          </div>
          <div className="card-body">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">ไม่มีข้อมูล</p>
            )}
          </div>
        </div>
      </div>

      {/* Quota Table */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-xl font-bold">โควต้าการลา ปี {selectedYear}</h2>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>ประเภทการลา</th>
                  <th className="text-center">ทั้งหมด</th>
                  <th className="text-center">ใช้ไป</th>
                  <th className="text-center">รออนุมัติ</th>
                  <th className="text-center">คงเหลือ</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {quotas.map((quota) => (
                  <tr key={quota.code}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span style={{ color: quota.color }}>{quota.icon || '📄'}</span>
                        <span className="font-medium">{quota.name}</span>
                      </div>
                    </td>
                    <td className="text-center font-medium">{quota.total_days}</td>
                    <td className="text-center">
                      <span className="text-danger-600 font-medium">{quota.used_days}</span>
                    </td>
                    <td className="text-center">
                      <span className="text-warning-600 font-medium">{quota.pending_days}</span>
                    </td>
                    <td className="text-center">
                      <span className="text-success-600 font-bold">{quota.remaining_days}</span>
                    </td>
                    <td>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (quota.used_days / quota.total_days) > 0.8 ? 'bg-danger-600' :
                            (quota.used_days / quota.total_days) > 0.5 ? 'bg-warning-500' :
                            'bg-success-600'
                          }`}
                          style={{ width: `${(quota.used_days / quota.total_days) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Leave History Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaCalendar /> ประวัติการลาทั้งหมด
          </h2>
        </div>
        <div className="card-body p-0">
          {leaves.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">ยังไม่มีประวัติการลา</p>
              <Link to="/leaves/create" className="btn-primary mt-4">
                ยื่นใบลา
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>รหัส</th>
                    <th>ประเภท</th>
                    <th>ช่วงเวลา</th>
                    <th>จำนวนวัน</th>
                    <th>สถานะ</th>
                    <th>วันที่ยื่น</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave.id}>
                      <td>
                        <span className="font-mono text-sm">{leave.request_code}</span>
                      </td>
                      <td>
                        <span 
                          className="badge"
                          style={{ backgroundColor: leave.leave_type_color + '20', color: leave.leave_type_color }}
                        >
                          {leave.leave_type_name}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-sm">
                        {leave.start_date} ถึง {leave.end_date}
                      </td>
                      <td className="text-center font-medium">{leave.total_days}</td>
                      <td>{getStatusBadge(leave.status)}</td>
                      <td className="text-sm text-gray-600">
                        {new Date(leave.submitted_at).toLocaleDateString('th-TH')}
                      </td>
                      <td>
                        <Link
                          to={`/leaves/${leave.id}`}
                          className="btn-outline btn-sm flex items-center gap-1"
                        >
                          <FaEye /> ดู
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveHistory;
