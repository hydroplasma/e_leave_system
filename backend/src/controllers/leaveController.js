const { query } = require('../config/database');
const { supabase, uploadFile, getPublicUrl, deleteFile } = require('../config/supabase');
const { logActivity } = require('../middleware/auth');

/**
 * @route   GET /api/leaves
 * @desc    ดึงรายการใบลาทั้งหมด (พร้อม filter)
 * @access  Private (Admin, Head, Staff)
 */
const getLeaveRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
      leaveType = '',
      userId = '',
      startDate = '',
      endDate = '',
      search = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    // Filter by status
    if (status) {
      whereConditions.push('lr.status = ?');
      params.push(status);
    }

    // Filter by leave type
    if (leaveType) {
      whereConditions.push('lr.leave_type_id = ?');
      params.push(leaveType);
    }

    // Filter by user
    if (userId) {
      whereConditions.push('lr.user_id = ?');
      params.push(userId);
    }

    // Filter by date range
    if (startDate && endDate) {
      whereConditions.push('lr.start_date BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }

    // Search
    if (search) {
      whereConditions.push('(u.full_name LIKE ? OR u.employee_code LIKE ? OR lr.reason LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Permission-based filtering
    const isAdmin = ['super_admin', 'director', 'vice_director'].includes(req.user.role);
    const isHead = req.user.role === 'head';

    if (!isAdmin && !isHead) {
      // ครูทั่วไป - เห็นเฉพาะของตัวเอง
      whereConditions.push('lr.user_id = ?');
      params.push(req.user.id);
    } else if (isHead) {
      // หัวหน้า - เห็นของคนในแผนกตัวเอง
      whereConditions.push('(lr.user_id = ? OR u.department_id = ?)');
      params.push(req.user.id, req.user.department_id);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Count total
    const countSql = `
      SELECT COUNT(*) as total
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      ${whereClause}
    `;
    const [countResult] = await query(countSql, params);
    const total = countResult.total;

    // Get leave requests
    const sql = `
      SELECT 
        lr.id, lr.request_code, lr.user_id, lr.leave_type_id,
        lr.start_date, lr.end_date, lr.start_period, lr.end_period,
        lr.total_days, lr.reason, lr.contact_address, lr.contact_phone,
        lr.substitute_teacher_id, lr.substitute_note,
        lr.status, lr.is_urgent, lr.is_emergency,
        lr.submitted_at, lr.created_at, lr.updated_at,
        u.full_name as user_name, u.employee_code, u.position,
        d.name as department_name,
        lt.name as leave_type_name, lt.code as leave_type_code, lt.color as leave_type_color,
        sub.full_name as substitute_teacher_name,
        ap.approver_id, ap.status as approval_status, ap.decision_at,
        approver.full_name as approver_name
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users sub ON lr.substitute_teacher_id = sub.id
      LEFT JOIN approval_workflows ap ON lr.id = ap.leave_request_id
      LEFT JOIN users approver ON ap.approver_id = approver.id
      ${whereClause}
      ORDER BY lr.${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const leaves = await query(sql, [...params, parseInt(limit), offset]);

    res.json({
      success: true,
      data: {
        leaves,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบลา'
    });
  }
};

/**
 * @route   GET /api/leaves/:id
 * @desc    ดึงข้อมูลใบลาตาม ID
 * @access  Private
 */
const getLeaveRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        lr.*,
        u.full_name as user_name, u.employee_code, u.position, u.email, u.phone,
        d.name as department_name,
        lt.name as leave_type_name, lt.code as leave_type_code, 
        lt.color as leave_type_color, lt.require_document,
        sub.full_name as substitute_teacher_name, sub.phone as substitute_phone,
        ay.year as academic_year
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users sub ON lr.substitute_teacher_id = sub.id
      JOIN academic_years ay ON lr.academic_year_id = ay.id
      WHERE lr.id = ?
    `;

    const leaves = await query(sql, [id]);

    if (leaves.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลใบลา'
      });
    }

    // Get attachments
    const attachmentsSql = `
      SELECT id, file_name, file_path, file_type, file_size, uploaded_at
      FROM leave_attachments
      WHERE leave_request_id = ?
    `;
    const attachments = await query(attachmentsSql, [id]);

    // Get approval workflow
    const workflowSql = `
      SELECT 
        aw.id, aw.approver_level, aw.status, aw.comment, aw.decision_at,
        u.full_name as approver_name, u.position as approver_position
      FROM approval_workflows aw
      JOIN users u ON aw.approver_id = u.id
      WHERE aw.leave_request_id = ?
      ORDER BY aw.approver_level
    `;
    const workflow = await query(workflowSql, [id]);

    res.json({
      success: true,
      data: {
        ...leaves[0],
        attachments,
        workflow
      }
    });

  } catch (error) {
    console.error('Get leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบลา'
    });
  }
};

/**
 * @route   POST /api/leaves
 * @desc    สร้างใบลาใหม่
 * @access  Private
 */
const createLeaveRequest = async (req, res) => {
  try {
    const {
      leave_type_id,
      start_date,
      end_date,
      start_period = 'full_day',
      end_period = 'full_day',
      total_days,
      reason,
      contact_address,
      contact_phone,
      substitute_teacher_id,
      substitute_note,
      is_urgent = false,
      is_emergency = false
    } = req.body;

    // Validation
    if (!leave_type_id || !start_date || !end_date || !total_days || !reason) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    // ตรวจสอบโควต้า
    const currentYearSql = 'SELECT id FROM academic_years WHERE is_current = TRUE';
    const [currentYear] = await query(currentYearSql);

    if (!currentYear) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบปีการศึกษาปัจจุบัน'
      });
    }

    const quotaSql = `
      SELECT remaining_days 
      FROM leave_quotas 
      WHERE user_id = ? AND leave_type_id = ? AND academic_year_id = ?
    `;
    const [quota] = await query(quotaSql, [req.user.id, leave_type_id, currentYear.id]);

    if (quota && quota.remaining_days < total_days) {
      return res.status(400).json({
        success: false,
        message: `โควต้าไม่เพียงพอ (เหลือ ${quota.remaining_days} วัน)`
      });
    }

    // สร้าง request code (LR2569-0001)
    const year = new Date().getFullYear() + 543;
    const countSql = `
      SELECT COUNT(*) as count 
      FROM leave_requests 
      WHERE request_code LIKE ?
    `;
    const [countResult] = await query(countSql, [`LR${year}-%`]);
    const nextNumber = String(countResult.count + 1).padStart(4, '0');
    const request_code = `LR${year}-${nextNumber}`;

    // Insert leave request
    const insertSql = `
      INSERT INTO leave_requests (
        request_code, user_id, leave_type_id, academic_year_id,
        start_date, end_date, start_period, end_period, total_days,
        reason, contact_address, contact_phone,
        substitute_teacher_id, substitute_note,
        status, is_urgent, is_emergency, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NOW())
    `;

    const result = await query(insertSql, [
      request_code, req.user.id, leave_type_id, currentYear.id,
      start_date, end_date, start_period, end_period, total_days,
      reason, contact_address, contact_phone,
      substitute_teacher_id, substitute_note,
      is_urgent, is_emergency
    ]);

    const leaveRequestId = result.insertId;

    // สร้าง approval workflow
    await createApprovalWorkflow(leaveRequestId, req.user);

    // อัพเดทโควต้า (pending_days)
    if (quota) {
      await query(
        'UPDATE leave_quotas SET pending_days = pending_days + ? WHERE user_id = ? AND leave_type_id = ? AND academic_year_id = ?',
        [total_days, req.user.id, leave_type_id, currentYear.id]
      );
    }

    // Log activity
    await logActivity(req.user.id, 'CREATE_LEAVE_REQUEST', 'leave_requests', req.ip);

    res.status(201).json({
      success: true,
      message: 'สร้างใบลาสำเร็จ',
      data: { id: leaveRequestId, request_code }
    });

  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างใบลา'
    });
  }
};

/**
 * สร้าง Approval Workflow อัตโนมัติ
 */
const createApprovalWorkflow = async (leaveRequestId, user) => {
  try {
    const approvers = [];

    // Level 1: หัวหน้ากลุ่มสาระ
    if (user.role === 'teacher') {
      const headSql = 'SELECT head_id FROM departments WHERE id = ?';
      const [dept] = await query(headSql, [user.department_id]);
      if (dept && dept.head_id) {
        approvers.push({ level: 1, approverId: dept.head_id, role: 'head' });
      }
    }

    // Level 2: รองผู้อำนวยการ
    const viceSql = 'SELECT id FROM users WHERE role = "vice_director" AND status = "active" LIMIT 1';
    const [vice] = await query(viceSql);
    if (vice) {
      approvers.push({ level: 2, approverId: vice.id, role: 'vice_director' });
    }

    // Insert workflow
    for (const approver of approvers) {
      await query(
        'INSERT INTO approval_workflows (leave_request_id, approver_id, approver_level, approver_role, status) VALUES (?, ?, ?, ?, "pending")',
        [leaveRequestId, approver.approverId, approver.level, approver.role]
      );
    }
  } catch (error) {
    console.error('Create workflow error:', error);
  }
};

/**
 * @route   POST /api/leaves/:id/approve
 * @desc    อนุมัติใบลา
 * @access  Private (Head, Admin)
 */
const approveLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment = '' } = req.body;

    // ตรวจสอบว่ามีสิทธิ์อนุมัติหรือไม่
    const workflowSql = `
      SELECT aw.*, lr.user_id, lr.leave_type_id, lr.total_days, lr.academic_year_id
      FROM approval_workflows aw
      JOIN leave_requests lr ON aw.leave_request_id = lr.id
      WHERE aw.leave_request_id = ? AND aw.approver_id = ? AND aw.status = 'pending'
      ORDER BY aw.approver_level
      LIMIT 1
    `;
    const [workflow] = await query(workflowSql, [id, req.user.id]);

    if (!workflow) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์อนุมัติใบลานี้'
      });
    }

    // อัพเดท workflow
    await query(
      'UPDATE approval_workflows SET status = "approved", comment = ?, decision_at = NOW() WHERE id = ?',
      [comment, workflow.id]
    );

    // ตรวจสอบว่าผ่านทุก level แล้วหรือไม่
    const pendingSql = 'SELECT COUNT(*) as count FROM approval_workflows WHERE leave_request_id = ? AND status = "pending"';
    const [pending] = await query(pendingSql, [id]);

    if (pending.count === 0) {
      // อนุมัติสมบูรณ์
      await query(
        'UPDATE leave_requests SET status = "approved", approved_by = ?, approved_at = NOW() WHERE id = ?',
        [req.user.id, id]
      );

      // อัพเดทโควต้า (ย้ายจาก pending เป็น used)
      await query(
        `UPDATE leave_quotas 
         SET pending_days = pending_days - ?, used_days = used_days + ?
         WHERE user_id = ? AND leave_type_id = ? AND academic_year_id = ?`,
        [workflow.total_days, workflow.total_days, workflow.user_id, workflow.leave_type_id, workflow.academic_year_id]
      );
    }

    // Log activity
    await logActivity(req.user.id, 'APPROVE_LEAVE', 'leave_requests', req.ip);

    res.json({
      success: true,
      message: 'อนุมัติใบลาสำเร็จ'
    });

  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอนุมัติใบลา'
    });
  }
};

/**
 * @route   POST /api/leaves/:id/reject
 * @desc    ปฏิเสธใบลา
 * @access  Private (Head, Admin)
 */
const rejectLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุเหตุผลในการปฏิเสธ'
      });
    }

    // ตรวจสอบสิทธิ์
    const workflowSql = `
      SELECT aw.*, lr.user_id, lr.leave_type_id, lr.total_days, lr.academic_year_id
      FROM approval_workflows aw
      JOIN leave_requests lr ON aw.leave_request_id = lr.id
      WHERE aw.leave_request_id = ? AND aw.approver_id = ?
      ORDER BY aw.approver_level
      LIMIT 1
    `;
    const [workflow] = await query(workflowSql, [id, req.user.id]);

    if (!workflow) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ปฏิเสธใบลานี้'
      });
    }

    // อัพเดท workflow
    await query(
      'UPDATE approval_workflows SET status = "rejected", comment = ?, decision_at = NOW() WHERE leave_request_id = ? AND approver_id = ?',
      [reason, id, req.user.id]
    );

    // อัพเดทสถานะใบลา
    await query(
      'UPDATE leave_requests SET status = "rejected", rejected_by = ?, rejected_at = NOW(), rejection_reason = ? WHERE id = ?',
      [req.user.id, reason, id]
    );

    // คืนโควต้า
    await query(
      `UPDATE leave_quotas 
       SET pending_days = pending_days - ?
       WHERE user_id = ? AND leave_type_id = ? AND academic_year_id = ?`,
      [workflow.total_days, workflow.user_id, workflow.leave_type_id, workflow.academic_year_id]
    );

    // Log activity
    await logActivity(req.user.id, 'REJECT_LEAVE', 'leave_requests', req.ip);

    res.json({
      success: true,
      message: 'ปฏิเสธใบลาสำเร็จ'
    });

  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการปฏิเสธใบลา'
    });
  }
};

/**
 * @route   POST /api/leaves/:id/cancel
 * @desc    ยกเลิกใบลา
 * @access  Private (Owner only)
 */
const cancelLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // ตรวจสอบว่าเป็นเจ้าของใบลา
    const sql = 'SELECT user_id, status, total_days, leave_type_id, academic_year_id FROM leave_requests WHERE id = ?';
    const [leave] = await query(sql, [id]);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลใบลา'
      });
    }

    if (leave.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ยกเลิกใบลานี้'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถยกเลิกใบลาที่ได้รับการพิจารณาแล้ว'
      });
    }

    // ยกเลิกใบลา
    await query(
      'UPDATE leave_requests SET status = "cancelled", cancelled_by = ?, cancelled_at = NOW(), cancellation_reason = ? WHERE id = ?',
      [req.user.id, reason, id]
    );

    // คืนโควต้า
    await query(
      `UPDATE leave_quotas 
       SET pending_days = pending_days - ?
       WHERE user_id = ? AND leave_type_id = ? AND academic_year_id = ?`,
      [leave.total_days, leave.user_id, leave.leave_type_id, leave.academic_year_id]
    );

    // Log activity
    await logActivity(req.user.id, 'CANCEL_LEAVE', 'leave_requests', req.ip);

    res.json({
      success: true,
      message: 'ยกเลิกใบลาสำเร็จ'
    });

  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการยกเลิกใบลา'
    });
  }
};

module.exports = {
  getLeaveRequests,
  getLeaveRequestById,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest
};
