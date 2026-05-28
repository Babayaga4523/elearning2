# Product Requirements Document — BNI Finance E-Learning Management System (LMS)

**Version**: 1.0
**Status**: Active Development
**Last Updated**: 2026-05-27

---

## Problem Statement

BNI Finance membutuhkan sebuah sistem manajemen pembelajaran (LMS) internal berbasis web yang memungkinkan departemen HR/Admin untuk mengelola, menjadwalkan, dan memantau pelatihan karyawan secara terpusat. Sistem ini harus menggantikan proses manual yang selama ini melibatkan spreadsheet, email, dan pencatatan tidak terstruktur — dengan platform terpadu yang mendukung multi-role (Karyawan, Admin, Super Admin), alur kursus terstruktur (Pre-test → Modul → Post-test), auto-enrollment berbasis departemen, pelacakan progres otomatis (video ≥95%, PDF ≥90%), serta reporting dan notifikasi otomatis.

---

## Solution

Sistem LMS berbasis **Next.js 14 (App Router)** dengan arsitektur full-stack yang terdiri dari:

- **Frontend**: Next.js 14 + Tailwind CSS + Radix UI + Recharts + FullCalendar
- **Backend**: Server Actions + API Routes + Prisma ORM
- **Database**: PostgreSQL dengan Prisma (output: `src/generated/client`)
- **Authentication**: NextAuth v5 (JWT strategy) dengan dual provider — Microsoft Entra ID (SSO) + Credentials (manual)
- **Scheduling**: Cron jobs berbasis API endpoint yang diproteksi bearer token
- **Email**: Nodemailer (TLS port 587)
- **Export**: ExcelJS + jsPDF untuk laporan dan transcript

---

## User Stories

### Authentication & Authorization

1. Sebagai **Karyawan**, saya ingin login menggunakan akun Microsoft (SSO via Azure AD) dengan domain `@bnifinance.co.id`, sehingga saya tidak perlu mengingat kata sandi tambahan.
2. Sebagai **Karyawan**, saya ingin login menggunakan email dan kata sandi manual jika akun Azure AD tidak tersedia, sehingga saya tetap bisa mengakses sistem.
3. Sebagai **Karyawan**, saya ingin sistem secara otomatis memblokir upaya login setelah 5 kali gagal dalam 15 menit untuk satu email, sehingga akun saya terlindungi dari brute-force attack.
4. Sebagai **Karyawan**, saya ingin Admin dapat mengunci akun saya secara manual jika diperlukan, sehingga keamanan dapat dipantau secara terpusat.
5. Sebagai **Karyawan multi-role** (misal ADMIN + KARYAWAN), saya ingin memilih role aktif setelah login, sehingga saya bisa切换 ke konteks yang sesuai dengan kebutuhan saya saat itu.
6. Sebagai **Karyawan**, saya ingin sistem menampilkan menu dan akses sesuai dengan role saya secara real-time ketika saya mengganti active role.
7. Sebagai **Super Admin**, saya ingin memiliki akses penuh ke semua fitur tanpa perlu konfigurasi dari database, sehingga saya bisa langsung mengelola sistem.
8. Sebagai **Admin**, saya ingin sistem hanya menampilkan menu dan halaman yang sesuai dengan permission saya (misal `manage_courses`, `view_course_reports`), sehingga saya tidak kebingungan dengan fitur yang bukan tanggung jawab saya.
9. Sebagai **Admin**, saya ingin middleware Edge mendeteksi permission saya sebelum request sampai ke server, sehingga akses yang tidak sah ditolak sejak awal.

### Course Management (Admin)

10. Sebagai **Admin**, saya ingin membuat kursus baru dengan填写 nama, deskripsi, dan kategori yang wajib dipilih, sehingga kursus terorganisir dengan baik.
11. Sebagai **Admin**, saya ingin menetapkan deadline kursus baik dalam bentuk tanggal tertentu maupun durasi (misal "7 hari setelah enrollment"), sehingga alur pelatihan bisa dijadwalkan.
12. Sebagai **Admin**, saya ingin kursus memiliki opsi `lockAfterDeadline` dan `gracePeriodDays`, sehingga karyawan bisa diberi waktu toleransi sebelum kehilangan akses.
13. Sebagai **Admin**, saya ingin menambahkan modul dengan tipe VIDEO atau PDF, menentukan urutan posisi, menandai sebagai `isFree`, dan menginput durasi dalam detik, sehingga saya bisa membangun struktur kursus yang bervariasi.
14. Sebagai **Admin**, saya ingin modul video mendukung URL langsung maupun integrasi SharePoint embedded (via iframe), sehingga konten tidak terbatas pada satu platform saja.
15. Sebagai **Admin**, saya ingin modul PDF mendukung upload file langsung maupun referensi SharePoint, sehingga fleksibilitas penyajian terjaga.
16. Sebagai **Admin**, saya ingin membuat Pre-test (kuis masuk) dan Post-test (kuis akhir) untuk setiap kursus, dengan konfigurasi durasi, passing score (default 70), jumlah maksimal attempt (0 = unlimited), dan opsi randomize pertanyaan/opsi.
17. Sebagai **Admin**, saya ingin mengimpor pertanyaan test dari file Excel dengan format standar (question text, options, correct answer), sehingga saya tidak perlu input satu per satu.
18. Sebagai **Admin**, saya ingin menyusun pertanyaan dalam test secara manual melalui test builder UI, sehingga saya bisa mengontrol urutan dan kualitas.
19. Sebagai **Admin**, saya ingin membuat kursus dalam status draft terlebih dahulu, kemudian mem-publish saat sudah siap, sehingga tidak ada kursus yang terlihat sebelum benar-benar final.
20. Sebagai **Admin**, saya ingin mengelompokkan kursus berdasarkan kategori, sehingga navigasi kursus lebih rapi.
21. Sebagai **Admin**, saya ingin melihat dan mengedit kursus yang sudah ada, termasuk mengubah modul, test, dan deadline, tanpa harus membuat ulang dari awal.
22. Sebagai **Admin**, saya ingin menghapus kursus dan mengharapkan cascade deletion ke modul, test, enrollment, dan progress terkait, sehingga tidak ada orphan data.
23. Sebagai **Admin**, saya ingin kursus bisa ditandai `isVisible` untuk menyembunyikannya dari katalog karyawan tanpa harus menghapus data.

### Enrollment Management

24. Sebagai **Admin**, saya ingin mendaftarkan karyawan ke kursus secara manual, baik satu per satu maupun via import Excel, sehingga saya fleksibel dalam metode enrollment.
25. Sebagai **Admin**, saya ingin membuat aturan auto-enrollment berbasis departemen (AutoEnrollmentRule), sehingga ketika aturan ini aktif, setiap karyawan baru di departemen tertentu otomatis terdaftar di kursus terkait.
26. Sebagai **Admin**, saya ingin enrollment memiliki alur status: PENDING (menunggu persetujuan) → IN_PROGRESS (aktif) → COMPLETED (selesai) atau FAILED (gagal), sehingga progres jelas terlihat.
27. Sebagai **Admin**, saya ingin enrollment PENDING memerlukan persetujuan (approve/reject) sebelum karyawan bisa mengakses kursus, sehingga ada proses validasi manual.
28. Sebagai **Admin**, saya ingin melihat dan mengelola semua enrollment di halaman enrollments, termasuk filter by status, kursus, dan departemen.
29. Sebagai **Admin**, saya ingin enrollment memiliki deadline yang dihitung secara otomatis (bisa dari `deadlineDate` kursus atau `deadlineDuration` dari tanggal enrollment), sehingga setiap karyawan mendapat tenggat waktu yang valid.
30. Sebagai **Admin**, saya ingin track `remindedAt7d`, `remindedAt3d`, `remindedAt1d` untuk setiap enrollment, sehingga saya tahu kapan reminder terakhir dikirim.

### Karyawan Learning Experience

31. Sebagai **Karyawan**, saya ingin melihat katalog kursus yang tersedia di halaman `/courses`, sehingga saya tahu apa saja yang bisa saya ikuti.
32.Sebagai **Karyawan**, saya ingin melihat detail kursus termasuk daftar modul, test, dan deadline, sebelum memutuskan untuk enroll, sehingga saya bisa planning waktu dengan baik.
33. Sebagai **Karyawan**, saya ingin enroll ke kursus dengan satu klik tombol (EnrollButton), sehingga prosesnya simpel dan cepat.
34. Sebagai **Karyawan**, saya ingin setelah enroll, saya bisa mengakses modul-modul kursus sesuai urutan, sehingga alur belajar konsisten.
35. Sebagai **Karyawan**, saya ingin menonton video dan melihat progress otomatis tersimpan (setiap `timeupdate`), sehingga jika saya menutup browser, saya bisa lanjut dari posisi yang sama.
36. Sebagai **Karyawan**, saya ingin modul video ditandai selesai secara otomatis ketika `completionRate >= 95%`, sehingga saya tahu kapan saya dianggap telah menyelesaikan modul tersebut.
37. Sebagai **Karyawan**, saya ingin membaca PDF dan melihat progress otomatis tersimpan saat saya scroll atau berpindah halaman, sehingga pembacaan saya terus terekam.
38. Sebagai **Karyawan**, saya ingin modul PDF ditandai selesai secara otomatis ketika `completionRate >= 90%`, sehingga standar penyelesaian konsisten.
39. Sebagai **Karyawan**, saya ingin mengakses pre-test sebelum mulai modul kursus, sehingga saya bisa mengukur pengetahuan awal saya.
40. Sebagai **Karyawan**, saya ingin mengikuti pre-test tanpa mempengaruhi status enrollment saya, sehingga hasil test tidak membebani saya.
41.Sebagai **Karyawan**, saya ingin mengakses post-test hanya setelah menyelesaikan semua modul kursus, sehingga test akhir menguji pemahaman yang sudah meningkat.
42. Sebagai **Karyawan**, saya ingin post-test memiliki batas attempt yang bisa dikonfigurasi Admin (0 = unlimited), sehingga saya punya kesempatan yang adil untuk mengulang jika belum lulus.
43. Sebagai **Karyawan**, saya ingin melihat hasil test saya termasuk score, status (lulus/gagal), dan waktu yang dihabiskan, sehingga saya punya feedback yang jelas.
44. Sebagai **Karyawan**, saya ingin enrollment saya secara otomatis ditandai COMPLETED ketika semua modul selesai DAN post-test lulus, sehingga tidak ada langkah manual yang diperlukan.
45. Sebagai **Karyawan**, saya ingin tetap bisa mengakses kursus selama grace period (jika ada) setelah deadline lewat, dengan catatan ada penalty berupa pengurangan poin grace period.
46. Sebagai **Karyawan**, saya ingin sistem menanyakan persetujuan saya sebelum timer test dimulai (TestRulesModal), sehingga saya memahami aturan sebelum mulai.
47. Sebagai **Karyawan**, saya ingin sistem melindungi sesi test dari kecurangan dengan validasi submit onbeforeunload (browser close) dan timer, sehingga integritas test terjaga.
48. Sebagai **Karyawan**, saya ingin jika saya menutup browser saat test berlangsung, sistem force-submit jawaban saya, sehingga tidak ada jawaban yang hilang.

### Progress Tracking & Performance

49. Sebagai **Karyawan**, saya ingin melihat dashboard utama dengan KPI cards (kursus selesai, sedang berlangsung, terlambat, rata-rata skor), sehingga saya tahu posisi saya saat ini.
50. Sebagai **Karyawan**, saya ingin melihat grafik aktivitas belajar saya dari waktu ke waktu, sehingga saya bisa melihat trend perbaikan saya.
51. Sebagai **Karyawan**, saya ingin melihat leaderboard antar rekan kerja berdasarkan jumlah kursus yang diselesaikan, sehingga ada motivasi sosial.
52. Sebagai **Karyawan**, saya ingin melihat halaman transcript performance dengan rekap semua kursus, modul yang telah selesai, skor test, dan tanggal penyelesaian, dalam bentuk tabel dan grafik pertumbuhan.
53. Sebagai **Karyawan**, saya ingin export transcript saya ke format Excel untuk keperluan laporan pribadi atau pengajuan ke atasan.
54. Sebagai **Karyawan**, saya ingin melihat kalender personal yang menampilkan deadline kursus saya dan прогресс saya, sehingga saya bisa planning schedule belajar.

### Admin Analytics & Reporting

55. Sebagai **Admin**, saya ingin melihat analytics dashboard global yang menampilkan métrik kursus secara keseluruhan — jumlah enrollment, completion rate, average score, dll.
56. Sebagai **Admin**, saya ingin melihat analytics khusus untuk video (completion rate ≥95%) dan PDF (completion rate ≥90%), sehingga saya bisa mengidentifikasi materi yang mungkin kurang efektif.
57. Sebagai **Admin**, saya ingin melihat daftar karyawan yang kesulitan (struggling users) — mereka yang progress di bawah threshold, sehingga saya bisa intervene tepat waktu.
58. Sebagai **Admin**, saya ingin melihat report per kursus dengan detail enrollment, completion rate, skor rata-rata, dan export ke Excel, sehingga pelaporan ke manajemen mudah.
59. Sebagai **Admin**, saya ingin bulk download laporan kursus dalam bentuk ZIP, sehingga tidak perlu download satu per satu.
60.Sebagai **Admin**, saya ingin melihat semua activity log sistem (SchedulerLog) untuk audit dan troubleshooting.
61. Sebagai **Admin**, saya ingin melihat locked accounts dan bisa unlock-nya, sehingga akun yang terkunci bisa diaktifkan kembali.

### Scheduling & Automation (Cron)

62. Sebagai **Admin/Sistem**, saya ingin auto-enrollment engine berjalan setiap hari — mencocokkan `AutoEnrollmentRule` berdasarkan `department`, membuat enrollment `IN_PROGRESS` untuk user yang belum enroll, dalam batch 500 per siklus, sehingga tidak ada overload database.
63. Sebagai **Admin/Sistem**, saya ingin sistem mengirim email reminder secara proaktif: H-7, H-3, H-1 sebelum deadline, baik via in-app notification maupun email, sehingga karyawan punya cukup waktu untuk menyelesaikan kursus.
64. Sebagai **Admin/Sistem**, saya ingin deadline monitoring berjalan setiap hari — menandai enrollment yang deadline-nya sudah lewat dan grace period-nya habis sebagai `FAILED`, sehingga data selalu akurat.
65. Sebagai **Admin/Sistem**, saya ingin setiap attempt login gagal direkam (email + IP + timestamp) dan di-purge secara otomatis setiap hari, sehingga tabel tidak membesar tanpa batas.
66. Sebagai **Admin/Sistem**, saya ingin laporan bulanan ke department head dikirim otomatis pada tanggal 1 setiap bulan, berisi rekap performa departemen, sehingga manajemen punya data rutin.
67. Sebagai **Admin/Sistem**, saya ingin setiap kegagalan scheduling (failed email, crashed job) dicatat dalam `SchedulerLog` dan sistem bisa retry secara otomatis, sehingga failure handling robust.
68. Sebagai **Admin**, saya ingin UI untuk memantau scheduler — melihat logs, trigger manual, dan retry queue, sehingga saya tidak buta terhadap proses background.
69.Sebagai **Admin**, saya ingin melihat kalender visual (FullCalendar) yang menampilkan deadline kursus dan enrollment, sehingga saya punya gambaran temporal dari seluruh jadwal pelatihan.

### Notifications

70. Sebagai **Karyawan**, saya ingin melihat notification bell di navbar dengan badge count unread, sehingga saya tahu ada informasi baru tanpa harus mengecek satu per satu.
71. Sebagai **Karyawan**, saya ingin menerima notifikasi saat saya di-enroll ke kursus baru, sehingga saya tahu apa yang harus saya kerjakan.
72. Sebagai **Karyawan**, saya ingin menerima reminder H-7, H-3, H-1 bahwa deadline kursus semakin dekat, sehingga saya bisa планировать waktu.
73. Sebagai **Karyawan**, saya ingin sistem mencegah duplicate notification dengan deduplication hash (userId + courseId), sehingga mailbox saya tidak penuh dengan notifikasi duplikat.
74. Sebagai **Admin**, saya ingin bisa melihat semua notifikasi sistem, sehingga saya tahu apa yang terjadi di platform.

### User Management (Admin)

75. Sebagai **Admin**, saya ingin melihat daftar semua user dengan filter berdasarkan role, departemen, dan lokasi, sehingga saya mudah mencari data karyawan.
76.Sebagai **Admin**, saya ingin melihat detail user termasuk role aktif, semua role, NIP, departemen, dan progres kursus, dalam bentuk modal yang pop-up.
77. Sebagai **Admin**, saya ingin import users dari Excel dengan kolom yang sudah ditentukan, termasuk bcrypt hashing untuk password, sehingga setup awal karyawan tidak manual satu per satu.
78. Sebagai **Admin**, saya ingin export data user ke Excel untuk keperluan audit atau backup.
79. Sebagai **Admin**, saya ingin melihat semua test attempt milik user tertentu untuk keperluan review, sehingga saya bisa memvalidasi hasil test secara manual.

### RBAC & Role Management

80. Sebagai **Super Admin**, saya ingin melihat, menambah, dan mengedit role (ADMIN, KARYAWAN, SUPER_ADMIN) dan permission-nya, sehingga saya bisa custom access control sesuai kebutuhan organisasi.
81. Sebagai **Super Admin**, saya ingin setiap role memiliki kumpulan permission yang bisa dikonfigurasi via UI, sehingga tidak perlu editing database langsung.
82. Sebagai **Super Admin**, saya ingin default permission untuk ADMIN sudah di-set (`manage_courses` dan `view_course_reports`), sehingga admin baru langsung bisa bekerja tanpa setup tambahan.

### Settings & System Configuration

83. Sebagai **Admin**, saya ingin mengakses halaman sistem settings untuk mengkonfigurasi parameter-platform, sehingga saya punya kontrol atas perilaku sistem.
84. Sebagai **Admin**, saya ingin mengelola category kursus (tambah, edit, hapus), sehingga katalog kursus tetap rapi.
85.Sebagai **Karyawan**, saya ingin mengakses halaman profile untuk melihat dan mengupdate informasi pribadi saya, sehingga data saya selalu akurat.

### Import & Integration

86. Sebagai **Admin**, saya ingin import users dari Excel dengan validasi kolom yang ketat, feedback error per baris, dan status yang jelas (berhasil/gagal), sehingga import berjalan transparan.
87. Sebagai **Admin**, saya ingin import questions dari Excel dengan struktur: question text, option A/B/C/D, correct answer, sehingga soal test bisa di-input massal.
88. Sebagai **Admin**, saya ingin import enrollments dari Excel yang mencakup user NIP/NIP, courseId, dan opsi deadline override, sehingga batch enrollment besar bisa dilakukan dari spreadsheet.
89. Sebagai **Admin**, saya ingin download Excel template untuk setiap tipe import, sehingga format yang digunakan konsisten.
90. Sebagai **Admin**, saya ingin import enrollments juga mendukung bulk enrollment via AutoEnrollmentRule, sehingga pilihan metode enrollment fleksibel.

### Security & Rate Limiting

91. Sebagai **Sistem**, saya ingin setiap cron endpoint dilindungi oleh `CRON_SECRET` bearer token, sehingga hanya scheduler resmi yang bisa trigger job.
92. Sebagai **Sistem**, saya ingin rate limiting menggunakan PostgreSQL sebagai backend (bukan memory/in-process), sehingga scale ke multiple instances tetap akurat.
93. Sebagai **Sistem**, saya ingin progress API dibatasi 100 req/min per user, sehingga tidak ada abuse endpoint.
94. Sebagai **Sistem**, saya ingin middleware Edge melakukan permission checking sebelum request mencapai server action atau API route, sehingga early rejection menghemat resource.

### Deadlines & Access Control

95. Sebagai **Karyawan**, saya ingin bisa mengakses kursus selama belum melewati deadline, sehingga waktu belajar saya jelas.
96. Sebagai **Karyawan**, saya ingin mendapat peringatan (grace period penalty warning) saat mengakses kursus setelah deadline tapi masih dalam grace period, sehingga saya tahu ada konsekuensi.
97. Sebagai **Karyawan**, saya ingin ditolak akses (ACCESS DENIED) saat deadline sudah lewat dan grace period habis ATAU `lockAfterDeadline = true`, sehingga aturan deadline tegas.
98.Sebagai **Karyawan**, saya ingin mendapat grace period penalty berupa pengurangan poin otomatis: `(daysLate / graceDays) * 10` poin maksimal, sehingga ada insentif untuk segera menyelesaikan.

---

## Implementation Decisions

### Authentication Architecture
- **JWT strategy** (NOT database sessions): Session fresh-fetched from Prisma on every token creation/refresh. `PrismaAdapter` attached for OAuth account linking only.
- **NextAuth v5** (beta) dengan dual provider: `Credentials` + `MicrosoftEntraID`. Provider config disimpan di `AUTH_MICROSOFT_ENTRA_ID_*` env vars.
- **JWT Callbacks**: Inject `sub` (userId), `role` (legacy single role), `roles[]` (multi-role), `activeRole`, `permissions[]`, `nip`, `lockedAt` into token.
- **Multi-role switching**: `POST /api/auth/set-role` → update DB `activeRole` → `session.update()` → new JWT with refreshed permissions.
- **Edge-compatible auth config** (`src/lib/auth.config.ts`): No DB imports, safe for Edge Runtime middleware enforcement.

### RBAC Architecture
- Permissions stored in `Permission` + `RolePermission` tables, fetched via `getPermissionsForRole()` in `permissions.server.ts`.
- `ROUTE_PERMISSION_MAP` in `permissions.ts` maps route prefixes to required permission keys.
- Middleware reads this map and checks JWT permissions at Edge before request reaches server.
- `SUPER_ADMIN`: all permissions hardcoded, no DB lookup needed.
- **6 Permission keys**: `manage_courses`, `view_course_reports`, `manage_users`, `manage_roles`, `view_all_reports`, `manage_settings`.

### Database Schema Design
- `User` → `roles[]` (array of UserRole enums), `activeRole`, `lockedAt`, `authMethod`, `lastLoginAt`
- `Course` → `categoryId` **REQUIRED**, `deadlineDate` or `deadlineDuration`, `lockAfterDeadline`, `gracePeriodDays`, `isPublished`, `isVisible`
- `Enrollment` → `userId + courseId` unique constraint, status flow PENDING → IN_PROGRESS → COMPLETED/FAILED, `deadline` datetime, reminder timestamps (`remindedAt7d/3d/1d`), `source` enum (MANUAL/AUTO/BULK)
- `VideoProgress` → `currentTime`, `duration`, `completionRate`, `completed` (≥95% threshold)
- `PDFProgress` → `currentPage`, `totalPages`, `pagesViewed` JSON, `scrollPosition` JSON, `completionRate`, `completed` (≥90% threshold)
- `TestAttempt` → linked to `enrollmentId`, tracks `attemptNumber`, `score`, `passed`, `timeSpent`
- `TestSession` → `ONGOING` sessions with `startedAt`, used for orphan cleanup (force-submit on browser close/timeout)
- `SchedulerLog` → jobName, status, message, duration, `failedRecipients` JSON, `metadata` JSON
- `LoginAttempt` → email + ipAddress + createdAt, TTL 15 minutes, purged daily
- `AutoEnrollmentRule` → `courseId`, `department`, `isActive`, `bypassDeadline`

### Enrollment Flow State Machine
```
ENROLLMENT_STATUS enum: PENDING | IN_PROGRESS | COMPLETED | FAILED | REJECTED

PENDING → (admin approves) → IN_PROGRESS
  IN_PROGRESS → (all modules completed + post-test passed) → COMPLETED
  IN_PROGRESS → (deadline exceeded, no grace OR lockAfterDeadline=true) → FAILED
  IN_PROGRESS → (post-test attempts exhausted without passing) → FAILED
  PENDING → (admin rejects) → REJECTED
```

### Module Completion Trigger
- `completeModule()` server action checks: all modules `completed=true` AND post-test `passed=true`
- If true → update enrollment status to `COMPLETED` in a Prisma transaction
- Video completion: `completionRate >= 95` → `completed = true`, `watchCount++`, `totalWatchTime` accumulated
- PDF completion: `completionRate >= 90` → `completed = true`, `readCount++`, `totalReadTime` accumulated

### Deadline & Access Logic
```typescript
checkEnrollmentAccess(enrollment, course):
  if no deadline → ACCESS_ALLOWED
  if currentDate <= deadline → ACCESS_ALLOWED
  if currentDate > deadline AND gracePeriod > 0 AND daysLate <= gracePeriodDays:
    → ACCESS_ALLOWED with penaltyWarning
    penalty = min((daysLate / graceDays) * 10, 10) points
  else → ACCESS_DENIED
```

### Scheduler Engine (src/lib/scheduler.ts)
- `runAutoEnrollment()`: Query all `AutoEnrollmentRule` where `isActive=true`, for each rule match users by `department` where no enrollment exists → batch create IN_PROGRESS enrollments in chunks of 500 → send notifications (deduplicated by hash) + email
- `runProactiveReminders()`: Query IN_PROGRESS enrollments where deadline - today is 7/3/1 days and `remindedAt*` is null → send in-app + email, batch 50 → update reminder timestamps
- `runDeadlineMonitoring()`: Query IN_PROGRESS enrollments where deadline < now AND (graceDays exhausted OR lockAfterDeadline=true) → update to FAILED → cleanup ONGOING test sessions → send Excel escalation to department head
- `runDepartmentalReports()`: Query all `DepartmentConfig` where `isActive=true` → generate Excel workbook per department → email to dept head
- `checkAndSendAlerts()`: Query SchedulerLog where last N consecutive jobs failed → send alert email to admin
- `checkRetryQueueHealth()`: Identify SchedulerLog entries with `status=FAILED` and retry metadata → attempt re-send
- `cleanupOrphanedTestSessions()`: Force-submit ONGOING test sessions where `startedAt + duration + buffer < now`
- `purgeExpiredAttempts()`: Delete LoginAttempt records older than 15 minutes

### Progress API Rate Limiting
- All progress APIs (`/api/progress/*`) rate-limited to 100 requests/minute per authenticated user
- Backend: PostgreSQL-backed sliding window counter (not in-memory, supports horizontal scaling)

### Cron Job Security
- All `/api/cron/*` endpoints require `Authorization: Bearer <CRON_SECRET>` header
- `CRON_SECRET` is a long random string stored in environment variables
- Vercel Cron configuration in `vercel.json` maps cron expressions to these endpoints

### Video & PDF Progress Tracking
- Client (`SmartVideoPlayer`) saves progress on `timeupdate` event → `POST /api/progress/video/save`
- Client (`PDFViewer`) saves progress on scroll + page change → `POST /api/progress/pdf/save`
- Server calculates `completionRate` per save, triggers module completion when threshold met
- Progress is idempotent — re-saving same position is safe

### Test Taking Flow
- `TestRulesModal`: Modal persetujuan sebelum test dimulai (timer acknowledgment)
- `TestSession` created on test start with status `ONGOING`, `startedAt` timestamp
- `onbeforeunload` event handler triggers force-submit if user tries to close browser mid-test
- Timer countdown client-side, auto-submit on expiry
- `submitTest()` server action validates attempt count, calculates score, updates enrollment if post-test passed
- `TestAttempt` records each attempt with `attemptNumber`, `score`, `passed`, `timeSpent`

### Email Configuration
- Nodemailer with TLS on port 587
- SMTP credentials from env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`)
- Template-based emails: enrollment notification, H-7/3/1 reminders, deadline escalation, monthly reports
- Failed email delivery tracked in `SchedulerLog.metadata` for retry

### Excel Import/Export
- `exceljs` for reading/writing `.xlsx` files
- Import routes validate header structure, return structured error rows for failed rows
- Export: Employee transcript (Excel), Course reports (Excel), Bulk course reports (ZIP via `archiver`)
- BNI brand styling applied via `excel-template.ts` (colors, fonts, headers)

### Notification Deduplication
- `notifyCourseEnrollment()` uses SHA-256 hash of `userId + courseId + notificationType` with a 24-hour window
- Prevents duplicate notifications when enrollment created via multiple channels
- Notification types: SYSTEM, ENROLLMENT, COURSE_UPDATE, REMINDER

### Timezone Handling
- All date calculations use `Asia/Jakarta` (WIB, UTC+7) via `date-fns-tz`
- Cron jobs run in UTC; reminder time is 01:00 UTC = 08:00 WIB
- Display dates always converted to WIB before rendering

---

## Testing Decisions

### External Behavior Testing (What to Test)
Tests should only cover **observable outcomes**, not internal implementation:

- Enrollment status transitions (PENDING → IN_PROGRESS → COMPLETED/FAILED)
- Module completion triggers (video ≥95%, PDF ≥90%)
- Test attempt counting and pass/fail logic
- Deadline access logic (on-time, grace period, denied)
- Rate limiting enforcement (email/IP thresholds)
- JWT permission injection on role switch
- Notification deduplication (duplicate within 24h window)

### Modules to Test

| Module | What to test |
|---|---|
| `src/lib/scheduler.ts` | Auto-enrollment rule matching, batch chunking, notification dispatch |
| `src/lib/enrollment-access.ts` | Deadline boundary conditions, grace period penalty calculation |
| `src/lib/rate-limiter.ts` | Sliding window counting, email/IP limits, automatic window expiry |
| `src/lib/enrollment.ts` | Enrollment creation, batch creation chunking, deadline resolution |
| `src/lib/services/video-progress.service.ts` | Completion rate calculation, ≥95% threshold |
| `src/lib/services/pdf-progress.service.ts` | Completion rate calculation, ≥90% threshold |
| `src/actions/enrollment.ts` | Status transition, duplicate enrollment prevention |
| `src/actions/module.ts` | Module completion → enrollment auto-complete logic |
| `src/actions/test.ts` | Test submission, attempt counting, passing score validation |
| `src/middleware.ts` | Route → permission mapping, JWT permission enforcement |

### Prior Art for Tests
- Prisma transactions: use `prisma.$transaction` wrapping enrollment status updates
- Rate limiting: existing `checkRateLimit()` function pattern to mirror in unit tests
- Progress tracking: `video-progress.service.ts` and `pdf-progress.service.ts` are already separated — unit test each independently
- Server actions: mock Prisma client, test return values and transaction calls

### Test Strategy
- **Unit tests**: Pure functions (deadline calculation, penalty formula, completion rate)
- **Integration tests**: Server actions with mocked Prisma — enrollment creation, module completion, test submission
- **E2E (Playwright)**: Login flow, course enrollment, module completion, test taking
- **Coverage target**: Core business logic (scheduler, enrollment state machine, access control)

---

## Out of Scope

- **Mobile native apps** — only web application is in scope
- **Social learning features** — forums, discussion boards, peer comments
- **Certifications & badges** — gamification beyond completion status
- **API untuk pihak ketiga** — tidak ada public API atau webhook
- **Video hosting** — sistem tidak meng-host video sendiri; hanya menyimpan URL dan SharePoint embed
- **Advanced analytics** — ML-based recommendations, predictive dropout modeling, custom dashboard builder
- **Localization / i18n** — semua teks hardcoded dalam Bahasa Indonesia
- **Dark mode** — hanya light theme
- **Two-factor authentication (2FA)** selain Azure AD MFA
- **SSO selain Microsoft Entra ID** — Google, Okta, dll. tidak dalam scope
- **Bulk course deletion** — cascade deletion per course tapi tidak ada batch delete all courses
- **Tenant / multi-org** — single organization (BNI Finance) only
- **Plugin / extension system** — tidak ada mekanisme ekstensi pihak ketiga

---

## Further Notes

### Project Structure
```
Next.js 14 App Router
├── Route Groups: (admin)/, (karyawan)/  → different layouts
├── Server Actions: src/actions/           → form actions, business logic
├── API Routes: src/app/api/              → cron, progress, admin endpoints
└── Middleware: Edge Runtime permission enforcement
```

### Current Development Status
- Sistem dalam tahap pengembangan aktif (MVP sudah fungsional)
- Multi-role system baru selesai diimplementasikan
- Scheduler engine sudah berjalan dengan cron jobs terdokumentasi
- Progress tracking (video + PDF) sudah di-implementasi
- RBAC permission system sudah wired ke middleware Edge
- Excel import/export sudah berfungsi

### Known Design Decisions
- **JWT vs Database sessions**: JWT chosen for stateless auth and performance; permission fetched fresh from DB on each token refresh
- **PostgreSQL rate limiting**: Chosen over in-memory (Redis-free) to support horizontal scaling
- **Edge-safe middleware**: DB imports excluded from middleware to stay in Edge Runtime; RBAC enforcement split between middleware (no DB) and server actions (DB)
- **No Prisma in Edge**: `src/lib/auth.config.ts` has no Prisma imports; all DB RBAC lives in `permissions.server.ts`
- **Course category is REQUIRED**: Every course must belong to a category — prevents orphaned/unorganized courses
- **Grace period penalty**: Points deducted from score, not from access — employee can still complete but with lower final score

---

*Doc generated by Claude Code — 2026-05-27*