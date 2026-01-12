const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword
} = require('../controllers/userController');
const { authenticate, authorize, authorizeOwnerOrAdmin } = require('../middleware/auth');

// ทุก route ต้อง authenticate ก่อน
router.use(authenticate);

/**
 * @route   GET /api/users
 * @desc    ดึงรายการผู้ใช้ทั้งหมด
 * @access  Private (Admin, Staff)
 */
router.get('/', authorize('super_admin', 'director', 'staff'), getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    ดึงข้อมูลผู้ใช้ตาม ID
 * @access  Private (Owner or Admin)
 */
router.get('/:id', authorizeOwnerOrAdmin, getUserById);

/**
 * @route   POST /api/users
 * @desc    สร้างผู้ใช้ใหม่
 * @access  Private (Admin, Staff)
 */
router.post('/', authorize('super_admin', 'director', 'staff'), createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    อัพเดทข้อมูลผู้ใช้
 * @access  Private (Owner or Admin)
 */
router.put('/:id', updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    ลบผู้ใช้
 * @access  Private (Admin only)
 */
router.delete('/:id', authorize('super_admin', 'director'), deleteUser);

/**
 * @route   PATCH /api/users/:id/toggle-status
 * @desc    เปิด/ปิดการใช้งานผู้ใช้
 * @access  Private (Admin only)
 */
router.patch('/:id/toggle-status', authorize('super_admin', 'director'), toggleUserStatus);

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    รีเซ็ตรหัสผ่านผู้ใช้
 * @access  Private (Admin only)
 */
router.post('/:id/reset-password', authorize('super_admin', 'director'), resetUserPassword);

module.exports = router;
