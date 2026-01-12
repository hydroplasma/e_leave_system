require('dotenv').config();
const app = require('./src/app');
const { pool } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 E-Leave Management System API');
  console.log('========================================');
  console.log(`📡 Server running on port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log('========================================');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});
