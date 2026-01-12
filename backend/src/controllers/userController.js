const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');
const { logActivity } = require('../middleware/auth');

/**
 * @route   GET /api/users
 * @desc    ดึงรายการผู้ใช้ทั้งหมด (พร้อม pagination และ filter)
 * @access  Private (Admin, Staff)
 */
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      department = '',
      status = 'active',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push(`(u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.employee_code LIKE ?)`);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (role) {
      whereConditions.push('u.role = ?');
      params.push(role);
    }

    if (department) {
      whereConditions.push('u.department_id = ?');
      params.push(department);
    }

    if (status) {
      whereConditions.push('u.status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Count total
    const countSql = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;
    const [countResult] = await query(countSql, params);
    const total = countResult.total;

    // Get users
    const sql = `
      SELECT 
        u.id, u.username, u.email, u.title, u.full_name, u.nickname,
        u.employee_code, u.position, u.position_level, u.role, u.status,
        u.phone, u.line_id, u.hire_date, u.employment_type, u.last_login,
        d.id as department_id, d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ${whereClause}
      ORDER BY u.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const users = await query(sql, [...params, parseInt(limit), offset]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
    });
  }
};

/**
 * @route   GET /api/users/:id
 * @desc    ดึงข้อมูลผู้ใช้ตาม ID
 * @access  Private
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        u.id, u.username, u.email, u.title, u.full_name, u.full_name_en, u.nickname,
        u.employee_code, u.position, u.position_level, u.role, u.status,
        u.phone, u.line_id, u.hire_date, u.employment_type, u.last_login,
        u.created_at, u.updated_at,
        d.id as department_id, d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `;

    const users = await query(sql, [id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
    });
  }
};

/**
 * @route   POST /api/users
 * @desc    สร้างผู้ใช้ใหม่
 * @access  Private (Admin, Staff)
 */
const createUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      title,
      full_name,
      full_name_en,
      nickname,
      employee_code,
      position,
      position_level,
      department_id,
      role = 'teacher',
      employment_type = 'permanent',
      phone,
      line_id,
      hire_date
    } = req.body;

    // Validation
    if (!username || !email || !password || !full_name || !employee_code) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    // ตรวจสอบ username และ email ซ้ำ
    const checkSql = `
      SELECT id FROM users 
      WHERE username = ? OR email = ? OR employee_code = ?
    `;
    const existing = await query(checkSql, [username, email, employee_code]);

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'ชื่อผู้ใช้, อีเมล หรือรหัสพนักงานนี้มีในระบบแล้ว'
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    // Insert user
    const insertSql = `
      INSERT INTO users (
        username, email, password_hash, title, full_name, full_name_en, nickname,
        employee_code, position, position_level, department_id, role, 
        employment_type, phone, line_id, hire_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(insertSql, [
      username, email, password_hash, title, full_name, full_name_en, nickname,
      employee_code, position, position_level, department_id, role,
      employment_type, phone, line_id, hire_date, req.user.id
    ]);

    // สร้างโควต้าการลาเริ่มต้น
    const currentYearSql = 'SELECT id FROM academic_years WHERE is_current = TRUE';
    const [currentYear] = await query(currentYearSql);

    if (currentYear) {
      const leaveTypesSql = 'SELECT id, max_days_per_year FROM leave_types WHERE is_active = TRUE';
      const leaveTypes = await query(leaveTypesSql);

      for (const leaveType of leaveTypes) {
        await query(
          `INSERT INTO leave_quotas (user_id, leave_type_id, academic_year_id, total_days, used_days) 
           VALUES (?, ?, ?, ?, 0)`,
          [result.insertId, leaveType.id, currentYear.id, leaveType.max_days_per_year || 999]
        );
      }
    }

    // Log activity
    await logActivity(req.user.id, 'CREATE_USER', 'users', req.ip);

    res.status(201).json({
      success: true,
      message: 'สร้างผู้ใช้สำเร็จ',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้'
    });
  }
};

/**
 * @route   PUT /api/users/:id
 * @desc    อัพเดทข้อมูลผู้ใช้
 * @access  Private (Admin, Staff, Owner)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      title,
      full_name,
      full_name_en,
      nickname,
      position,
      position_level,
      department_id,
      role,
      employment_type,
      phone,
      line_id,
      hire_date
    } = req.body;

    // ตรวจสอบว่ามีผู้ใช้อยู่หรือไม่
    const checkSql = 'SELECT id FROM users WHERE id = ?';
    const existing = await query(checkSql, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // ตรวจสอบสิทธิ์ (ต้องเป็น admin หรือ owner)
    const isAdmin = ['super_admin', 'director'].includes(req.user.role);
    const isOwner = req.user.id === parseInt(id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้นี้'
      });
    }

    // สร้าง update query
    const updateFields = [];
    const params = [];

    if (email) {
      updateFields.push('email = ?');
      params.push(email);
    }
    if (title) {
      updateFields.push('title = ?');
      params.push(title);
    }
    if (full_name) {
      updateFields.push('full_name = ?');
      params.push(full_name);
    }
    if (full_name_en) {
      updateFields.push('full_name_en = ?');
      params.push(full_name_en);
    }
    if (nickname) {
      updateFields.push('nickname = ?');
      params.push(nickname);
    }
    if (position) {
      updateFields.push('position = ?');
      params.push(position);
    }
    if (position_level) {
      updateFields.push('position_level = ?');
      params.push(position_level);
    }
    if (department_id) {
      updateFields.push('department_id = ?');
      params.push(department_id);
    }
    if (role && isAdmin) {  // เฉพาะ admin ถึงจะเปลี่ยน role ได้
      updateFields.push('role = ?');
      params.push(role);
    }
    if (employment_type) {
      updateFields.push('employment_type = ?');
      params.push(employment_type);
    }
    if (phone) {
      updateFields.push('phone = ?');
      params.push(phone);
    }
    if (line_id !== undefined) {
      updateFields.push('line_id = ?');
      params.push(line_id);
    }
    if (hire_date) {
      updateFields.push('hire_date = ?');
      params.push(hire_date);
    }

    updateFields.push('updated_by = ?');
    params.push(req.user.id);
    params.push(id);

    const updateSql = `
      UPDATE users 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = ?
    `;

    await query(updateSql, params);

    // Log activity
    await logActivity(req.user.id, 'UPDATE_USER', 'users', req.ip);

    res.json({
      success: true,
      message: 'อัพเดทข้อมูลผู้ใช้สำเร็จ'
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลผู้ใช้'
    });
  }
};

/**
 * @route   DELETE /api/users/:id
 * @desc    ลบผู้ใช้
 * @access  Private (Admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่ามีผู้ใช้อยู่หรือไม่
    const checkSql = 'SELECT id FROM users WHERE id = ?';
    const existing = await query(checkSql, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // ไม่สามารถลบตัวเองได้
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถลบบัญชีของตัวเองได้'
      });
    }

    // ลบผู้ใช้ (cascade จะลบข้อมูลที่เกี่ยวข้องโดยอัตโนมัติ)
    await query('DELETE FROM users WHERE id = ?', [id]);

    // Log activity
    await logActivity(req.user.id, 'DELETE_USER', 'users', req.ip);

    res.json({
      success: true,
      message: 'ลบผู้ใช้สำเร็จ'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบผู้ใช้'
    });
  }
};

/**
 * @route   PATCH /api/users/:id/toggle-status
 * @desc    เปิด/ปิดการใช้งานผู้ใช้
 * @access  Private (Admin only)
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = 'SELECT status FROM users WHERE id = ?';
    const users = await query(sql, [id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    const newStatus = users[0].status === 'active' ? 'suspended' : 'active';

    await query(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );

    // Log activity
    await logActivity(req.user.id, 'TOGGLE_USER_STATUS', 'users', req.ip);

    res.json({
      success: true,
      message: newStatus === 'active' ? 'เปิดใช้งานผู้ใช้สำเร็จ' : 'ระงับผู้ใช้สำเร็จ',
      data: { status: newStatus }
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะผู้ใช้'
    });
  }
};

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    รีเซ็ตรหัสผ่านผู้ใช้
 * @access  Private (Admin only)
 */
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;

    // สร้างรหัสผ่านใหม่ (ตัวอย่าง: Password123!)
    const newPassword = 'Password123!';
    const password_hash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    await query(
      'UPDATE users SET password_hash = ?, login_attempts = 0, locked_until = NULL WHERE id = ?',
      [password_hash, id]
    );

    // Log activity
    await logActivity(req.user.id, 'RESET_USER_PASSWORD', 'users', req.ip);

    // TODO: ส่งอีเมลแจ้งรหัสผ่านใหม่

    res.json({
      success: true,
      message: 'รีเซ็ตรหัสผ่านสำเร็จ',
      data: { newPassword }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword
};
