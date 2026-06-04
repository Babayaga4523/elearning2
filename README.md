# 📚 BNI Finance E-Learning Management System (LMS)

[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

**BNI Finance E-Learning** adalah platform Management System (LMS) full-stack berbasis web yang dirancang khusus untuk mengelola, mendistribusikan, dan memantau program pelatihan karyawan di lingkungan kerja **PT BNI Finance**. 

Platform ini dirancang dengan pendekatan modular yang aman, andal, dan memiliki kinerja tinggi untuk mendukung kemandirian belajar karyawan serta transparansi audit bagi administrator L&D.

---

## 🎯 Fitur Utama Sistem

### 1. Sistem Multi-Role (RBAC)
* **KARYAWAN**: Mengakses katalog kursus, mempelajari materi video/PDF, memantau riwayat belajar (transcript), dan mengerjakan tes evaluasi.
* **ADMIN & SUPER_ADMIN**: Mengelola kursus, modul, soal ujian, memvalidasi permohonan kelas (*enrollment*), melihat laporan kepatuhan (*compliance rate*), serta audit log scheduler.
* **RBAC Fleksibel**: Izin akses (*permission*) disimpan secara dinamis di database, diinjeksikan langsung ke dalam JWT Token, dan diamankan di tingkat Edge Middleware.

### 2. Alur Pembelajaran Terstruktur
* Menggunakan alur pembelajaran yang teratur: **Pre-Test** → **Pembelajaran Modul** (Video/PDF) → **Post-Test**.
* Pembatasan akses berbasis kelulusan Post-Test dengan batas nilai kelulusan (KKM) dan batas maksimum percobaan (*max attempts*).
* Penalti nilai keterlambatan (*grace period penalty*) otomatis yang dihitung secara dinamis.

### 3. Pelacakan Kemajuan (Progress Tracking) Presisi
* **Pelacakan Video**: Progres tersinkronisasi otomatis setiap detik. Modul video dianggap selesai jika ditonton $\ge 95\%$.
* **Pelacakan Dokumen PDF**: Menggunakan deteksi halaman dan scrolling. Modul PDF dianggap selesai jika halaman yang dibaca $\ge 90\%$.

### 4. Mesin Pendaftaran Otomatis (Auto-Enrollment Engine)
* Sistem otomatis yang mendaftarkan karyawan baru ke kursus wajib berdasarkan departemen atau unit kerja masing-masing secara berkala (cron job).
* Pengiriman notifikasi pemberitahuan in-app dan email berkala untuk mengingatkan tenggat waktu pembelajaran (H-7, H-3, H-1).

### 5. Keamanan & Rate Limiting Korporat
* Autentikasi ganda: **Microsoft Entra ID (Azure AD) SSO** untuk integrasi internal dan login manual berbasis kredensial terenkripsi bcrypt.
* Perlindungan serangan brute force didukung oleh database PostgreSQL (maksimum 5 kali percobaan login per email dan 20 kali per IP dalam jendela 15 menit).

---

## 💻 Tech Stack

| Komponen | Teknologi | Deskripsi |
|---|---|---|
| **Core Framework** | **Next.js 14 (App Router)** | Framework React dengan Server Components dan optimalisasi SEO |
| **Bahasa** | **TypeScript** | Pengetikan statis aman untuk meminimalkan bug runtime |
| **Styling & UI** | **Tailwind CSS & Radix UI** | Gaya responsif modern dengan primitif UI aksesibel |
| **Database & ORM** | **PostgreSQL & Prisma ORM** | Database relasional dengan pemetaan skema tipe-aman |
| **Autentikasi** | **NextAuth.js v5 (Beta, JWT)** | Integrasi SSO Microsoft Azure AD + Kredensial Manual |
| **Grafik & Kalender** | **Recharts & FullCalendar** | Visualisasi analitik interaktif dan jadwal pembelajaran |
| **Notifikasi Email** | **Nodemailer (SMTP)** | Pengiriman email transaksional dengan mekanisme retry otomatis |
| **Ekspor Laporan** | **ExcelJS & jsPDF** | Ekspor riwayat belajar dan rekap nilai ke format Excel & PDF |

---

## 🚀 Panduan Memulai (Lokal)

### 1. Prasyarat
Pastikan komputer Anda telah terinstal:
* [Node.js](https://nodejs.org/) (versi 18.x atau yang lebih baru)
* [PostgreSQL](https://www.postgresql.org/) atau [Docker Desktop](https://www.docker.com/)

### 2. Instalasi Dependensi
Klon repositori ini dan jalankan perintah install:
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin berkas `.env.example` menjadi `.env` lalu sesuaikan isinya:
```bash
cp .env.example .env
```
Isi konfigurasi database dan kredensial SMTP pada berkas `.env` Anda:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/elearning_db?schema=public"
NEXTAUTH_SECRET="generate_secret_acak_disini"
NEXTAUTH_URL="http://localhost:3000"
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_USER="email_anda@bnif.co.id"
SMTP_PASS="password_email_anda"
```

### 4. Migrasi & Sinkronisasi Database
Singkronkan skema model Prisma ke database PostgreSQL Anda:
```bash
npx prisma db push
```

Lakukan proses *seeding* data awal (Role, Karyawan, Kursus, Ujian):
```bash
# Seed hak akses default (RBAC)
npm run seed:permissions

# (Opsional) Seed data dummy kursus dan karyawan
npm run seed:ipa
npm run seed:ips
```

### 5. Jalankan Server Pengembangan
Aktifkan server lokal Next.js:
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🐳 Berjalan dengan Docker Compose

Untuk mempermudah instalasi beserta databasenya, jalankan perintah berikut:
```bash
# Untuk menjalankan aplikasi beserta database PostgreSQL bawaan
docker-compose up -d
```
Aplikasi secara otomatis terpasang pada port `3000`.

---

## 🛠️ Perintah Pengembangan (Scripts)

* `npm run dev` - Menjalankan server pengembangan lokal (port 3000).
* `npm run build` - Membuat paket build produksi Next.js.
* `npm run start` - Menjalankan aplikasi dalam mode produksi.
* `npm run lint` - Melakukan analisis kualitas kode menggunakan ESLint.
* `npx prisma studio` - Membuka GUI interaktif untuk melihat dan mengedit data database.

---

**© 2026 PT BNI Finance - E-Learning Management System. Hak Cipta Dilindungi.**
