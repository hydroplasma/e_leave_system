const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ==========================================
// Security Middleware
// ==========================================

// Helmet - ป้องกัน common security vulnerabilities
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // อนุญาตให้ส่ง cookies
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate Limiting - จำกัดจำนวน requests
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  message: 'คำขอมากเกินไป กรุณาลองใหม่ภายหลัง',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ==========================================
// Body Parser Middleware
// ==========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ==========================================
// Compression Middleware
// ==========================================
app.use(compression());

// ==========================================
// Logging Middleware
// ==========================================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ==========================================
// API Routes
// ==========================================

// Health Check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'E-Leave API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Version
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'E-Leave Management System API v1.0',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const leaveRoutes = require('./routes/leaves');
// const departmentRoutes = require('./routes/departments');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaves', leaveRoutes);
// app.use('/api/departments', departmentRoutes);

// ==========================================
// Static Files (สำหรับ uploaded files)
// ==========================================
app.use('/uploads', express.static('uploads'));

// ==========================================
// Error Handling Middleware
// ==========================================

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'ไม่พบเส้นทาง API ที่ร้องขอ',
    path: req.originalUrl
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'ข้อมูลไม่ถูกต้อง',
      errors
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token ไม่ถูกต้อง'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token หมดอายุ'
    });
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'ไฟล์มีขนาดใหญ่เกินไป'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==========================================
// Graceful Shutdown
// ==========================================
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;
