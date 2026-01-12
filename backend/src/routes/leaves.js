const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const {
  getLeaveRequests,
  getLeaveRequestById,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest
} = require('../controllers/leaveController');
const { authenticate, authorize } = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/leaves/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // ยอมรับเฉพาะ PDF, JPG, PNG
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะ PDF, JPG, PNG'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// ทุก route ต้อง authenticate ก่อน
router.use(authenticate);

/**
 * @route   GET /api/leaves
 * @desc    ดึงรายการใบลาทั้งหมด
 * @access  Private
 */
router.get('/', getLeaveRequests);

/**
 * @route   GET /api/leaves/:id
 * @desc    ดึงข้อมูลใบลาตาม ID
 * @access  Private
 */
router.get('/:id', getLeaveRequestById);

/**
 * @route   POST /api/leaves
 * @desc    สร้างใบลาใหม่
 * @access  Private
 */
router.post('/', createLeaveRequest);

/**
 * @route   POST /api/leaves/:id/approve
 * @desc    อนุมัติใบลา
 * @access  Private (Head, Admin)
 */
router.post('/:id/approve', authorize('head', 'vice_director', 'director', 'super_admin'), approveLeaveRequest);

/**
 * @route   POST /api/leaves/:id/reject
 * @desc    ปฏิเสธใบลา
 * @access  Private (Head, Admin)
 */
router.post('/:id/reject', authorize('head', 'vice_director', 'director', 'super_admin'), rejectLeaveRequest);

/**
 * @route   POST /api/leaves/:id/cancel
 * @desc    ยกเลิกใบลา
 * @access  Private (Owner)
 */
router.post('/:id/cancel', cancelLeaveRequest);

/**
 * @route   POST /api/leaves/:id/attachments
 * @desc    อัปโหลดเอกสารแนบ
 * @access  Private
 */
router.post('/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { query } = require('../config/database');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกไฟล์'
      });
    }

    // ตรวจสอบว่ามีใบลาอยู่จริง
    const checkSql = 'SELECT user_id FROM leave_requests WHERE id = ?';
    const [leave] = await query(checkSql, [id]);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบใบลา'
      });
    }

    // เฉพาะเจ้าของใบลาหรือ admin เท่านั้นที่อัปโหลดได้
    const isOwner = leave.user_id === req.user.id;
    const isAdmin = ['super_admin', 'director'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์อัปโหลดไฟล์'
      });
    }

    // บันทึกข้อมูลไฟล์
    const insertSql = `
      INSERT INTO leave_attachments (
        leave_request_id, file_name, file_path, file_type, file_size, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await query(insertSql, [
      id,
      req.file.originalname,
      req.file.path,
      req.file.mimetype,
      req.file.size,
      req.user.id
    ]);

    res.json({
      success: true,
      message: 'อัปโหลดไฟล์สำเร็จ',
      data: {
        id: result.insertId,
        fileName: req.file.originalname,
        fileSize: req.file.size
      }
    });

  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์'
    });
  }
});

/**
 * @route   DELETE /api/leaves/:leaveId/attachments/:attachmentId
 * @desc    ลบเอกสารแนบ
 * @access  Private (Owner or Admin)
 */
router.delete('/:leaveId/attachments/:attachmentId', async (req, res) => {
  try {
    const { leaveId, attachmentId } = req.params;
    const { query } = require('../config/database');
    const fs = require('fs');

    // ตรวจสอบสิทธิ์
    const checkSql = `
      SELECT la.file_path, lr.user_id
      FROM leave_attachments la
      JOIN leave_requests lr ON la.leave_request_id = lr.id
      WHERE la.id = ? AND la.leave_request_id = ?
    `;
    const [attachment] = await query(checkSql, [attachmentId, leaveId]);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบไฟล์'
      });
    }

    const isOwner = attachment.user_id === req.user.id;
    const isAdmin = ['super_admin', 'director'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ลบไฟล์'
      });
    }

    // ลบไฟล์จากระบบ
    if (fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }

    // ลบจากฐานข้อมูล
    await query('DELETE FROM leave_attachments WHERE id = ?', [attachmentId]);

    res.json({
      success: true,
      message: 'ลบไฟล์สำเร็จ'
    });

  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบไฟล์'
    });
  }
});

module.exports = router;
