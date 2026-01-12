const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Middleware: ตรวจสอบ JWT Token และ Authentication
 */
const authenticate = async (req, res, next) => {
  try {
    // ดึง token จาก header หรือ cookie
    let token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
    
    if (!token) {
      token = req.cookies?.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบ',
        code: 'NO_TOKEN'
      });
    }

    // ตรวจสอบ token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    const sql = `
      SELECT 
        u.id, u.username, u.email, u.full_name, u.role, u.status,
        u.department_id, d.name as department_name,
        u.position, u.employee_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ? AND u.status = 'active'
    `;
    
    const users = await query(sql, [decoded.userId]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบผู้ใช้งานหรือบัญชีถูกระงับ',
        code: 'USER_NOT_FOUND'
      });
    }

    // เก็บข้อมูลผู้ใช้ใน request
    req.user = users[0];
    
    // บันทึก activity log
    await logActivity(req.user.id, 'API_ACCESS', req.path, req.ip);
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token ไม่ถูกต้อง',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์'
    });
  }
};

/**
 * Middleware: ตรวจสอบบทบาท (Role-Based Access Control)
 * @param {Array} allowedRoles - บทบาทที่อนุญาต
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบ'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

/**
 * Middleware: ตรวจสอบว่าเป็นเจ้าของข้อมูลหรือ Admin
 */
const authorizeOwnerOrAdmin = (req, res, next) => {
  const userId = parseInt(req.params.userId || req.body.userId);
  const isOwner = req.user.id === userId;
  const isAdmin = ['super_admin', 'director', 'vice_director'].includes(req.user.role);

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
    });
  }

  next();
};

/**
 * Helper: สร้าง JWT Token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '2h' }
  );
};

/**
 * Helper: สร้าง Refresh Token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

/**
 * Helper: บันทึก Activity Log
 */
const logActivity = async (userId, action, details, ipAddress) => {
  try {
    const sql = `
      INSERT INTO audit_logs (user_id, action, table_name, ip_address)
      VALUES (?, ?, ?, ?)
    `;
    await query(sql, [userId, action, details, ipAddress]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

/**
 * Middleware: Rate Limiting ป้องกัน Brute Force
 * จำกัดจำนวนครั้งในการเข้าถึง API
 */
const loginAttempts = new Map();

const rateLimitLogin = (req, res, next) => {
  const identifier = req.body.username || req.ip;
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || { count: 0, resetTime: now + 15 * 60 * 1000 };

  // Reset หลังจาก 15 นาที
  if (now > attempts.resetTime) {
    attempts.count = 0;
    attempts.resetTime = now + 15 * 60 * 1000;
  }

  attempts.count++;
  loginAttempts.set(identifier, attempts);

  // จำกัด 5 ครั้งใน 15 นาที
  if (attempts.count > 5) {
    return res.status(429).json({
      success: false,
      message: 'คุณพยายามเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาที',
      code: 'TOO_MANY_ATTEMPTS',
      retryAfter: Math.ceil((attempts.resetTime - now) / 1000)
    });
  }

  next();
};

/**
 * Helper: ตรวจสอบความแข็งแรงของรหัสผ่าน
 */
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`รหัสผ่านต้องมีอย่างน้อย ${minLength} ตัวอักษร`);
  }
  if (!hasUpperCase) {
    errors.push('รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว');
  }
  if (!hasLowerCase) {
    errors.push('รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว');
  }
  if (!hasNumbers) {
    errors.push('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว');
  }
  if (!hasSpecialChar) {
    errors.push('รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Middleware: ป้องกัน Session Hijacking
 */
const validateSession = async (req, res, next) => {
  if (req.user) {
    const sql = `SELECT last_login FROM users WHERE id = ?`;
    const users = await query(sql, [req.user.id]);
    
    if (users.length > 0) {
      // ตรวจสอบว่า session ยังใช้งานได้หรือไม่
      // (อาจเพิ่มเงื่อนไขเพิ่มเติมตามต้องการ)
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: 'Session หมดอายุ',
        code: 'SESSION_EXPIRED'
      });
    }
  } else {
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  authorizeOwnerOrAdmin,
  generateToken,
  generateRefreshToken,
  logActivity,
  rateLimitLogin,
  validatePasswordStrength,
  validateSession
};
