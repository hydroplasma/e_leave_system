import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { leaveRequestAPI, leaveTypeAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaEye, FaCheck, FaTimes, FaFilter, FaSearch, FaDownload } from 'react-icons/fa';

const LeaveList = () => {
  const { user, isAdmin, isHead } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    leaveType: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadLeaveTypes();
    loadLeaves();
  }, [filters]);

  const loadLeaveTypes = async () => {
    try {
      const response = await leaveTypeAPI.getAll({ status: 'active' });
      if (response.success) {
        setLeaveTypes(response.data);
      }
    } catch (error) {
      console.error('Load leave types error:', error);
    }
  };

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const response = await leaveRequestAPI.getAll(filters);
      
      if (response.success) {
        setLeaves(response.data.leaves);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Load leaves error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadLeaves();
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      status: '',
      leaveType: '',
      search: '',
      startDate: '',
      endDate: ''
    });
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleApprove = async (leaveId) => {
    if (!window.confirm('คุณต้องการอนุมัติใบลานี้หรือไม่?')) return;

    try {
      const response = await leaveRequestAPI.approve(leaveId);
      if (response.success) {
        toast.success('อนุมัติใบลาสำเร็จ');
        loadLeaves();
      }
    } catch (error) {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    }
  };

  const handleReject = async (leaveId) => {
    const reason = window.prompt('กรุณาระบุเหตุผลในการปฏิเสธ:');
    if (!reason) return;

    try {
      const response = await leaveRequestAPI.reject(leaveId, reason);
      if (response.success) {
        toast.success('ปฏิเสธใบลาสำเร็จ');
        loadLeaves();
      }
    } catch (error) {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'รออนุมัติ', class: 'badge-warning' },
      approved: { label: 'อนุมัติ', class: 'badge-success' },
      rejected: { label: 'ไม่อนุมัติ', class: 'badge-danger' },
      cancelled: { label: 'ยกเลิก', class: 'badge-gray' },
      draft: { label: 'แบบร่าง', class: 'badge-gray' }
    };

    const config = statusConfig[status] || { label: status, class: 'badge-gray' };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const canApprove = (leave) => {
    if (!isAdmin() && !isHead()) return false;
    if (leave.status !== 'pending') return false;
    if (leave.user_id === user.id) return false; // ไม่สามารถอนุมัติของตัวเอง
    return true;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">รายการใบลา</h1>
            <p className="text-gray-600 mt-1">
              {isAdmin() ? 'ใบลาทั้งหมดในระบบ' : isHead() ? 'ใบลาในแผนกของคุณ' : 'ใบลาของคุณ'}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline flex items-center gap-2"
          >
            <FaFilter /> {showFilters ? 'ซ่อนตัวกรอง' : 'แสดงตัวกรอง'}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="card mb-4 animate-fadeIn">
            <div className="card-body">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ค้นหา
                    </label>
                    <input
                      type="text"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      className="input"
                      placeholder="ชื่อ, รหัส, เหตุผล..."
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      สถานะ
                    </label>
                    <select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="input"
                    >
                      <option value="">-- ทั้งหมด --</option>
                      <option value="pending">รออนุมัติ</option>
                      <option value="approved">อนุมัติแล้ว</option>
                      <option value="rejected">ไม่อนุมัติ</option>
                      <option value="cancelled">ยกเลิก</option>
                    </select>
                  </div>

                  {/* Leave Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ประเภทการลา
                    </label>
                    <select
                      name="leaveType"
                      value={filters.leaveType}
                      onChange={handleFilterChange}
                      className="input"
                    >
                      <option value="">-- ทั้งหมด --</option>
                      {leaveTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ช่วงวันที่
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                        className="input flex-1"
                      />
                      <span className="self-center">-</span>
                      <input
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                        className="input flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button type="submit" className="btn-primary flex items-center gap-2">
                    <FaSearch /> ค้นหา
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn-outline"
                  >
                    ล้างตัวกรอง
                  </button>
                  <button
                    type="button"
                    onClick={() => {/* TODO: Export */}}
                    className="btn-success flex items-center gap-2 ml-auto"
                  >
                    <FaDownload /> Export Excel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">รออนุมัติ</p>
            <p className="text-3xl font-bold text-warning-600">
              {leaves.filter(l => l.status === 'pending').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">อนุมัติแล้ว</p>
            <p className="text-3xl font-bold text-success-600">
              {leaves.filter(l => l.status === 'approved').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">ไม่อนุมัติ</p>
            <p className="text-3xl font-bold text-danger-600">
              {leaves.filter(l => l.status === 'rejected').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">ทั้งหมด</p>
            <p className="text-3xl font-bold text-primary-600">
              {pagination.total}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="spinner w-12 h-12 border-4 mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">ไม่พบข้อมูลใบลา</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>รหัส</th>
                    <th>ผู้ลา</th>
                    <th>ประเภท</th>
                    <th>ช่วงเวลา</th>
                    <th>จำนวนวัน</th>
                    <th>สถานะ</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave.id} className={leave.is_urgent ? 'bg-warning-50' : ''}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{leave.request_code}</span>
                          {leave.is_urgent && (
                            <span className="badge badge-danger text-xs">ด่วน</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">{leave.user_name}</p>
                          <p className="text-sm text-gray-500">{leave.employee_code}</p>
                        </div>
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
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/leaves/${leave.id}`}
                            className="btn-outline btn-sm"
                            title="ดูรายละเอียด"
                          >
                            <FaEye />
                          </Link>
                          
                          {canApprove(leave) && (
                            <>
                              <button
                                onClick={() => handleApprove(leave.id)}
                                className="btn-success btn-sm"
                                title="อนุมัติ"
                              >
                                <FaCheck />
                              </button>
                              <button
                                onClick={() => handleReject(leave.id)}
                                className="btn-danger btn-sm"
                                title="ปฏิเสธ"
                              >
                                <FaTimes />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="card-footer flex items-center justify-between">
            <div className="text-sm text-gray-600">
              แสดง {((pagination.page - 1) * pagination.limit) + 1} ถึง{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} จาก{' '}
              {pagination.total} รายการ
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-outline btn-sm"
              >
                ก่อนหน้า
              </button>
              
              {[...Array(pagination.totalPages)].map((_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= pagination.page - 1 && page <= pagination.page + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`btn-sm ${
                        page === pagination.page
                          ? 'btn-primary'
                          : 'btn-outline'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === pagination.page - 2 ||
                  page === pagination.page + 2
                ) {
                  return <span key={page}>...</span>;
                }
                return null;
              })}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="btn-outline btn-sm"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveList;
