# 🚀 GitHub + Deployment Quick Start

## 📦 Phase 2 Complete! 

### สิ่งที่เพิ่มมาใน Phase 2:
- ✅ ระบบยื่นใบลา (Multi-step Form)
- ✅ ระบบอนุมัติ (Approval Workflow)  
- ✅ อัปโหลดเอกสารแนบ
- ✅ Supabase Integration
- ✅ Vercel Deployment Configuration
- ✅ GitHub Actions CI/CD
- ✅ Leave Request CRUD APIs

---

## 🎯 Deploy ใน 10 นาที!

### Step 1: Push to GitHub (2 นาที)

```bash
# ใน root folder ของโปรเจค
cd e-leave-system

# เริ่ม git
git init
git add .
git commit -m "Phase 2 Complete - Leave Management System"

# สร้าง repo ใน GitHub ก่อน แล้วค่อย push
git remote add origin https://github.com/YOUR_USERNAME/e-leave-system.git
git branch -M main
git push -u origin main
```

### Step 2: Setup Supabase (3 นาที)

1. ไปที่ https://supabase.com → Sign up
2. New Project → ตั้งชื่อ `e-leave-system`
3. รอ 2 นาที
4. SQL Editor → วาง code จาก `database/schema.sql`
   - แก้ `AUTO_INCREMENT` เป็น `SERIAL`
   - แก้ `BIGINT UNSIGNED` เป็น `BIGSERIAL`
5. Run SQL
6. ทำเช่นเดียวกันกับ `seeds.sql`
7. **เก็บ API Keys**: Settings → API
   - Project URL
   - anon public key
   - service_role key (เก็บเป็นความลับ!)

### Step 3: Deploy Backend to Vercel (2 นาที)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy backend
cd backend
vercel --prod

# ตั้งค่า Environment Variables ใน Vercel Dashboard:
# - SUPABASE_URL
# - SUPABASE_SERVICE_KEY  
# - JWT_SECRET
# - FRONTEND_URL
```

### Step 4: Deploy Frontend to Vercel (2 นาที)

```bash
cd ../frontend

# สร้าง .env.production
echo "VITE_API_URL=https://your-backend.vercel.app/api" > .env.production

# Deploy
vercel --prod
```

### Step 5: Test! (1 นาที)

```bash
# เปิดเว็บ
open https://your-app.vercel.app

# Login ด้วย
Username: admin
Password: Password123!
```

---

## 🔐 Environment Variables ที่ต้องตั้ง

### Backend (Vercel)
```env
NODE_ENV=production
JWT_SECRET=random-32-characters-or-more
JWT_REFRESH_SECRET=another-random-secret
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (Vercel)
```env
VITE_API_URL=https://your-backend.vercel.app/api
```

---

## 📁 โครงสร้างที่เพิ่มใน Phase 2

```
e-leave-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js          # ✨ NEW
│   │   ├── controllers/
│   │   │   └── leaveController.js   # ✨ NEW
│   │   └── routes/
│   │       └── leaves.js            # ✨ NEW
│   └── vercel.json                  # ✨ NEW
│
├── frontend/
│   └── src/
│       └── pages/
│           └── leaves/
│               └── LeaveCreate.jsx  # ✨ NEW
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml                # ✨ NEW
│
├── .gitignore                       # ✨ NEW
├── DEPLOYMENT.md                    # ✨ NEW
└── GITHUB.md                        # ✨ NEW (this file)
```

---

## 🎨 API Endpoints ใหม่

### Leave Management

```
GET    /api/leaves              # ดึงรายการใบลา
GET    /api/leaves/:id          # ดูรายละเอียดใบลา
POST   /api/leaves              # สร้างใบลาใหม่
POST   /api/leaves/:id/approve  # อนุมัติ
POST   /api/leaves/:id/reject   # ปฏิเสธ
POST   /api/leaves/:id/cancel   # ยกเลิก

# File Upload
POST   /api/leaves/:id/attachments          # อัปโหลด
DELETE /api/leaves/:id/attachments/:fileId  # ลบไฟล์
```

---

## 🔄 Auto Deployment

หลัง setup GitHub Actions แล้ว:

```bash
# แก้ไข code
git add .
git commit -m "Update feature"
git push

# Vercel จะ deploy อัตโนมัติ! 🎉
```

---

## 📊 Feature Checklist - Phase 2

- [x] ระบบยื่นใบลา (3-step form)
- [x] เลือกประเภทการลา
- [x] กรอกวันที่และเหตุผล
- [x] อัปโหลดเอกสาร
- [x] คำนวณจำนวนวันอัตโนมัติ
- [x] เลือกครูสอนแทน
- [x] API สร้างใบลา
- [x] API อนุมัติ/ปฏิเสธ
- [x] Approval Workflow (multi-level)
- [x] ตรวจสอบโควต้า
- [x] อัปโหลดไฟล์ (multer)
- [x] Supabase integration
- [x] Vercel deployment config
- [x] GitHub Actions CI/CD

---

## 🎯 Next Steps - Phase 3

- [ ] หน้ารายการใบลา (List + Filter)
- [ ] หน้าประวัติการลา
- [ ] Dashboard แบบ Interactive
- [ ] ระบบแจ้งเตือน (Email/LINE)
- [ ] สร้าง PDF ใบลา
- [ ] User Management UI
- [ ] Department Management
- [ ] Leave Type Management
- [ ] Reporting & Analytics

---

## 🐛 Known Issues

1. ⚠️ File upload ยังใช้ local storage (ต้องย้ายไป Supabase Storage)
2. ⚠️ ยังไม่มี real-time notifications
3. ⚠️ Dashboard ยังดึงข้อมูล mock

---

## 💡 Tips

### Develop Locally กับ Supabase

```bash
# ใช้ Supabase local development
npx supabase init
npx supabase start

# หรือเชื่อมตรงกับ Supabase Cloud
# ใส่ SUPABASE_URL และ SUPABASE_ANON_KEY ใน .env
```

### Debug Vercel Logs

```bash
# ดู logs real-time
vercel logs

# หรือดูใน Dashboard
# https://vercel.com/yourusername/yourproject/logs
```

### Test GitHub Actions

```bash
# Push เพื่อ trigger workflow
git push

# ดู status
# https://github.com/yourusername/e-leave-system/actions
```

---

## 📞 Need Help?

- 📖 อ่าน [DEPLOYMENT.md](./DEPLOYMENT.md) แบบละเอียด
- 🐛 เปิด [Issue](https://github.com/yourusername/e-leave-system/issues)
- 💬 ถาม Claude หรือ ChatGPT
- 📧 Email: your-email@example.com

---

**Made with ❤️ by Kru Black**

**Version**: 2.0.0 (Phase 2 Complete)  
**Last Updated**: January 2025
