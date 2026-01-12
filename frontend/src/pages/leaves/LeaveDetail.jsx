import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { leaveRequestAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, FaCheck, FaTimes, FaBan, FaDownload, 
  FaFileAlt, FaUser, FaCalendar, FaClock, FaComment 
} from 'react-icons/fa';

const LeaveDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isHead } = useAuth();
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadLeaveDetail();
  }, [id]);

  const loadLeaveDetail = async () => {
    try {
      setLoading(true);
      const response = await leaveRequestAPI.getById(id);
      
      if (response.success) {
        setLeave(response.data);
      }
    } catch (error) {
      console.error('Load leave detail error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      navigate('/leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    const comment = window.prompt('หมายเหตุ (ถ้ามี):');
    
    try {
      setActionLoading(true);
      const response = await leaveRequestAPI.approve(id, comment || '');
      
      if (response.success) {
        toast.success('อนุมัติใบลาสำเร็จ');
        loadLeaveDetail();
      }
    } catch (error) {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('กรุณาระบุเหตุผลในการปฏิเสธ:');
    if (!reason) return;

    try {
      setActionLoading(true);
      const response = await leaveRequestAPI.reject(id, reason);
      
      if (response.success) {
        toast.success('ปฏิเสธใบลาสำเร็จ');
        loadLeaveDetail();
      }
    } catch (error) {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const reason = window.prompt('กรุณาระบุเหตุผลในการยกเลิก:');
    if (!reason) return;

    if (!window.confirm('คุณต้องการยกเลิกใบลานี้หรือไม่?')) return;

    try {
      setActionLoading(true);
      const response = await leaveRequestAPI.cancel(id, reason);
      
      if (response.success) {
        toast.success('ยกเลิกใบลาสำเร็จ');
        loadLeaveDetail();
      }
    } catch (error) {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'รออนุมัติ', class: 'badge-warning', icon: FaClock },
      approved: { label: 'อนุมัติแล้ว', class: 'badge-success', icon: FaCheck },
      rejected: { label: 'ไม่อนุมัติ', class: 'badge-danger', icon: FaTimes },
      cancelled: { label: 'ยกเลิกแล้ว', class: 'badge-gray', icon: FaBan }
    };

    const config = statusConfig[status] || { label: status, class: 'badge-gray', icon: FaFileAlt };
    const Icon = config.icon;
    
    return (
      <span className={`badge ${config.class} text-lg px-4 py-2`}>
        <Icon className="inline mr-2" />
        {config.label}
      </span>
    );
  };

  const canApprove = () => {
    if (!leave) return false;
    if (!isAdmin() && !isHead()) return false;
    if (leave.status !== 'pending') return false;
    if (leave.user_id === user.id) return false;
    return true;
  };

  const canCancel = () => {
    if (!leave) return false;
    if (leave.user_id !== user.id) return false;
    if (leave.status !== 'pending') return false;
    return true;
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

  if (!leave) {
    return (
      <div className="p-6">
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-gray-500 text-lg">ไม่พบข้อมูลใบลา</p>
            <button onClick={() => navigate('/leaves')} className="btn-primary mt-4">
              กลับหน้ารายการ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="btn-outline mb-4 flex items-center gap-2"
        >
          <FaArrowLeft /> ย้อนกลับ
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">รายละเอียดใบลา</h1>
            <p className="text-gray-600 font-mono">{leave.request_code}</p>
          </div>
          <div>
            {getStatusBadge(leave.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaFileAlt /> ข้อมูลการลา
              </h2>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ประเภทการลา</p>
                  <p className="font-medium text-lg" style={{ color: leave.leave_type_color }}>
                    {leave.leave_type_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">จำนวนวัน</p>
                  <p className="font-bold text-2xl text-primary-600">{leave.total_days} วัน</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">วันที่เริ่มต้น</p>
                  <p className="font-medium">{leave.start_date}</p>
                  <p className="text-sm text-gray-500">
                    {leave.start_period === 'full_day' ? 'ทั้งวัน' : 
                     leave.start_period === 'morning' ? 'เช้า' : 'บ่าย'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">วันที่สิ้นสุด</p>
                  <p className="font-medium">{leave.end_date}</p>
                  <p className="text-sm text-gray-500">
                    {leave.end_period === 'full_day' ? 'ทั้งวัน' : 
                     leave.end_period === 'morning' ? 'เช้า' : 'บ่าย'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">เหตุผลการลา</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{leave.reason}</p>
                </div>
              </div>

              {leave.contact_address && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">ที่อยู่ระหว่างลา</p>
                  <p className="text-gray-700">{leave.contact_address}</p>
                </div>
              )}

              {leave.contact_phone && (
                <div>
                  <p className="text-sm text-gray-600">เบอร์โทรติดต่อ</p>
                  <p className="font-medium">{leave.contact_phone}</p>
                </div>
              )}

              {leave.substitute_teacher_name && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">ครูสอนแทน</p>
                  <div className="flex items-center gap-3 bg-primary-50 p-3 rounded-lg">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                      {leave.substitute_teacher_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{leave.substitute_teacher_name}</p>
                      {leave.substitute_note && (
                        <p className="text-sm text-gray-600">{leave.substitute_note}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(leave.is_urgent || leave.is_emergency) && (
                <div className="flex items-center gap-3">
                  {leave.is_urgent && (
                    <span className="badge badge-warning">ลาด่วน</span>
                  )}
                  {leave.is_emergency && (
                    <span className="badge badge-danger">ลาฉุกเฉิน</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          {leave.attachments && leave.attachments.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold">เอกสารแนบ ({leave.attachments.length})</h2>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  {leave.attachments.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-center gap-3">
                        <FaFileAlt className="text-2xl text-primary-600" />
                        <div>
                          <p className="font-medium">{file.file_name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.file_size / 1024).toFixed(2)} KB • {new Date(file.uploaded_at).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(file.file_path, '_blank')}
                        className="btn-outline btn-sm flex items-center gap-2"
                      >
                        <FaDownload /> ดาวน์โหลด
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Approval Workflow */}
          {leave.workflow && leave.workflow.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FaComment /> ขั้นตอนการอนุมัติ
                </h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {leave.workflow.map((step, index) => (
                    <div key={step.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          step.status === 'approved' ? 'bg-success-600 text-white' :
                          step.status === 'rejected' ? 'bg-danger-600 text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {step.status === 'approved' ? <FaCheck /> :
                           step.status === 'rejected' ? <FaTimes /> :
                           index + 1}
                        </div>
                        {index < leave.workflow.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-300"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{step.approver_name}</p>
                            <p className="text-sm text-gray-600">{step.approver_position}</p>
                          </div>
                          <span className={`badge ${
                            step.status === 'approved' ? 'badge-success' :
                            step.status === 'rejected' ? 'badge-danger' :
                            'badge-warning'
                          }`}>
                            {step.status === 'approved' ? 'อนุมัติแล้ว' :
                             step.status === 'rejected' ? 'ปฏิเสธ' :
                             'รออนุมัติ'}
                          </span>
                        </div>
                        {step.comment && (
                          <div className="bg-gray-50 p-3 rounded-lg mt-2">
                            <p className="text-sm text-gray-700">{step.comment}</p>
                          </div>
                        )}
                        {step.decision_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(step.decision_at).toLocaleString('th-TH')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-bold flex items-center gap-2">
                <FaUser /> ผู้ยื่นใบลา
              </h3>
            </div>
            <div className="card-body">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                  {leave.user_name?.charAt(0)}
                </div>
                <h3 className="font-bold text-lg">{leave.user_name}</h3>
                <p className="text-sm text-gray-600">{leave.position}</p>
                <p className="text-sm text-gray-500">{leave.employee_code}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">แผนก:</span>
                  <span className="font-medium">{leave.department_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">อีเมล:</span>
                  <span className="font-medium">{leave.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">เบอร์:</span>
                  <span className="font-medium">{leave.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-bold flex items-center gap-2">
                <FaCalendar /> เส้นเวลา
              </h3>
            </div>
            <div className="card-body text-sm space-y-3">
              <div>
                <p className="text-gray-600">ยื่นใบลา</p>
                <p className="font-medium">{new Date(leave.submitted_at).toLocaleString('th-TH')}</p>
              </div>
              {leave.approved_at && (
                <div>
                  <p className="text-gray-600">อนุมัติเมื่อ</p>
                  <p className="font-medium">{new Date(leave.approved_at).toLocaleString('th-TH')}</p>
                </div>
              )}
              {leave.rejected_at && (
                <div>
                  <p className="text-gray-600">ปฏิเสธเมื่อ</p>
                  <p className="font-medium">{new Date(leave.rejected_at).toLocaleString('th-TH')}</p>
                </div>
              )}
              {leave.cancelled_at && (
                <div>
                  <p className="text-gray-600">ยกเลิกเมื่อ</p>
                  <p className="font-medium">{new Date(leave.cancelled_at).toLocaleString('th-TH')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <div className="card-body space-y-3">
              {canApprove() && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="w-full btn-success flex items-center justify-center gap-2"
                  >
                    <FaCheck /> อนุมัติใบลา
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="w-full btn-danger flex items-center justify-center gap-2"
                  >
                    <FaTimes /> ปฏิเสธใบลา
                  </button>
                </>
              )}

              {canCancel() && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="w-full btn-outline flex items-center justify-center gap-2 text-danger-600 border-danger-600 hover:bg-danger-50"
                >
                  <FaBan /> ยกเลิกใบลา
                </button>
              )}

              <button
                onClick={() => {/* TODO: Download PDF */}}
                className="w-full btn-outline flex items-center justify-center gap-2"
              >
                <FaDownload /> ดาวน์โหลด PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveDetail;
