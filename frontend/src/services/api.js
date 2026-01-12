import axios from 'axios';

// สร้าง axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ส่ง cookies
});

// Request Interceptor - เพิ่ม token ทุกครั้งที่ส่ง request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - จัดการ errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // กรณี token หมดอายุ
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // พยายาม refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/refresh`,
            { refreshToken }
          );

          const { token, refreshToken: newRefreshToken } = response.data.data;
          
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // ถ้า refresh ไม่ได้ ให้ logout
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // กรณี server error อื่นๆ
    const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
    
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

// ==========================================
// Authentication APIs
// ==========================================
export const authAPI = {
  // เข้าสู่ระบบ
  login: (credentials) => api.post('/auth/login', credentials),
  
  // ออกจากระบบ
  logout: () => api.post('/auth/logout'),
  
  // ดึงข้อมูลผู้ใช้ปัจจุบัน
  getMe: () => api.get('/auth/me'),
  
  // เปลี่ยนรหัสผ่าน
  changePassword: (data) => api.post('/auth/change-password', data),
  
  // ขอรีเซ็ตรหัสผ่าน
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  // รีเฟรช token
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// ==========================================
// User Management APIs
// ==========================================
export const userAPI = {
  // ดึงรายการผู้ใช้ทั้งหมด
  getAll: (params) => api.get('/users', { params }),
  
  // ดึงข้อมูลผู้ใช้ตาม ID
  getById: (id) => api.get(`/users/${id}`),
  
  // สร้างผู้ใช้ใหม่
  create: (data) => api.post('/users', data),
  
  // อัพเดทข้อมูลผู้ใช้
  update: (id, data) => api.put(`/users/${id}`, data),
  
  // ลบผู้ใช้
  delete: (id) => api.delete(`/users/${id}`),
  
  // ระงับ/เปิดใช้งานผู้ใช้
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  
  // รีเซ็ตรหัสผ่าน
  resetPassword: (id) => api.post(`/users/${id}/reset-password`),
  
  // Import ผู้ใช้จาก Excel
  importFromExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// ==========================================
// Department APIs
// ==========================================
export const departmentAPI = {
  getAll: (params) => api.get('/departments', { params }),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// ==========================================
// Leave Type APIs
// ==========================================
export const leaveTypeAPI = {
  getAll: (params) => api.get('/leave-types', { params }),
  getById: (id) => api.get(`/leave-types/${id}`),
  create: (data) => api.post('/leave-types', data),
  update: (id, data) => api.put(`/leave-types/${id}`, data),
  delete: (id) => api.delete(`/leave-types/${id}`),
};

// ==========================================
// Leave Request APIs
// ==========================================
export const leaveRequestAPI = {
  // ดึงรายการใบลา
  getAll: (params) => api.get('/leaves', { params }),
  
  // ดึงใบลาตาม ID
  getById: (id) => api.get(`/leaves/${id}`),
  
  // สร้างใบลาใหม่
  create: (data) => api.post('/leaves', data),
  
  // อัพเดทใบลา
  update: (id, data) => api.put(`/leaves/${id}`, data),
  
  // ลบใบลา
  delete: (id) => api.delete(`/leaves/${id}`),
  
  // ยกเลิกใบลา
  cancel: (id, reason) => api.post(`/leaves/${id}/cancel`, { reason }),
  
  // อนุมัติใบลา
  approve: (id, comment) => api.post(`/leaves/${id}/approve`, { comment }),
  
  // ปฏิเสธใบลา
  reject: (id, reason) => api.post(`/leaves/${id}/reject`, { reason }),
  
  // อัพโหลดเอกสารแนบ
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/leaves/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // ลบเอกสารแนบ
  deleteAttachment: (leaveId, attachmentId) => 
    api.delete(`/leaves/${leaveId}/attachments/${attachmentId}`),
  
  // ดาวน์โหลดใบลา PDF
  downloadPDF: (id) => api.get(`/leaves/${id}/pdf`, { responseType: 'blob' }),
};

// ==========================================
// Leave Quota APIs
// ==========================================
export const leaveQuotaAPI = {
  // ดึงโควต้าของผู้ใช้
  getByUserId: (userId) => api.get(`/leave-quotas/user/${userId}`),
  
  // อัพเดทโควต้า
  update: (id, data) => api.put(`/leave-quotas/${id}`, data),
  
  // รีเซ็ตโควต้าทั้งหมด
  resetAll: (academicYearId) => api.post('/leave-quotas/reset', { academicYearId }),
};

// ==========================================
// Holiday APIs
// ==========================================
export const holidayAPI = {
  getAll: (params) => api.get('/holidays', { params }),
  getById: (id) => api.get(`/holidays/${id}`),
  create: (data) => api.post('/holidays', data),
  update: (id, data) => api.put(`/holidays/${id}`, data),
  delete: (id) => api.delete(`/holidays/${id}`),
  importFromFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/holidays/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// ==========================================
// Notification APIs
// ==========================================
export const notificationAPI = {
  // ดึงการแจ้งเตือนทั้งหมด
  getAll: (params) => api.get('/notifications', { params }),
  
  // ทำเครื่องหมายว่าอ่านแล้ว
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  
  // ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
  markAllAsRead: () => api.post('/notifications/read-all'),
  
  // ลบการแจ้งเตือน
  delete: (id) => api.delete(`/notifications/${id}`),
  
  // ดึงจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// ==========================================
// Report APIs
// ==========================================
export const reportAPI = {
  // รายงานสรุปการลา
  getSummary: (params) => api.get('/reports/summary', { params }),
  
  // รายงานการลารายบุคคล
  getByUser: (userId, params) => api.get(`/reports/user/${userId}`, { params }),
  
  // รายงานการลารายแผนก
  getByDepartment: (departmentId, params) => 
    api.get(`/reports/department/${departmentId}`, { params }),
  
  // Export รายงานเป็น Excel
  exportExcel: (params) => 
    api.get('/reports/export/excel', { params, responseType: 'blob' }),
  
  // Export รายงานเป็น PDF
  exportPDF: (params) => 
    api.get('/reports/export/pdf', { params, responseType: 'blob' }),
};

// ==========================================
// Dashboard APIs
// ==========================================
export const dashboardAPI = {
  // สถิติภาพรวม
  getStats: () => api.get('/dashboard/stats'),
  
  // กราฟการลา
  getCharts: (params) => api.get('/dashboard/charts', { params }),
  
  // ใบลาล่าสุด
  getRecentLeaves: (limit = 10) => api.get('/dashboard/recent-leaves', { params: { limit } }),
};

// ==========================================
// Settings APIs
// ==========================================
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  getByKey: (key) => api.get(`/settings/${key}`),
  update: (key, value) => api.put(`/settings/${key}`, { value }),
  updateMultiple: (settings) => api.put('/settings/bulk', settings),
};

export default api;
