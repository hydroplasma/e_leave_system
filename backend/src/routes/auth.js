const express = require('express');
const router = express.Router();
const { 
  login, 
  logout, 
  getMe, 
  refreshToken,
  changePassword,
  forgotPassword 
} = require('../controllers/authController');
const { authenticate, rateLimitLogin } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    เข้าสู่ระบบ
 * @access  Public
 */
router.post('/login', rateLimitLogin, login);

/**
 * @route   POST /api/auth/logout
 * @desc    ออกจากระบบ
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/auth/me
 * @desc    ดึงข้อมูลผู้ใช้ปัจจุบัน
 * @access  Private
 */
router.get('/me', authenticate, getMe);

/**
 * @route   POST /api/auth/refresh
 * @desc    รีเฟรช Token
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/auth/change-password
 * @desc    เปลี่ยนรหัสผ่าน
 * @access  Private
 */
router.post('/change-password', authenticate, changePassword);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    ขอรีเซ็ตรหัสผ่าน
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

module.exports = router;
