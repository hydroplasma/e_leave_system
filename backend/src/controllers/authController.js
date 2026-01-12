const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');
const { 
  generateToken, 
  generateRefreshToken, 
  validatePasswordStrength,
  logActivity 
} = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    เข้าสู่ระบบ
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
      });
    }

    // ดึงข้อมูลผู้ใช้
    const sql = `
      SELECT 
        u.id, u.username, u.email, u.password_hash, 
        u.full_name, u.role, u.status, u.department_id,
        u.login_attempts, u.locked_until,
        d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE (u.username = ? OR u.email = ?)
    `;
    
    const users = await query(sql, [username, username]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    const user = users[0];

    // ตรวจสอบสถานะบัญชี
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'บัญชีของคุณถูกระงับ กรุณาติดต่อผู้ดูแลระบบ',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    // ตรวจสอบว่าบัญชีถูกล็อคหรือไม่
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({
        success: false,
        message: `บัญชีถูกล็อค กรุณารออีก ${remainingMinutes} นาที`,
        code: 'ACCOUNT_LOCKED',
        remainingMinutes
      });
    }

    // ตรวจสอบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // เพิ่มจำนวนครั้งที่พยายาม login ผิด
      const newAttempts = user.login_attempts + 1;
      let lockedUntil = null;

      // ล็อคบัญชีถ้าพยายาม 5 ครั้ง
      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // ล็อค 15 นาที
      }

      await query(
        'UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?',
        [newAttempts, lockedUntil, user.id]
      );

      // Log failed attempt
      await logActivity(user.id, 'LOGIN_FAILED', 'auth', req.ip);

      return res.status(401).json({
        success: false,
        message: `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เหลือ ${5 - newAttempts} ครั้ง)`,
        remainingAttempts: 5 - newAttempts
      });
    }

    // Login สำเร็จ - รีเซ็ต login attempts
    await query(
      'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // สร้าง JWT Token
    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // ตั้งค่า cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000 // 7 days or 2 hours
    };

    // Log successful login
    await logActivity(user.id, 'LOGIN_SUCCESS', 'auth', req.ip);

    // ส่ง token กลับ
    res.cookie('token', token, cookieOptions);
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          department: user.department_name
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
    });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    ออกจากระบบ
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    // Log logout activity
    if (req.user) {
      await logActivity(req.user.id, 'LOGOUT', 'auth', req.ip);
    }

    // ลบ cookies
    res.clearCookie('token');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'ออกจากระบบสำเร็จ'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการออกจากระบบ'
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    ดึงข้อมูลผู้ใช้ปัจจุบัน
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const sql = `
      SELECT 
        u.id, u.username, u.email, u.title, u.full_name, u.nickname,
        u.employee_code, u.position, u.position_level, u.role, u.status,
        u.phone, u.line_id, u.hire_date, u.employment_type,
        d.id as department_id, d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `;

    const users = await query(sql, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // ดึงโควต้าการลา
    const quotasSql = `
      SELECT 
        lt.code, lt.name, lt.color, lt.icon,
        lq.total_days, lq.used_days, lq.pending_days, lq.remaining_days
      FROM leave_quotas lq
      JOIN leave_types lt ON lq.leave_type_id = lt.id
      JOIN academic_years ay ON lq.academic_year_id = ay.id
      WHERE lq.user_id = ? AND ay.is_current = TRUE AND lq.is_active = TRUE
      ORDER BY lt.order_index
    `;

    const quotas = await query(quotasSql, [req.user.id]);

    res.json({
      success: true,
      data: {
        user: users[0],
        leaveQuotas: quotas
      }
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    });
  }
};

/**
 * @route   POST /api/auth/refresh
 * @desc    รีเฟรช Token
 * @access  Public
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบ Refresh Token'
      });
    }

    // ตรวจสอบ refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Token ไม่ถูกต้อง'
      });
    }

    // สร้าง token ใหม่
    const newToken = generateToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Refresh Token หมดอายุหรือไม่ถูกต้อง'
    });
  }
};

/**
 * @route   POST /api/auth/change-password
 * @desc    เปลี่ยนรหัสผ่าน
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านใหม่ไม่ตรงกัน'
      });
    }

    // ตรวจสอบความแข็งแรงของรหัสผ่าน
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านไม่ปลอดภัยพอ',
        errors: passwordValidation.errors
      });
    }

    // ดึงข้อมูลผู้ใช้
    const sql = 'SELECT password_hash FROM users WHERE id = ?';
    const users = await query(sql, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // ตรวจสอบรหัสผ่านปัจจุบัน
    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
      });
    }

    // Hash รหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    // อัพเดทรหัสผ่าน
    await query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    // Log activity
    await logActivity(req.user.id, 'PASSWORD_CHANGED', 'users', req.ip);

    res.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน'
    });
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    ขอรีเซ็ตรหัสผ่าน
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกอีเมล'
      });
    }

    // ตรวจสอบว่ามีอีเมลในระบบหรือไม่
    const sql = 'SELECT id, email, full_name FROM users WHERE email = ? AND status = "active"';
    const users = await query(sql, [email]);

    // ส่ง response เหมือนกันไม่ว่าจะพบอีเมลหรือไม่ (Security)
    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'หากอีเมลนี้มีในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้'
      });
    }

    const user = users[0];

    // สร้าง reset token (ในการใช้งานจริงควรเก็บใน database)
    const resetToken = generateToken(user.id, user.role);
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 ชั่วโมง

    // บันทึก token ใน database
    await query(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
      [resetToken, resetExpires, user.id]
    );

    // TODO: ส่งอีเมลพร้อมลิงก์รีเซ็ต
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    // await sendEmail(user.email, 'รีเซ็ตรหัสผ่าน', resetUrl);

    // Log activity
    await logActivity(user.id, 'PASSWORD_RESET_REQUESTED', 'auth', req.ip);

    res.json({
      success: true,
      message: 'หากอีเมลนี้มีในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน'
    });
  }
};

module.exports = {
  login,
  logout,
  getMe,
  refreshToken,
  changePassword,
  forgotPassword
};
