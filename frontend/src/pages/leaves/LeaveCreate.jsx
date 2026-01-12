import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { leaveRequestAPI, leaveTypeAPI, userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaArrowRight, FaCheck, FaUpload } from 'react-icons/fa';

const LeaveCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    start_period: 'full_day',
    end_period: 'full_day',
    total_days: 0,
    reason: '',
    contact_address: '',
    contact_phone: user?.phone || '',
    substitute_teacher_id: '',
    substitute_note: '',
    is_urgent: false,
    is_emergency: false
  });

  const [files, setFiles] = useState([]);

  useEffect(() => {
    loadLeaveTypes();
    loadTeachers();
  }, []);

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

  const loadTeachers = async () => {
    try {
      const response = await userAPI.getAll({ role: 'teacher', status: 'active', limit: 100 });
      if (response.success) {
        setTeachers(response.data.users.filter(t => t.id !== user.id));
      }
    } catch (error) {
      console.error('Load teachers error:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto calculate days
    if (name === 'start_date' || name === 'end_date') {
      calculateTotalDays({...formData, [name]: value});
    }
  };

  const calculateTotalDays = (data) => {
    if (data.start_date && data.end_date) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      setFormData(prev => ({ ...prev, total_days: diffDays }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.leave_type_id) {
          toast.error('กรุณาเลือกประเภทการลา');
          return false;
        }
        return true;
      case 2:
        if (!formData.start_date || !formData.end_date) {
          toast.error('กรุณาเลือกวันที่ลา');
          return false;
        }
        if (!formData.reason.trim()) {
          toast.error('กรุณาระบุเหตุผลการลา');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Create leave request
      const response = await leaveRequestAPI.create(formData);

      if (response.success) {
        // Upload files if any
        if (files.length > 0) {
          for (const file of files) {
            await leaveRequestAPI.uploadAttachment(response.data.id, file);
          }
        }

        toast.success('ยื่นใบลาสำเร็จ');
        navigate('/leaves/history');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการยื่นใบลา');
    } finally {
      setLoading(false);
    }
  };

  const selectedLeaveType = leaveTypes.find(lt => lt.id === parseInt(formData.leave_type_id));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="btn-outline mb-4 flex items-center gap-2"
        >
          <FaArrowLeft /> ย้อนกลับ
        </button>
        <h1 className="text-3xl font-bold text-gray-800">ยื่นใบลา</h1>
        <p className="text-gray-600 mt-2">กรอกข้อมูลเพื่อยื่นขอลา</p>
      </div>

      {/* Progress Steps */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                    currentStep >= step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step ? <FaCheck /> : step}
                  </div>
                  <p className="text-sm mt-2 text-gray-600">
                    {step === 1 && 'เลือกประเภท'}
                    {step === 2 && 'กรอกข้อมูล'}
                    {step === 3 && 'ยืนยัน'}
                  </p>
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    currentStep > step ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Step 1: Select Leave Type */}
      {currentStep === 1 && (
        <div className="card animate-fadeIn">
          <div className="card-header">
            <h2 className="text-xl font-bold">เลือกประเภทการลา</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leaveTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFormData(prev => ({ ...prev, leave_type_id: type.id }))}
                  className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-lg ${
                    formData.leave_type_id === type.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{type.icon || '📄'}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{type.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {type.max_days_per_year ? (
                          <span className="badge badge-primary">
                            สูงสุด {type.max_days_per_year} วัน/ปี
                          </span>
                        ) : (
                          <span className="badge badge-gray">ไม่จำกัด</span>
                        )}
                        {type.is_paid_leave && (
                          <span className="badge badge-success">ได้รับเงินเดือน</span>
                        )}
                        {type.require_document && (
                          <span className="badge badge-warning">ต้องแนบเอกสาร</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Fill Details */}
      {currentStep === 2 && (
        <div className="card animate-fadeIn">
          <div className="card-header">
            <h2 className="text-xl font-bold">กรอกรายละเอียด</h2>
          </div>
          <div className="card-body space-y-6">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่เริ่มต้น *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่สิ้นสุด *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  min={formData.start_date}
                  className="input"
                  required
                />
              </div>
            </div>

            {/* Total Days */}
            {formData.total_days > 0 && (
              <div className="bg-primary-50 p-4 rounded-lg">
                <p className="text-primary-800 font-medium">
                  จำนวนวันที่ลา: <span className="text-2xl font-bold">{formData.total_days}</span> วัน
                </p>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เหตุผลการลา *
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows={4}
                className="input"
                placeholder="ระบุเหตุผลการลาอย่างละเอียด..."
                required
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ที่อยู่ระหว่างลา
                </label>
                <textarea
                  name="contact_address"
                  value={formData.contact_address}
                  onChange={handleChange}
                  rows={3}
                  className="input"
                  placeholder="ที่อยู่ที่สามารถติดต่อได้..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทรติดต่อ
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  className="input"
                  placeholder="08X-XXX-XXXX"
                />
              </div>
            </div>

            {/* Substitute Teacher */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ครูสอนแทน (ถ้ามี)
              </label>
              <select
                name="substitute_teacher_id"
                value={formData.substitute_teacher_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">-- เลือกครูสอนแทน --</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name} ({teacher.position})
                  </option>
                ))}
              </select>
            </div>

            {formData.substitute_teacher_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุสำหรับครูสอนแทน
                </label>
                <textarea
                  name="substitute_note"
                  value={formData.substitute_note}
                  onChange={handleChange}
                  rows={3}
                  className="input"
                  placeholder="ระบุรายละเอียดการสอนแทน, วิชา, ชั้น, เนื้อหา..."
                />
              </div>
            )}

            {/* File Upload */}
            {selectedLeaveType?.require_document && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เอกสารแนบ (จำเป็น)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FaUpload className="mx-auto text-4xl text-gray-400 mb-2" />
                    <p className="text-gray-600">คลิกเพื่ออัปโหลดเอกสาร</p>
                    <p className="text-sm text-gray-500 mt-1">
                      รองรับ PDF, JPG, PNG (สูงสุด 5MB)
                    </p>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-danger-600 hover:text-danger-700"
                        >
                          ลบ
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Urgent/Emergency */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_urgent"
                  checked={formData.is_urgent}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-gray-700">ลาด่วน</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_emergency"
                  checked={formData.is_emergency}
                  onChange={handleChange}
                  className="w-4 h-4 text-danger-600"
                />
                <span className="text-sm text-gray-700">ลาฉุกเฉิน</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {currentStep === 3 && (
        <div className="card animate-fadeIn">
          <div className="card-header">
            <h2 className="text-xl font-bold">ยืนยันข้อมูล</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">ประเภทการลา</p>
                <p className="font-medium">{selectedLeaveType?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">จำนวนวัน</p>
                <p className="font-medium">{formData.total_days} วัน</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">วันที่เริ่มต้น</p>
                <p className="font-medium">{formData.start_date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">วันที่สิ้นสุด</p>
                <p className="font-medium">{formData.end_date}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">เหตุผลการลา</p>
              <p className="font-medium whitespace-pre-wrap">{formData.reason}</p>
            </div>

            {files.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">เอกสารแนบ ({files.length} ไฟล์)</p>
                <div className="space-y-1">
                  {files.map((file, index) => (
                    <p key={index} className="text-sm text-gray-700">• {file.name}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        {currentStep > 1 && (
          <button
            onClick={prevStep}
            className="btn-outline flex items-center gap-2"
            disabled={loading}
          >
            <FaArrowLeft /> ย้อนกลับ
          </button>
        )}

        <div className="ml-auto">
          {currentStep < 3 ? (
            <button
              onClick={nextStep}
              className="btn-primary flex items-center gap-2"
            >
              ถัดไป <FaArrowRight />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-success flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <FaCheck /> ยืนยันและส่งใบลา
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveCreate;
