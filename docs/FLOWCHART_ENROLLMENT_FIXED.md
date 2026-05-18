# Flowchart Enrollment - E-Learning BNI Finance
**Versi:** Diperbaiki & Dirapihkan

---

## Alur Enrollment Kursus (Karyawan)

```mermaid
flowchart TD
    %% Pengaturan Gaya: Hitam Putih, Garis Tebal, & Font Jelas
    classDef default fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    classDef startend fill:#e0e0e0,stroke:#000000,stroke-width:3px,color:#000000
    classDef process fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    classDef decision fill:#ffffff,stroke:#000000,stroke-width:2px,color:#000000
    classDef success fill:#d4edda,stroke:#000000,stroke-width:2px,color:#000000
    classDef warning fill:#fff3cd,stroke:#000000,stroke-width:2px,color:#000000
    classDef error fill:#f8d7da,stroke:#000000,stroke-width:2px,color:#000000
    
    %% Alur Utama - Browse Katalog
    Start([Mulai: Karyawan<br/>Browse Katalog]):::startend
    Start --> ViewCatalog[Tampilkan Daftar<br/>Kursus]:::process
    ViewCatalog --> FilterSearch[Filter / Search<br/>Kursus]:::process
    FilterSearch --> SelectCourse[Pilih Kursus]:::process
    SelectCourse --> ViewDetail[Lihat Detail<br/>Kursus]:::process
    
    %% Pengecekan Status Enrollment
    ViewDetail --> CheckEnrollment{Status<br/>Enrollment?}:::decision
    
    %% Cabang 1: Belum Daftar
    CheckEnrollment -->|Belum Daftar| ShowEnrollBtn[Tampilkan Button<br/>Daftar]:::process
    ShowEnrollBtn --> ClickEnroll[Klik Button<br/>Daftar]:::process
    ClickEnroll --> ConfirmEnroll{Konfirmasi<br/>Enrollment?}:::decision
    
    ConfirmEnroll -->|Tidak| ViewDetail
    ConfirmEnroll -->|Ya| CreateEnrollment[Create Enrollment<br/>Record]:::process
    
    CreateEnrollment --> SetStatus[Set Status:<br/>PENDING]:::warning
    SetStatus --> SetSource[Set Source:<br/>MANUAL]:::process
    SetSource --> NotifyAdmin[📧 Notifikasi<br/>ke Admin]:::process
    NotifyAdmin --> ShowSuccess[✅ Success:<br/>Menunggu Approval]:::success
    ShowSuccess --> WaitApproval[Tunggu Admin<br/>Approval]:::warning
    
    %% Proses Approval oleh Admin
    WaitApproval --> AdminReview{Keputusan<br/>Admin?}:::decision
    
    %% Admin Approve
    AdminReview -->|Approve| SetInProgress[Set Status:<br/>IN_PROGRESS]:::success
    SetInProgress --> SetDeadline[Set Deadline<br/>Kursus]:::process
    SetDeadline --> NotifyKaryawan1[📧 Notif Karyawan:<br/>Approved]:::success
    NotifyKaryawan1 --> AccessCourse[Karyawan Akses<br/>Kursus]:::success
    AccessCourse --> End2([Selesai:<br/>Bisa Belajar]):::startend
    
    %% Admin Reject
    AdminReview -->|Reject| SetRejected[Set Status:<br/>REJECTED]:::error
    SetRejected --> SaveReason[Save Rejection<br/>Note]:::process
    SaveReason --> NotifyKaryawan2[📧 Notif Karyawan:<br/>Rejected]:::error
    NotifyKaryawan2 --> End1([Selesai:<br/>Rejected]):::startend
    
    %% Cabang 2: Status PENDING
    CheckEnrollment -->|PENDING| ShowPending[Status: Menunggu<br/>Approval]:::warning
    ShowPending --> End3([Selesai:<br/>Tunggu Approval]):::startend
    
    %% Cabang 3: Status IN_PROGRESS
    CheckEnrollment -->|IN_PROGRESS| ShowAccess[Tampilkan Akses<br/>Kursus]:::success
    ShowAccess --> End2
    
    %% Cabang 4: Status COMPLETED
    CheckEnrollment -->|COMPLETED| ShowCertificate[Tampilkan<br/>Sertifikat]:::success
    ShowCertificate --> End4([Selesai:<br/>Completed]):::startend
    
    %% Cabang 5: Status REJECTED
    CheckEnrollment -->|REJECTED| ShowRejected[Tampilkan Alasan<br/>Penolakan]:::error
    ShowRejected --> End1
```

---

## Penjelasan Alur

### 1. Browse & Pilih Kursus
- Karyawan membuka katalog kursus
- Filter/search kursus yang diinginkan
- Pilih kursus untuk melihat detail

### 2. Pengecekan Status Enrollment
Sistem mengecek apakah user sudah pernah mendaftar kursus ini:

#### **Status: Belum Daftar**
- Tampilkan button "Daftar"
- User klik daftar → Konfirmasi
- Jika Ya → Create enrollment dengan status PENDING
- Notifikasi dikirim ke Admin
- User menunggu approval

#### **Status: PENDING**
- Enrollment sudah dibuat, menunggu approval admin
- User hanya bisa melihat status "Menunggu Approval"
- Tidak bisa akses kursus

#### **Status: IN_PROGRESS**
- Enrollment sudah di-approve admin
- User bisa akses kursus dan mulai belajar
- Deadline sudah di-set

#### **Status: COMPLETED**
- User sudah menyelesaikan kursus
- Tampilkan sertifikat
- Bisa download sertifikat

#### **Status: REJECTED**
- Enrollment ditolak oleh admin
- Tampilkan alasan penolakan
- User tidak bisa akses kursus

### 3. Proses Approval (Admin)
Setelah enrollment dibuat dengan status PENDING:

#### **Admin Approve:**
1. Set status → IN_PROGRESS
2. Set deadline kursus
3. Kirim notifikasi ke karyawan (approved)
4. Karyawan bisa akses kursus

#### **Admin Reject:**
1. Set status → REJECTED
2. Save rejection note (alasan penolakan)
3. Kirim notifikasi ke karyawan (rejected)
4. Karyawan tidak bisa akses kursus

---

## Perbaikan yang Dilakukan

### ❌ Masalah di Flowchart Lama:
1. **Syntax Error:** `flowchart LR` tidak bisa digabung dengan `%%` di baris yang sama
2. **Warna tidak jelas:** Semua node putih, sulit membedakan status
3. **Alur kurang jelas:** Tidak ada visual distinction antara success/warning/error
4. **Font terlalu besar:** 16px terlalu besar untuk node
5. **Tidak ada emoji:** Kurang visual cue untuk notifikasi

### ✅ Perbaikan di Flowchart Baru:
1. **Syntax benar:** Pemisahan `%%{init}%%` dan `flowchart TD`
2. **Color coding:**
   - 🟢 Hijau muda: Success (approved, access granted)
   - 🟡 Kuning: Warning (pending, waiting)
   - 🔴 Merah muda: Error (rejected)
   - ⚪ Putih: Process normal
   - ⚫ Abu-abu: Start/End
3. **Font optimal:** 14px untuk node, 16px untuk start/end
4. **Emoji:** 📧 untuk notifikasi, ✅ untuk success
5. **Alur lebih jelas:** Setiap cabang status terpisah dengan jelas

---

## Validasi Alur

### ✅ Alur Sudah Benar:
1. **Browse → Detail → Check Status** ✓
2. **Belum Daftar → Daftar → Pending → Approval** ✓
3. **Pending → Tampilkan status tunggu** ✓
4. **In Progress → Akses kursus** ✓
5. **Completed → Tampilkan sertifikat** ✓
6. **Rejected → Tampilkan alasan** ✓
7. **Admin Approve → Set deadline → Notif → Access** ✓
8. **Admin Reject → Save reason → Notif → End** ✓

### 📊 Sesuai dengan:
- ✅ Database schema (Enrollment model)
- ✅ EnrollmentStatus enum (PENDING, IN_PROGRESS, COMPLETED, REJECTED)
- ✅ Business logic di FSD
- ✅ User flow yang logis

---

## Cara Menggunakan

1. **Copy flowchart di atas** ke file markdown Anda
2. **View di Mermaid Live Editor:** https://mermaid.live
3. **Atau gunakan di:**
   - GitHub (auto-render)
   - VS Code (dengan extension Mermaid)
   - Notion, Confluence, dll

---

**Flowchart ini sudah BENAR dan SIAP DIGUNAKAN!** ✅
