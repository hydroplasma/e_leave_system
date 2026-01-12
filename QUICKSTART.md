# 🚀 คู่มือเริ่มต้นใช้งานด่วน (Quick Start Guide)

## ขั้นตอนการติดตั้งและรัน (5 นาที)

### 1. ติดตั้ง Dependencies

```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install
```

### 2. ตั้งค่า Database

```bash
# เข้า MySQL
mysql -u root -p

# สร้าง Database
CREATE DATABASE e_leave_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE e_leave_system;

# Import schema และ seed data
SOURCE /path/to/database/schema.sql;
SOURCE /path/to/database/seeds.sql;

# หรือใช้คำสั่งเดียว
mysql -u root -p e_leave_system < database/schema.sql
mysql -u root -p e_leave_system < database/seeds.sql
```

### 3. ตั้งค่า Environment Variables

**Backend (.env)**
```bash
cd backend
cp .env.example .env

# แก้ไข .env
DB_PASSWORD=your_mysql_password
JWT_SECRET=your-secret-key-here
```

**Frontend (.env)**
```bash
cd frontend
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

### 4. รันโปรเจค

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
```
✅ Backend: http://localhost:5000

**Terminal 2 - Frontend**
```bash
cd frontend  
npm run dev
```
✅ Frontend: http://localhost:5173

### 5. เข้าสู่ระบบ

เปิดเบราว์เซอร์: http://localhost:5173

**บัญชีทดสอบ:**
- Username: `admin`
- Password: `Password123!`

---

## 📦 โครงสร้างไฟล์ที่สำคัญ

```
e-leave-system/
├── backend/
│   ├── .env.example        👈 แก้เป็น .env
│   ├── package.json        
│   └── src/
│       ├── app.js          👈 Express app
│       ├── config/         👈 Database config
│       ├── controllers/    👈 API logic
│       └── routes/         👈 API endpoints
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx         👈 Main app
│       ├── contexts/       👈 Auth context
│       ├── pages/          👈 Login, Dashboard
│       └── services/       👈 API calls
│
└── database/
    ├── schema.sql          👈 Database structure
    └── seeds.sql           👈 Sample data
```

---

## 🔧 คำสั่งที่ใช้บ่อย

```bash
# Backend
npm run dev          # รันในโหมด development
npm start           # รันในโหมด production
npm test            # รัน tests

# Frontend
npm run dev         # รัน development server
npm run build       # Build สำหรับ production
npm run preview     # Preview production build
```

---

## ✅ Checklist การติดตั้ง

- [ ] ติดตั้ง Node.js (>= 18.x)
- [ ] ติดตั้ง MySQL (>= 8.0)
- [ ] สร้าง database และ import schema/seeds
- [ ] ตั้งค่า .env ทั้ง backend และ frontend
- [ ] รัน npm install ทั้งสองส่วน
- [ ] รัน backend (port 5000)
- [ ] รัน frontend (port 5173)
- [ ] เข้าสู่ระบบด้วย admin/Password123!

---

## 🐛 แก้ปัญหาเบื้องต้น

### ปัญหา 1: Cannot connect to database
```bash
# ตรวจสอบ MySQL รันอยู่หรือไม่
mysql --version

# ตรวจสอบ credentials ใน backend/.env
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=e_leave_system
```

### ปัญหา 2: Port already in use
```bash
# เปลี่ยน port ใน backend/.env
PORT=5001

# เปลี่ยน port ใน frontend/vite.config.js
server: { port: 5174 }
```

### ปัญหา 3: CORS error
```bash
# ตรวจสอบใน backend/.env
FRONTEND_URL=http://localhost:5173

# ตรวจสอบใน frontend/.env
VITE_API_URL=http://localhost:5000/api
```

---

## 📱 หน้าจอที่มีในระบบ (Phase 1)

1. ✅ **Login** - หน้าเข้าสู่ระบบ
2. ✅ **Dashboard** - หน้าหลักแสดงภาพรวม
3. 🚧 **Leave Create** - ยื่นใบลา (Phase 2)
4. 🚧 **Leave List** - รายการใบลา (Phase 2)
5. 🚧 **User Management** - จัดการผู้ใช้ (Phase 2)

---

## 🎯 ขั้นตอนถัดไป

หลังจากรันระบบได้แล้ว:

1. ทดสอบ Login/Logout
2. ดู Dashboard
3. ทดสอบ User Management API ด้วย Postman/Thunder Client
4. เริ่มพัฒนา Phase 2: Leave Management

---

## 💡 เทคนิค

### ดูข้อมูลใน Database
```sql
-- ดูผู้ใช้ทั้งหมด
SELECT * FROM users;

-- ดูประเภทการลา
SELECT * FROM leave_types;

-- ดูโควต้าการลา
SELECT u.full_name, lt.name, lq.total_days, lq.used_days, lq.remaining_days
FROM leave_quotas lq
JOIN users u ON lq.user_id = u.id
JOIN leave_types lt ON lq.leave_type_id = lt.id;
```

### ทดสอบ API ด้วย cURL
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Password123!"}'

# Get Users (ต้องใส่ token)
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📞 ต้องการความช่วยเหลือ?

- 📖 อ่าน README.md แบบเต็ม
- 🐛 เปิด Issue ใน GitHub
- 💬 ติดต่อ LINE: hydroplasma

---

**Happy Coding! 🎉**
