# 🚀 Deployment Guide - Supabase + Vercel

## 📋 Overview
คู่มือการ Deploy ระบบ E-Leave Management ขึ้น Production โดยใช้:
- **Database**: Supabase (PostgreSQL)
- **Backend API**: Vercel Serverless Functions
- **Frontend**: Vercel
- **File Storage**: Supabase Storage

---

## 🗄️ Part 1: Supabase Setup

### 1.1 สร้าง Supabase Project

1. ไปที่ https://supabase.com
2. Sign in / Sign up
3. คลิก "New Project"
4. กรอกข้อมูล:
   - **Project Name**: e-leave-system
   - **Database Password**: สร้างรหัสผ่านที่แข็งแรง
   - **Region**: Southeast Asia (Singapore)
5. รอ ~2 นาที ให้โปรเจคสร้างเสร็จ

### 1.2 นำเข้า Database Schema

1. ไปที่ **SQL Editor** ในแผง Supabase
2. คัดลอก schema จาก `database/schema.sql`
3. แก้ไข syntax ให้เข้ากับ PostgreSQL:

```sql
-- แทนที่ AUTO_INCREMENT ด้วย SERIAL
-- แทนที่ BIGINT UNSIGNED ด้วย BIGSERIAL
-- แทนที่ VARCHAR(255) ด้วย TEXT (ถ้าจำเป็น)

-- ตัวอย่าง:
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  -- ... rest of fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

4. Run SQL script
5. ทำเช่นเดียวกันกับ `database/seeds.sql`

### 1.3 ตั้งค่า Storage Bucket

1. ไปที่ **Storage** > **New Bucket**
2. สร้าง bucket ชื่อ `leave-attachments`
3. ตั้งค่า:
   - **Public**: เปิด (หรือปิดถ้าต้องการ authentication)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `application/pdf, image/jpeg, image/png`

### 1.4 เก็บ API Keys

จาก **Settings** > **API**:
- ✅ **Project URL**: `https://xxxxx.supabase.co`
- ✅ **anon public**: สำหรับ Frontend
- ✅ **service_role secret**: สำหรับ Backend (เก็บเป็นความลับ!)

---

## ⚙️ Part 2: Backend Deployment (Vercel)

### 2.1 เตรียม Backend Code

1. แก้ไข `backend/src/config/database.js` ให้ใช้ Supabase:

```javascript
// ใช้ไฟล์ supabase.js แทน
const { supabase } = require('./supabase');

const query = async (sql, params = []) => {
  // ใช้ Supabase query
  const { data, error } = await supabase
    .from('tablename')
    .select('*');
  
  if (error) throw error;
  return data;
};
```

2. เพิ่ม `vercel.json` (สร้างแล้ว)

### 2.2 Deploy Backend

**Option A: Vercel CLI**
```bash
cd backend
npm i -g vercel
vercel login
vercel --prod
```

**Option B: Vercel Dashboard**
1. ไปที่ https://vercel.com
2. Import Project จาก GitHub
3. เลือก folder `backend`
4. ตั้งค่า Environment Variables (ด้านล่าง)

### 2.3 Environment Variables (Vercel)

เพิ่มใน **Settings** > **Environment Variables**:

```env
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRE=2h
JWT_REFRESH_EXPIRE=7d

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Frontend URL
FRONTEND_URL=https://your-app.vercel.app

# Email (ถ้าใช้)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 2.4 Test API

```bash
curl https://your-api.vercel.app/health
```

---

## 🎨 Part 3: Frontend Deployment (Vercel)

### 3.1 เตรียม Frontend Code

1. แก้ไข `frontend/.env.production`:

```env
VITE_API_URL=https://your-api.vercel.app/api
```

2. แก้ไข `frontend/vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
```

### 3.2 Deploy Frontend

**Option A: Vercel CLI**
```bash
cd frontend
vercel --prod
```

**Option B: Vercel Dashboard**
1. Import Project
2. เลือก folder `frontend`
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`

### 3.3 Environment Variables (Frontend)

```env
VITE_API_URL=https://your-api.vercel.app/api
```

### 3.4 Custom Domain (Optional)

1. ไปที่ **Settings** > **Domains**
2. เพิ่ม Custom Domain: `e-leave.yourschool.ac.th`
3. ตั้งค่า DNS records ตามที่ Vercel แจ้ง

---

## 🔄 Part 4: GitHub Integration

### 4.1 สร้าง Repository

```bash
# ใน root folder
git init
git add .
git commit -m "Initial commit - E-Leave System"
git branch -M main
git remote add origin https://github.com/yourusername/e-leave-system.git
git push -u origin main
```

### 4.2 Connect Vercel to GitHub

1. **Backend Project**:
   - Settings > Git > Connect Repository
   - เลือก repo และ branch `main`
   - Root Directory: `backend`

2. **Frontend Project**:
   - Settings > Git > Connect Repository
   - Root Directory: `frontend`

3. **Auto Deploy**: จะ deploy อัตโนมัติทุกครั้งที่ push

### 4.3 GitHub Secrets (สำหรับ CI/CD)

ไปที่ **Settings** > **Secrets and variables** > **Actions**:

```
VERCEL_TOKEN=xxx
VERCEL_ORG_ID=xxx
VERCEL_PROJECT_ID=xxx (frontend)
VERCEL_PROJECT_ID_API=xxx (backend)
VITE_API_URL=https://your-api.vercel.app/api
```

---

## 🔐 Part 5: Security Checklist

### 5.1 Environment Variables
- [ ] เปลี่ยน JWT_SECRET เป็นค่าใหม่ (random string >= 32 ตัวอักษร)
- [ ] ใช้ SUPABASE_SERVICE_KEY แทน password ของ database
- [ ] ไม่เปิดเผย secrets ใน code หรือ GitHub

### 5.2 Supabase Security
- [ ] เปิด Row Level Security (RLS) สำหรับทุกตาราง
- [ ] ตั้งค่า Policies ให้เข้มงวด
- [ ] จำกัด API rate limiting

### 5.3 Vercel Security
- [ ] เปิด HTTPS (default)
- [ ] ตั้งค่า CORS ให้ถูกต้อง
- [ ] ตั้งค่า Headers ป้องกัน XSS, CSRF

---

## 📊 Part 6: Monitoring & Maintenance

### 6.1 Vercel Analytics
- เปิด **Analytics** ใน Vercel Dashboard
- ดู Web Vitals, Performance metrics

### 6.2 Supabase Dashboard
- **Database** > **Reports**: ดู query performance
- **Auth** > **Users**: จัดการผู้ใช้
- **Storage**: ดู usage

### 6.3 Error Tracking
พิจารณาใช้:
- **Sentry** (error tracking)
- **LogRocket** (session replay)
- **Vercel Logs** (built-in)

---

## 🔧 Part 7: Post-Deployment Tasks

### 7.1 Test ทุกฟีเจอร์
- [ ] Login/Logout
- [ ] สร้างผู้ใช้
- [ ] ยื่นใบลา
- [ ] อัปโหลดไฟล์
- [ ] อนุมัติ/ปฏิเสธ

### 7.2 Setup Backup
- Supabase มี auto-backup (ตาม plan)
- Export database เป็น SQL ทุกสัปดาห์:
  ```bash
  # จาก Supabase Dashboard > Database > Backups
  ```

### 7.3 Email Notification
- ตั้งค่า SMTP (Gmail, SendGrid, etc.)
- ทดสอบส่งอีเมล

### 7.4 Documentation
- อัพเดท README.md ด้วย production URLs
- บันทึก credentials ไว้ใน password manager

---

## 🐛 Troubleshooting

### ปัญหา: CORS Error
**แก้ไข**: เช็ค `FRONTEND_URL` ใน backend environment variables

### ปัญหา: Database Connection Failed
**แก้ไข**: 
1. เช็ค `SUPABASE_URL` และ `SUPABASE_SERVICE_KEY`
2. เช็ค Supabase project ว่า active อยู่

### ปัญหา: File Upload Failed
**แก้ไข**:
1. เช็ค Storage bucket สร้างแล้ว
2. เช็ค bucket policies
3. เช็ค file size limit

### ปัญหา: Build Failed on Vercel
**แก้ไข**:
1. เช็ค logs ใน Vercel dashboard
2. ลอง build locally: `npm run build`
3. เช็ค Node version (ควรเป็น 18+)

---

## 📱 Quick Deploy Commands

```bash
# Deploy ทั้งหมดในคำสั่งเดียว

# 1. Backend
cd backend
vercel --prod

# 2. Frontend
cd ../frontend
vercel --prod

# 3. Check status
curl https://your-api.vercel.app/health
open https://your-app.vercel.app
```

---

## 🎯 Production URLs

หลัง deploy เสร็จ จะได้ URLs:

```
Frontend: https://e-leave-system.vercel.app
Backend API: https://e-leave-api.vercel.app
Supabase DB: https://xxxxx.supabase.co
```

บันทึก URLs เหล่านี้ไว้!

---

## 💰 Cost Estimate

### Free Tier (พอใช้งานโรงเรียนขนาดเล็ก-กลาง)

- **Vercel**: Free (100GB bandwidth/month)
- **Supabase**: Free (500MB database, 1GB storage)
- **Total**: 0 บาท/เดือน ✅

### Pro Tier (โรงเรียนขนาดใหญ่)

- **Vercel Pro**: $20/month
- **Supabase Pro**: $25/month  
- **Total**: ~1,350 บาท/เดือน

---

## 📞 Support

- 📖 Vercel Docs: https://vercel.com/docs
- 📖 Supabase Docs: https://supabase.com/docs
- 💬 Discord: Vercel & Supabase communities
- 📧 Email: support@vercel.com, support@supabase.com

---

**Happy Deploying! 🚀**
