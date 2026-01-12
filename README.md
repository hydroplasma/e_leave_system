# 🏫 E-Leave Management System
ระบบบริหารจัดการการลาสำหรับโรงเรียน

## 📋 คุณสมบัติหลัก (Features)

### Phase 1 - ✅ พื้นฐานและความปลอดภัย
- ✅ ระบบ Authentication (Login/Logout)
- ✅ JWT Token & Refresh Token
- ✅ Role-Based Access Control (RBAC)
- ✅ Password Hashing & Security
- ✅ Rate Limiting & Brute Force Protection
- ✅ User Management (CRUD)
- ✅ Dashboard พื้นฐาน

### Phase 2-6 - 🚧 อยู่ระหว่างพัฒนา
- 📝 ระบบยื่นใบลา
- ✅ ระบบอนุมัติแบบหลายขั้นตอน
- 📊 รายงานและสถิติ
- 🔔 ระบบแจ้งเตือน
- 📄 การสร้าง PDF
- และอื่นๆ...

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Node.js + Express.js
- **Database**: MySQL 8.0
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, bcrypt
- **Validation**: express-validator

### Frontend
- **Framework**: React 18 + Vite
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **HTTP Client**: Axios
- **Notifications**: React Toastify

---

## 📦 การติดตั้ง (Installation)

### ข้อกำหนดระบบ (Requirements)
- Node.js >= 18.x
- MySQL >= 8.0
- npm หรือ yarn

### 1. Clone โปรเจค
```bash
git clone <repository-url>
cd e-leave-system
```

### 2. ติดตั้ง Backend

```bash
cd backend
npm install
```

**สร้างไฟล์ .env**
```bash
cp .env.example .env
```

**แก้ไขไฟล์ .env**
```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=e_leave_system

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=2h
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRE=7d

# School Information
SCHOOL_NAME=โรงเรียนวงศ์ไววิทยา
SCHOOL_CODE=10001
```

### 3. สร้างฐานข้อมูล

**เข้า MySQL**
```bash
mysql -u root -p
```

**รันคำสั่ง SQL**
```sql
CREATE DATABASE e_leave_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE e_leave_system;
SOURCE /path/to/database/schema.sql;
SOURCE /path/to/database/seeds.sql;
```

หรือใช้ไฟล์ที่เตรียมไว้:
```bash
cd ../database
mysql -u root -p < schema.sql
mysql -u root -p < seeds.sql
```

### 4. ติดตั้ง Frontend

```bash
cd ../frontend
npm install
```

**สร้างไฟล์ .env**
```bash
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

---

## 🚀 การรันโปรเจค (Running)

### วิธีที่ 1: รันแยกกัน (แนะนำสำหรับการพัฒนา)

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
```
Backend จะรันที่ http://localhost:5000

**Terminal 2 - Frontend**
```bash
cd frontend
npm run dev
```
Frontend จะรันที่ http://localhost:5173

### วิธีที่ 2: รันพร้อมกัน (Production)

**Backend**
```bash
cd backend
npm start
```

**Frontend** (Build และ Deploy)
```bash
cd frontend
npm run build
# Deploy ไฟล์ใน dist/ ไปที่ web server
```

---

## 👥 บัญชีทดสอบ (Demo Accounts)

| ชื่อผู้ใช้ | รหัสผ่าน | บทบาท |
|-----------|---------|--------|
| admin | Password123! | Super Admin |
| director | Password123! | ผู้อำนวยการ |
| vice01 | Password123! | รองผู้อำนวยการ |
| head_thai | Password123! | หัวหน้ากลุ่มสาระ |
| teacher01 | Password123! | ครู |
| staff01 | Password123! | เจ้าหน้าที่ธุรการ |

---

## 📁 โครงสร้างโปรเจค (Project Structure)

```
e-leave-system/
├── backend/                    # Backend (Express.js)
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Middleware functions
│   │   ├── models/           # Database models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Utility functions
│   │   └── app.js            # Express app
│   ├── .env.example          # Environment template
│   ├── package.json
│   └── server.js             # Entry point
│
├── frontend/                  # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── contexts/         # Context API
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── styles/           # CSS files
│   │   ├── utils/            # Utilities
│   │   ├── App.jsx           # Main app
│   │   └── main.jsx          # Entry point
│   ├── package.json
│   └── vite.config.js
│
└── database/                  # Database files
    ├── schema.sql            # Database schema
    └── seeds.sql             # Seed data
```

---

## 🔧 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
เข้าสู่ระบบ

**Request Body:**
```json
{
  "username": "admin",
  "password": "Password123!",
  "rememberMe": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "เข้าสู่ระบบสำเร็จ",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@school.ac.th",
      "fullName": "ผู้ดูแลระบบ",
      "role": "super_admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

#### POST /api/auth/logout
ออกจากระบบ

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "ออกจากระบบสำเร็จ"
}
```

#### GET /api/auth/me
ดึงข้อมูลผู้ใช้ปัจจุบัน

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@school.ac.th",
      "fullName": "ผู้ดูแลระบบ",
      "role": "super_admin",
      "department": null
    },
    "leaveQuotas": [...]
  }
}
```

### User Management Endpoints

#### GET /api/users
ดึงรายการผู้ใช้ทั้งหมด (Admin only)

**Query Parameters:**
- `page`: หน้าที่ต้องการ (default: 1)
- `limit`: จำนวนรายการต่อหน้า (default: 10)
- `search`: ค้นหา
- `role`: กรองตามบทบาท
- `department`: กรองตามแผนก
- `status`: กรองตามสถานะ (active/suspended)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

#### POST /api/users
สร้างผู้ใช้ใหม่ (Admin only)

**Request Body:**
```json
{
  "username": "new_teacher",
  "email": "teacher@school.ac.th",
  "password": "Password123!",
  "full_name": "ครูใหม่",
  "employee_code": "TCH999",
  "position": "ครูผู้สอน",
  "department_id": 4,
  "role": "teacher",
  "phone": "0812345678"
}
```

---

## 🔐 Security Features

### 1. Authentication & Authorization
- JWT-based authentication
- Refresh token mechanism
- Role-based access control (RBAC)
- Session management

### 2. Password Security
- bcrypt hashing (10 rounds)
- Password strength validation
- Automatic account locking after 5 failed attempts
- Password reset functionality

### 3. API Security
- Helmet.js for HTTP headers security
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- XSS protection
- SQL injection prevention
- CSRF protection

### 4. Audit Logging
- บันทึกการเข้าใช้งาน
- บันทึกการแก้ไขข้อมูล
- IP address tracking
- User agent logging

---

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

---

## 📝 Development Guidelines

### Git Workflow
```bash
# สร้าง branch ใหม่
git checkout -b feature/your-feature-name

# Commit changes
git add .
git commit -m "Add: your feature description"

# Push to remote
git push origin feature/your-feature-name
```

### Coding Standards
- ใช้ ES6+ syntax
- Async/await สำหรับ asynchronous operations
- Error handling ทุกจุด
- Comment สำหรับ logic ที่ซับซ้อน
- Consistent naming conventions

---

## 🐛 Troubleshooting

### ปัญหา: Cannot connect to database
**แก้ไข:**
1. ตรวจสอบว่า MySQL รันอยู่
2. ตรวจสอบ credentials ใน .env
3. ตรวจสอบว่าสร้าง database แล้ว

### ปัญหา: CORS error
**แก้ไข:**
1. ตรวจสอบ FRONTEND_URL ใน backend/.env
2. ตรวจสอบ VITE_API_URL ใน frontend/.env

### ปัญหา: Token expired
**แก้ไข:**
- Login ใหม่
- ตรวจสอบ JWT_EXPIRE ใน .env

---

## 📈 Roadmap

### Phase 2: Core Leave Management (Week 4-7)
- [ ] ระบบจัดการประเภทการลา
- [ ] ระบบยื่นใบลา (Multi-step form)
- [ ] ระบบอนุมัติแบบหลายขั้นตอน
- [ ] การอัปโหลดเอกสารแนบ

### Phase 3: Advanced Features (Week 8-11)
- [ ] ระบบแจ้งเตือน (Email, LINE, In-app)
- [ ] ระบบจัดการเอกสาร
- [ ] การตรวจสอบการลาซ้อนทับ
- [ ] จัดการวันหยุดราชการ

### Phase 4: Integration & Automation (Week 12-13)
- [ ] Integration กับระบบอื่น
- [ ] Scheduled tasks (Cron jobs)
- [ ] Auto-approval rules
- [ ] Reminder system

### Phase 5: Reporting & Analytics (Week 14-16)
- [ ] Dashboard แบบ interactive
- [ ] รายงานหลากหลายรูปแบบ
- [ ] Export Excel/PDF
- [ ] Analytics & Insights

### Phase 6: Testing & Deployment (Week 17-18)
- [ ] Unit testing
- [ ] Integration testing
- [ ] Performance optimization
- [ ] Production deployment

---

## 👨‍💻 Author

**Kru Black (ธวัชชัย)**
- Science Teacher @ Nam Kam Wittaya School
- Facebook: Physics.By.KruBlack
- LINE ID: hydroplasma

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- โรงเรียนวงศ์ไววิทยา สำนักงานเขตพื้นที่การศึกษาศรีสะเกษ
- Claude AI (Anthropic) - สำหรับการพัฒนาระบบ
- Open source community

---

## 📞 Support

หากมีปัญหาหรือข้อสงสัย:
1. เปิด Issue ใน GitHub
2. ติดต่อผ่าน LINE: hydroplasma
3. Email: physics.by.krublack@gmail.com

---

**Version:** 1.0.0 (Phase 1 Complete)  
**Last Updated:** January 2025
