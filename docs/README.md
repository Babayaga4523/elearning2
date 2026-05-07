# 📚 Dokumentasi FSD/BRD - E-Learning BNI Finance

**Project:** E-Learning Management System  
**Client:** BNI Finance  
**Version:** 1.0  
**Date:** 5 Mei 2026  
**Status:** Final

---

## 📑 Struktur Dokumentasi

Folder ini berisi dokumentasi lengkap untuk **Functional Specification Document (FSD)** dan **Business Requirements Document (BRD)**.

### 📄 Dokumen Utama

| No | File | Deskripsi | Status |
|----|------|-----------|--------|
| 1 | `01_ERD_SISTEM.md` | Entity Relationship Diagram - Database Design | ✅ Complete |
| 2 | `02_CLASS_DIAGRAM_SISTEM.md` | Class Diagram - System Architecture | ✅ Complete |
| 3 | `03_FLOWCHART_SISTEM.md` | Flowchart - Business Process Flow | ✅ Complete |
| 4 | `04_BUSINESS_REQUIREMENTS.md` | Business Requirements Document | 🔄 Pending |
| 5 | `05_FUNCTIONAL_REQUIREMENTS.md` | Functional Requirements Specification | 🔄 Pending |
| 6 | `06_NON_FUNCTIONAL_REQUIREMENTS.md` | Non-Functional Requirements | 🔄 Pending |
| 7 | `07_SYSTEM_ARCHITECTURE.md` | System Architecture & Technology Stack | 🔄 Pending |
| 8 | `08_TEST_PLAN.md` | Test Plan & Test Cases | 🔄 Pending |

---

## 🎯 Cara Menggunakan Dokumentasi

### Untuk Stakeholder/Management
Baca dokumen dalam urutan:
1. **Business Requirements** (04) - Memahami tujuan bisnis
2. **Flowchart** (03) - Memahami alur proses
3. **Functional Requirements** (05) - Memahami fitur sistem

### Untuk Developer/Technical Team
Baca dokumen dalam urutan:
1. **ERD** (01) - Memahami struktur database
2. **Class Diagram** (02) - Memahami arsitektur sistem
3. **Flowchart** (03) - Memahami alur proses
4. **System Architecture** (07) - Memahami teknologi yang digunakan

### Untuk QA/Testing Team
Baca dokumen dalam urutan:
1. **Functional Requirements** (05) - Memahami fitur yang harus ditest
2. **Flowchart** (03) - Memahami alur yang harus ditest
3. **Test Plan** (08) - Memahami strategi testing

---

## 📊 Ringkasan Sistem

### Tujuan Sistem
Sistem E-Learning untuk mengelola pelatihan karyawan BNI Finance dengan fitur:
- Manajemen kursus (Video & PDF)
- Enrollment & approval workflow
- Pre-test & Post-test dengan monitoring kecurangan
- Progress tracking real-time
- Deadline monitoring & reminder system
- Permission-based access control (RBAC)
- Auto enrollment berdasarkan department

### Pengguna Sistem
1. **Karyawan** - Mengikuti kursus, mengerjakan test, melihat progress
2. **Admin** - Mengelola kursus, approval enrollment, monitoring
3. **Super Admin** - Full access + permission management

### Technology Stack
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Authentication:** NextAuth.js
- **File Storage:** Local/SharePoint
- **Deployment:** Docker + Azure Kubernetes Service (AKS)

---

## 🔗 Relasi Antar Dokumen

```
Business Requirements (04)
    ↓
Functional Requirements (05)
    ↓
    ├─→ ERD (01) ────────────┐
    ├─→ Class Diagram (02) ──┤
    └─→ Flowchart (03) ──────┤
                             ↓
                System Architecture (07)
                             ↓
                Non-Functional Requirements (06)
                             ↓
                Test Plan (08)
```

---

## 📝 Changelog

### Version 1.0 (5 Mei 2026)
- ✅ Created ERD Sistem
- ✅ Created Class Diagram Sistem
- ✅ Created Flowchart Sistem
- 🔄 Pending: Business Requirements
- 🔄 Pending: Functional Requirements
- 🔄 Pending: Non-Functional Requirements
- 🔄 Pending: System Architecture
- 🔄 Pending: Test Plan

---

## 👥 Tim Dokumentasi

| Role | Name | Responsibility |
|------|------|----------------|
| Business Analyst | - | Business Requirements |
| System Analyst | - | Functional Requirements |
| Database Designer | - | ERD Design |
| Software Architect | - | Class Diagram & Architecture |
| QA Lead | - | Test Plan |

---

## 📞 Kontak

Untuk pertanyaan atau klarifikasi mengenai dokumentasi ini, hubungi:
- **Email:** -
- **Phone:** -

---

**© 2026 BNI Finance - E-Learning Management System**
