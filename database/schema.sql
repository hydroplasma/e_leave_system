-- ================================================
-- E-Leave Management System Database Schema
-- Created: 2025
-- Author: Kru Black
-- ================================================

-- ตั้งค่า Character Set และ Collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- สร้างฐานข้อมูล
CREATE DATABASE IF NOT EXISTS e_leave_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE e_leave_system;

-- ================================================
-- 1. ตาราง users (ผู้ใช้งาน)
-- ================================================
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- ข้อมูลส่วนตัว
  title VARCHAR(50) COMMENT 'คำนำหน้า: นาย, นาง, นางสาว',
  full_name VARCHAR(255) NOT NULL,
  full_name_en VARCHAR(255),
  nickname VARCHAR(50),
  
  -- ข้อมูลการทำงาน
  employee_code VARCHAR(50) UNIQUE,
  position VARCHAR(100) COMMENT 'ตำแหน่ง: ครู, หัวหน้ากลุ่มสาระ',
  position_level VARCHAR(50) COMMENT 'วิทยฐานะ: ชำนาญการ, ชำนาญการพิเศษ',
  department_id BIGINT UNSIGNED,
  hire_date DATE,
  employment_type VARCHAR(50) DEFAULT 'permanent' COMMENT 'permanent, contract, probation',
  
  -- สิทธิ์และบทบาท
  role VARCHAR(50) NOT NULL DEFAULT 'teacher' COMMENT 'super_admin, director, vice_director, head, teacher, staff',
  status VARCHAR(20) DEFAULT 'active' COMMENT 'active, inactive, suspended',
  
  -- ข้อมูลติดต่อ
  phone VARCHAR(20),
  line_id VARCHAR(100),
  
  -- Security
  last_login TIMESTAMP NULL,
  login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by BIGINT UNSIGNED,
  updated_by BIGINT UNSIGNED,
  
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_department (department_id),
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 2. ตาราง departments (แผนก/กลุ่มสาระ)
-- ================================================
CREATE TABLE departments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description TEXT,
  head_id BIGINT UNSIGNED COMMENT 'หัวหน้ากลุ่มสาระ',
  parent_id BIGINT UNSIGNED COMMENT 'สำหรับสร้าง hierarchy',
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_code (code),
  INDEX idx_head (head_id),
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 3. ตาราง academic_years (ปีการศึกษา)
-- ================================================
CREATE TABLE academic_years (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  year VARCHAR(10) NOT NULL COMMENT '2569',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_year (year),
  INDEX idx_current (is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 4. ตาราง leave_types (ประเภทการลา)
-- ================================================
CREATE TABLE leave_types (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL COMMENT 'LV01, LV02, LV03',
  name VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description TEXT,
  
  -- โควต้า
  max_days_per_year DECIMAL(10,2) COMMENT 'จำนวนวันสูงสุดต่อปี, NULL = ไม่จำกัด',
  can_carry_forward BOOLEAN DEFAULT FALSE COMMENT 'สามารถยกยอดไปปีหน้าได้',
  max_carry_forward DECIMAL(10,2) COMMENT 'จำนวนวันสูงสุดที่ยกยอดได้',
  
  -- การคำนวณ
  calculation_type VARCHAR(50) DEFAULT 'working_days' COMMENT 'working_days, calendar_days, operational_days',
  
  -- เงื่อนไข
  is_paid_leave BOOLEAN DEFAULT TRUE,
  require_document BOOLEAN DEFAULT FALSE,
  require_advance_notice INT DEFAULT 0 COMMENT 'ต้องแจ้งล่วงหน้ากี่วัน',
  min_days DECIMAL(10,2) DEFAULT 0.5 COMMENT 'จำนวนวันขั้นต่ำ',
  max_consecutive_days DECIMAL(10,2) COMMENT 'จำนวนวันติดต่อกันสูงสุด',
  
  -- สิทธิ์การใช้งาน
  allowed_employment_types JSON COMMENT '["permanent", "contract"]',
  min_service_months INT DEFAULT 0 COMMENT 'ต้องทำงานมาแล้วกี่เดือน',
  
  -- แสดงผล
  color VARCHAR(7) DEFAULT '#3B82F6',
  icon VARCHAR(50),
  order_index INT DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_code (code),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 5. ตาราง leave_quotas (โควต้าการลาของแต่ละคน)
-- ================================================
CREATE TABLE leave_quotas (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  leave_type_id BIGINT UNSIGNED NOT NULL,
  academic_year_id BIGINT UNSIGNED NOT NULL,
  
  -- โควต้า
  total_days DECIMAL(10,2) NOT NULL COMMENT 'จำนวนวันทั้งหมดที่มีสิทธิ',
  used_days DECIMAL(10,2) DEFAULT 0 COMMENT 'จำนวนวันที่ใช้ไปแล้ว',
  pending_days DECIMAL(10,2) DEFAULT 0 COMMENT 'จำนวนวันที่รออนุมัติ',
  remaining_days DECIMAL(10,2) GENERATED ALWAYS AS (total_days - used_days - pending_days) STORED,
  carried_forward_days DECIMAL(10,2) DEFAULT 0 COMMENT 'วันลาสะสมจากปีที่แล้ว',
  
  -- สถานะ
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_user_leave_year (user_id, leave_type_id, academic_year_id),
  INDEX idx_user (user_id),
  INDEX idx_leave_type (leave_type_id),
  INDEX idx_year (academic_year_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 6. ตาราง leave_requests (ใบลา)
-- ================================================
CREATE TABLE leave_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_code VARCHAR(50) UNIQUE NOT NULL COMMENT 'LR2569-0001',
  
  user_id BIGINT UNSIGNED NOT NULL,
  leave_type_id BIGINT UNSIGNED NOT NULL,
  academic_year_id BIGINT UNSIGNED NOT NULL,
  
  -- ช่วงเวลา
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_period VARCHAR(20) DEFAULT 'full_day' COMMENT 'full_day, morning, afternoon',
  end_period VARCHAR(20) DEFAULT 'full_day',
  total_days DECIMAL(10,2) NOT NULL COMMENT 'จำนวนวันที่นับได้',
  
  -- รายละเอียด
  reason TEXT NOT NULL,
  contact_address TEXT COMMENT 'ที่อยู่ระหว่างลา',
  contact_phone VARCHAR(20),
  
  -- ครูสอนแทน
  substitute_teacher_id BIGINT UNSIGNED,
  substitute_note TEXT,
  
  -- สถานะ
  status VARCHAR(50) DEFAULT 'pending' COMMENT 'draft, pending, approved, rejected, cancelled',
  is_urgent BOOLEAN DEFAULT FALSE,
  is_emergency BOOLEAN DEFAULT FALSE,
  
  -- การอนุมัติ
  approved_by BIGINT UNSIGNED,
  approved_at TIMESTAMP NULL,
  rejected_by BIGINT UNSIGNED,
  rejected_at TIMESTAMP NULL,
  rejection_reason TEXT,
  cancelled_by BIGINT UNSIGNED,
  cancelled_at TIMESTAMP NULL,
  cancellation_reason TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user (user_id),
  INDEX idx_leave_type (leave_type_id),
  INDEX idx_status (status),
  INDEX idx_date_range (start_date, end_date),
  INDEX idx_request_code (request_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 7. ตาราง leave_attachments (เอกสารแนบ)
-- ================================================
CREATE TABLE leave_attachments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  leave_request_id BIGINT UNSIGNED NOT NULL,
  
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INT NOT NULL COMMENT 'in bytes',
  mime_type VARCHAR(100),
  
  description TEXT,
  
  uploaded_by BIGINT UNSIGNED NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_leave_request (leave_request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 8. ตาราง approval_workflows (ขั้นตอนการอนุมัติ)
-- ================================================
CREATE TABLE approval_workflows (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  leave_request_id BIGINT UNSIGNED NOT NULL,
  
  approver_id BIGINT UNSIGNED NOT NULL,
  approver_level INT NOT NULL COMMENT '1, 2, 3 (หัวหน้า, รอง, ผอ)',
  approver_role VARCHAR(50) NOT NULL,
  
  status VARCHAR(50) DEFAULT 'pending' COMMENT 'pending, approved, rejected, skipped',
  comment TEXT,
  decision_at TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_leave_request (leave_request_id),
  INDEX idx_approver (approver_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 9. ตาราง holidays (วันหยุดราชการ)
-- ================================================
CREATE TABLE holidays (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  name VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  type VARCHAR(50) DEFAULT 'public' COMMENT 'public, school, compensatory',
  is_recurring BOOLEAN DEFAULT FALSE COMMENT 'วันหยุดประจำปีหรือไม่',
  academic_year_id BIGINT UNSIGNED,
  
  description TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_date (date),
  INDEX idx_type (type),
  INDEX idx_year (academic_year_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 10. ตาราง notifications (การแจ้งเตือน)
-- ================================================
CREATE TABLE notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  
  type VARCHAR(50) NOT NULL COMMENT 'leave_submitted, leave_approved, leave_rejected, etc.',
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user (user_id),
  INDEX idx_read (is_read),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 11. ตาราง audit_logs (บันทึกการใช้งาน)
-- ================================================
CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED,
  
  action VARCHAR(100) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, LOGIN, LOGOUT',
  table_name VARCHAR(100),
  record_id BIGINT UNSIGNED,
  
  old_value JSON,
  new_value JSON,
  
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_table (table_name),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 12. ตาราง delegation_settings (การมอบหมายสิทธิ์)
-- ================================================
CREATE TABLE delegation_settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL COMMENT 'ผู้มอบหมาย',
  delegate_to BIGINT UNSIGNED NOT NULL COMMENT 'ผู้รับมอบหมาย',
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user (user_id),
  INDEX idx_delegate (delegate_to),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 13. ตาราง system_settings (การตั้งค่าระบบ)
-- ================================================
CREATE TABLE system_settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  data_type VARCHAR(20) DEFAULT 'string' COMMENT 'string, number, boolean, json',
  category VARCHAR(50) DEFAULT 'general',
  description TEXT,
  
  is_public BOOLEAN DEFAULT FALSE COMMENT 'แสดงให้ทุกคนเห็นหรือไม่',
  
  updated_by BIGINT UNSIGNED,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_key (setting_key),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 14. ตาราง leave_balance_history (ประวัติโควต้า)
-- ================================================
CREATE TABLE leave_balance_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  leave_type_id BIGINT UNSIGNED NOT NULL,
  academic_year_id BIGINT UNSIGNED NOT NULL,
  
  opening_balance DECIMAL(10,2) DEFAULT 0,
  earned DECIMAL(10,2) DEFAULT 0,
  used DECIMAL(10,2) DEFAULT 0,
  carried_forward DECIMAL(10,2) DEFAULT 0,
  closing_balance DECIMAL(10,2) DEFAULT 0,
  
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user (user_id),
  INDEX idx_snapshot (snapshot_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Foreign Keys
-- ================================================
ALTER TABLE users
  ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE departments
  ADD CONSTRAINT fk_departments_head FOREIGN KEY (head_id) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_departments_parent FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE leave_quotas
  ADD CONSTRAINT fk_quotas_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_quotas_leave_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_quotas_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE;

ALTER TABLE leave_requests
  ADD CONSTRAINT fk_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_requests_leave_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_requests_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_requests_substitute FOREIGN KEY (substitute_teacher_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE leave_attachments
  ADD CONSTRAINT fk_attachments_request FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_attachments_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE approval_workflows
  ADD CONSTRAINT fk_workflows_request FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_workflows_approver FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE holidays
  ADD CONSTRAINT fk_holidays_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE;

ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE audit_logs
  ADD CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE delegation_settings
  ADD CONSTRAINT fk_delegation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_delegation_delegate FOREIGN KEY (delegate_to) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE system_settings
  ADD CONSTRAINT fk_settings_updater FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE leave_balance_history
  ADD CONSTRAINT fk_balance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_balance_leave_type FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_balance_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE;
