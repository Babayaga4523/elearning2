# FSD E-Learning BNI Finance - Part 3 (FINAL)
**Lanjutan dari:** FSD_ELEARNING_BNIF2.md

---

## 9. Service Level Agreement (SLA)

### 9.1 System Availability
- **Target:** 99.5% uptime
- **Downtime:** Max 3.6 jam/bulan
- **Maintenance Window:** Sabtu 02:00-06:00 WIB
- **Monitoring:** 24/7 dengan AWS CloudWatch

### 9.2 Performance
- **Page Load Time:** < 2 detik
- **API Response Time:** < 500ms
- **Video Streaming:** < 3 detik buffering
- **Database Query:** < 100ms (average)

### 9.3 Support Response Time
- **Critical Issues:** < 1 jam
- **High Priority:** < 4 jam (working hours)
- **Normal Priority:** < 24 jam
- **Low Priority:** < 72 jam

### 9.4 Resolution Time
- **Critical:** < 4 jam
- **High:** < 24 jam
- **Normal:** < 72 jam
- **Low:** < 1 minggu

### 9.5 Data Backup & Recovery
- **Backup Frequency:** Daily (03:00 WIB)
- **Backup Retention:** 30 days
- **Recovery Time Objective (RTO):** < 4 jam
- **Recovery Point Objective (RPO):** < 24 jam

### 9.6 Security
- **Security Audit:** Quarterly
- **Penetration Testing:** Bi-annually
- **Vulnerability Patching:** < 48 jam (critical), < 7 hari (normal)
- **SSL Certificate:** Always valid

---

## 10. Mock-up & User Interface (UI)

### 10.1 Login Page
**Features:**
- Email/Password form
- "Login dengan Microsoft" button
- "Lupa Password" link
- Remember me checkbox
- Responsive design (mobile-friendly)

**Elements:**
- BNI Finance logo
- Background image
- Form validation
- Error messages
- Loading state

### 10.2 Karyawan Dashboard
**Features:**
- Welcome banner dengan nama user
- KPI cards:
  - Total Enrolled Courses
  - In Progress Courses
  - Completed Courses
  - Certificates Earned
- Upcoming deadlines section
- Recent courses carousel
- Learning progress chart
- Quick access buttons

**Layout:**
- Header: Logo, Navigation, Notifications, Profile
- Sidebar: Menu (Dashboard, Courses, Calendar, Performance, Notifications)
- Main content: KPI + Charts + Lists
- Footer: Copyright, Links

### 10.3 Course Catalog
**Features:**
- Grid/List view toggle
- Filter by category (dropdown)
- Search bar (real-time search)
- Sort by (Newest, Popular, A-Z)
- Pagination
- Course cards:
  - Thumbnail image
  - Title
  - Description (truncated)
  - Category badge
  - Duration
  - Enroll button / Status badge

**Filters:**
- All Categories
- By Category
- Enrolled Only
- Completed Only

### 10.4 Course Detail Page
**Sections:**
- **Header:**
  - Course thumbnail
  - Title
  - Category
  - Description
  - Enroll button / Access button / Status badge
  
- **Course Info:**
  - Duration
  - Total modules
  - Tests (PRE/POST)
  - Deadline (if enrolled)
  - Progress bar (if enrolled)
  
- **Curriculum:**
  - Module list dengan icon (video/PDF)
  - Module duration
  - Completion checkmark
  - Lock icon (jika belum enrolled)
  
- **Tests:**
  - PRE-TEST info (if exists)
  - POST-TEST info
  - Passing score
  - Max attempts

### 10.5 Module Player (Video)
**Features:**
- Video player dengan controls:
  - Play/Pause
  - Volume
  - Fullscreen
  - Playback speed
  - Progress bar
- Module info sidebar:
  - Module title
  - Description
  - Duration
  - Progress percentage
- Navigation:
  - Previous module button
  - Next module button
  - Back to course button
- Progress tracking indicator
- Auto-save progress

### 10.6 Module Player (PDF)
**Features:**
- PDF viewer dengan controls:
  - Zoom in/out
  - Page navigation
  - Fullscreen
  - Download button
- Module info sidebar:
  - Module title
  - Description
  - Total pages
  - Progress percentage
- Navigation:
  - Previous module button
  - Next module button
  - Back to course button
- Progress tracking indicator
- Bookmark current page

### 10.7 Test Interface
**Features:**
- Test header:
  - Test title
  - Question counter (1/10)
  - Timer countdown
  - Submit button
- Question area:
  - Question number
  - Question text
  - Multiple choice options (radio buttons)
  - Mark for review checkbox
- Navigation:
  - Previous question
  - Next question
  - Question palette (grid)
- Warning banner (jika violation detected)
- Confirmation modal (before submit)

**States:**
- Answered (green)
- Not answered (gray)
- Marked for review (yellow)
- Current question (blue border)

### 10.8 Admin Dashboard
**Features:**
- KPI metrics cards:
  - Total Courses
  - Total Enrollments
  - Completion Rate
  - Average Test Score
  - Active Learners
- Charts:
  - Enrollment trend (line chart)
  - Completion by department (bar chart)
  - Test score distribution (histogram)
  - Top 10 courses (table)
- Recent enrollments table (pending approval)
- Quick actions:
  - Create Course
  - View All Enrollments
  - View Reports
  - Manage Users

### 10.9 Admin Course Management
**Features:**
- Course list table:
  - Thumbnail
  - Title
  - Category
  - Status (Published/Draft)
  - Total Enrollments
  - Completion Rate
  - Actions (Edit, Delete, Publish/Unpublish)
- Filters:
  - All / Published / Draft
  - By Category
  - Search
- Create Course button
- Bulk actions
- Export to Excel

### 10.10 Admin Enrollment Management
**Features:**
- Enrollment list table:
  - User name
  - NIP
  - Department
  - Course title
  - Status
  - Enrolled date
  - Deadline
  - Days remaining
  - Actions (Approve, Reject, View Details)
- Filters:
  - By Status (PENDING, IN_PROGRESS, COMPLETED, FAILED, REJECTED)
  - By Department
  - By Course
  - Date range
- Bulk approve/reject
- Export to Excel

### 10.11 Certificate Page
**Features:**
- Certificate preview (PDF)
- Download button
- Share button (optional)
- Certificate info:
  - Certificate number
  - Course name
  - Completion date
  - Final score
- Verification link

---

## 11. Report

### 11.1 Course Completion Report
**Data Columns:**
- Course Name
- Category
- Total Enrolled
- In Progress
- Completed
- Failed
- Completion Rate (%)
- Average Score

**Filters:**
- Date Range
- Category
- Department
- Status

**Export:** Excel, PDF

**Visualization:** Bar chart (Completion rate by course)

### 11.2 User Progress Report
**Data Columns:**
- User Name
- NIP
- Department
- Total Enrolled
- In Progress
- Completed
- Failed
- Completion Rate (%)
- Average Score
- Certificates Earned

**Filters:**
- Department
- Date Range
- Status

**Export:** Excel, PDF

**Visualization:** Pie chart (Status distribution)

### 11.3 Test Score Report
**Data Columns:**
- User Name
- NIP
- Department
- Course Name
- Test Type (PRE/POST)
- Score
- Passing Score
- Status (Pass/Fail)
- Attempt Number
- Test Date
- Time Spent

**Filters:**
- Course
- Test Type
- Date Range
- Pass/Fail
- Department

**Export:** Excel, PDF

**Visualization:** Histogram (Score distribution)

### 11.4 Enrollment Status Report
**Data Columns:**
- User Name
- NIP
- Department
- Course Name
- Status
- Enrolled Date
- Approved Date
- Deadline
- Days Remaining
- Progress (%)
- Approved By

**Filters:**
- Status
- Department
- Course
- Date Range

**Export:** Excel, PDF

**Visualization:** Stacked bar chart (Status by department)

### 11.5 Certificate Issuance Report
**Data Columns:**
- Certificate Number
- User Name
- NIP
- Department
- Course Name
- Completion Date
- Final Score
- Issued Date

**Filters:**
- Date Range
- Department
- Course

**Export:** Excel, PDF

**Visualization:** Line chart (Certificates issued over time)

### 11.6 Deadline Monitoring Report
**Data Columns:**
- User Name
- NIP
- Department
- Course Name
- Deadline
- Days Remaining
- Progress (%)
- Status
- Last Reminder Sent

**Filters:**
- Department
- Course
- Days Remaining (< 7, < 3, < 1, Overdue)

**Export:** Excel, PDF

**Visualization:** Gauge chart (On-time vs Overdue)

---

## 12. User Access Matrix

| Feature | KARYAWAN | ADMIN | SUPER_ADMIN |
|---------|----------|-------|-------------|
| **Authentication** |
| Login | ✅ | ✅ | ✅ |
| Logout | ✅ | ✅ | ✅ |
| Change Password | ✅ | ✅ | ✅ |
| **Course** |
| View Catalog | ✅ | ✅ | ✅ |
| View Course Detail | ✅ | ✅ | ✅ |
| Enroll Course | ✅ | ✅ | ✅ |
| Access Enrolled Course | ✅ | ✅ | ✅ |
| Create Course | ❌ | ✅ | ✅ |
| Edit Course | ❌ | ✅ | ✅ |
| Delete Course | ❌ | ❌ | ✅ |
| Publish/Unpublish Course | ❌ | ✅ | ✅ |
| **Module** |
| View Module | ✅ | ✅ | ✅ |
| Complete Module | ✅ | ✅ | ✅ |
| Create Module | ❌ | ✅ | ✅ |
| Edit Module | ❌ | ✅ | ✅ |
| Delete Module | ❌ | ❌ | ✅ |
| Upload Video/PDF | ❌ | ✅ | ✅ |
| **Test** |
| Take Test | ✅ | ✅ | ✅ |
| View Own Test Results | ✅ | ✅ | ✅ |
| Retry Test | ✅ | ✅ | ✅ |
| View All Test Results | ❌ | ✅ | ✅ |
| Create Test | ❌ | ✅ | ✅ |
| Edit Test | ❌ | ✅ | ✅ |
| Delete Test | ❌ | ❌ | ✅ |
| Add Questions | ❌ | ✅ | ✅ |
| **Enrollment** |
| View Own Enrollments | ✅ | ✅ | ✅ |
| View All Enrollments | ❌ | ✅ | ✅ |
| Approve Enrollment | ❌ | ✅ | ✅ |
| Reject Enrollment | ❌ | ✅ | ✅ |
| Cancel Enrollment | ✅ | ✅ | ✅ |
| **Progress** |
| View Own Progress | ✅ | ✅ | ✅ |
| View All Progress | ❌ | ✅ | ✅ |
| Track Video Progress | ✅ | ✅ | ✅ |
| Track PDF Progress | ✅ | ✅ | ✅ |
| **Certificate** |
| View Own Certificates | ✅ | ✅ | ✅ |
| Download Certificate | ✅ | ✅ | ✅ |
| View All Certificates | ❌ | ✅ | ✅ |
| **User Management** |
| View Own Profile | ✅ | ✅ | ✅ |
| Edit Own Profile | ✅ | ✅ | ✅ |
| View All Users | ❌ | ✅ | ✅ |
| Create User | ❌ | ❌ | ✅ |
| Edit User | ❌ | ❌ | ✅ |
| Delete User | ❌ | ❌ | ✅ |
| Lock/Unlock Account | ❌ | ✅ | ✅ |
| Assign Roles | ❌ | ❌ | ✅ |
| **Category** |
| View Categories | ✅ | ✅ | ✅ |
| Create Category | ❌ | ✅ | ✅ |
| Edit Category | ❌ | ✅ | ✅ |
| Delete Category | ❌ | ❌ | ✅ |
| **Permission** |
| View Permissions | ❌ | ❌ | ✅ |
| Manage Permissions | ❌ | ❌ | ✅ |
| Assign Permissions to Role | ❌ | ❌ | ✅ |
| **Reports** |
| View Own Reports | ✅ | ✅ | ✅ |
| View All Reports | ❌ | ✅ | ✅ |
| Export Reports | ❌ | ✅ | ✅ |
| **Analytics** |
| View Own Analytics | ✅ | ✅ | ✅ |
| View All Analytics | ❌ | ✅ | ✅ |
| View Dashboard | ✅ | ✅ | ✅ |
| **Notifications** |
| View Own Notifications | ✅ | ✅ | ✅ |
| Mark as Read | ✅ | ✅ | ✅ |
| Delete Notification | ✅ | ✅ | ✅ |
| **Auto-Enrollment** |
| View Rules | ❌ | ✅ | ✅ |
| Create Rule | ❌ | ✅ | ✅ |
| Edit Rule | ❌ | ✅ | ✅ |
| Delete Rule | ❌ | ❌ | ✅ |
| **Department Config** |
| View Config | ❌ | ✅ | ✅ |
| Create Config | ❌ | ❌ | ✅ |
| Edit Config | ❌ | ❌ | ✅ |
| Delete Config | ❌ | ❌ | ✅ |

---

## 13. Effort & Timeline

### 13.1 Effort Estimation

| No | Task | Effort (Mandays) | Resources |
|----|------|------------------|-----------|
| 1 | Requirement Gathering | 3 | BA, PM |
| 2 | Analysis & Design | 5 | SA, BA |
| 3 | Database Design | 3 | DB Designer |
| 4 | Backend Development | 20 | 2 Backend Devs |
| 5 | Frontend Development | 25 | 2 Frontend Devs |
| 6 | Integration (SSO, Email) | 5 | Backend Dev |
| 7 | Testing (Unit, Integration) | 10 | QA Team |
| 8 | User Acceptance Testing (UAT) | 10 | Users, QA |
| 9 | Documentation | 5 | Tech Writer |
| 10 | Deployment & Configuration | 3 | DevOps |
| 11 | Training | 3 | Trainer |
| 12 | Monitoring & Bug Fixing | 5 | Dev Team |
| **Total Effort** | **97 Mandays** | |

### 13.2 Project Timeline

| No | Phase | Task | Plan Start | Plan End | Duration (Days) |
|----|-------|------|------------|----------|-----------------|
| **1** | **Initiation** | | | | **3** |
| 1.1 | | Requirement Gathering | 01 Jun 2026 | 03 Jun 2026 | 3 |
| **2** | **Planning** | | | | **8** |
| 2.1 | | Analysis & Design | 04 Jun 2026 | 10 Jun 2026 | 5 |
| 2.2 | | Database Design | 11 Jun 2026 | 13 Jun 2026 | 3 |
| **3** | **Development** | | | | **30** |
| 3.1 | | Backend Development | 16 Jun 2026 | 11 Jul 2026 | 20 |
| 3.2 | | Frontend Development | 16 Jun 2026 | 18 Jul 2026 | 25 |
| 3.3 | | Integration | 21 Jul 2026 | 25 Jul 2026 | 5 |
| **4** | **Testing** | | | | **20** |
| 4.1 | | Unit & Integration Testing | 28 Jul 2026 | 08 Aug 2026 | 10 |
| 4.2 | | User Acceptance Testing | 11 Aug 2026 | 24 Aug 2026 | 10 |
| **5** | **Deployment** | | | | **11** |
| 5.1 | | Documentation | 25 Aug 2026 | 31 Aug 2026 | 5 |
| 5.2 | | Deployment & Configuration | 01 Sep 2026 | 03 Sep 2026 | 3 |
| 5.3 | | Training | 04 Sep 2026 | 08 Sep 2026 | 3 |
| **6** | **Go Live** | | | | **1** |
| 6.1 | | Go Live | 09 Sep 2026 | 09 Sep 2026 | 1 |
| **7** | **Post Go Live** | | | | **5** |
| 7.1 | | Monitoring & Bug Fixing | 10 Sep 2026 | 16 Sep 2026 | 5 |
| | | **Total Project Duration** | | | **~3.5 Bulan** |

### 13.3 Milestones

| Milestone | Target Date | Deliverables |
|-----------|-------------|--------------|
| **M1: Requirements Approved** | 03 Jun 2026 | FSD Document, BRD Document |
| **M2: Design Completed** | 13 Jun 2026 | ERD, Class Diagram, Flowchart, UI Mockups |
| **M3: Development Completed** | 25 Jul 2026 | Working Application (All Features) |
| **M4: Testing Completed** | 24 Aug 2026 | Test Report, Bug List (Resolved) |
| **M5: UAT Approved** | 24 Aug 2026 | UAT Sign-off Document |
| **M6: Deployment Completed** | 03 Sep 2026 | Production Environment Ready |
| **M7: Training Completed** | 08 Sep 2026 | Training Materials, User Guide |
| **M8: Go Live** | 09 Sep 2026 | System Live in Production |
| **M9: Project Closure** | 16 Sep 2026 | Project Closure Document |

---

## 14. Limitation, Risk, & Constraint

### 14.1 Limitation

#### 14.1.1 Technical Limitations

1. **File Size Limit**
   - **Video & PDF: Max 20MB per file** (configurable via MAX_FILE_SIZE environment variable)
   - **Default: 10MB** jika MAX_FILE_SIZE tidak di-set di environment
   - **Reason:** Server storage capacity, upload timeout, bandwidth limitation, dan memory constraints
   - **Impact:** Large files harus di-compress atau split sebelum upload
   - **Mitigation:** 
     - Compress video dengan H.264 codec (recommended bitrate: 1-2 Mbps)
     - Optimize PDF dengan compression tools (remove images, reduce quality)
     - Increase MAX_FILE_SIZE di .env jika diperlukan (max recommended: 100MB)
     - Split large content menjadi multiple modules

2. **Concurrent Users**
   - **Estimated: 100-200 concurrent users** (based on current AWS tier dan database connection pool)
   - **Database Connection Pool: 10 connections** (configurable via DATABASE_URL)
   - **Reason:** AWS RDS tier limitation, Next.js server capacity, memory allocation
   - **Impact:** Performance degradation (slow response, timeout) jika > 200 concurrent users
   - **Mitigation:** 
     - Monitor real-time dengan AWS CloudWatch
     - Upgrade AWS RDS tier jika usage consistently high
     - Increase database connection pool limit (max 100 untuk RDS t3.medium)
     - Implement Redis caching untuk reduce database load
     - Add CDN untuk static assets (images, videos)
     - Consider horizontal scaling dengan load balancer

3. **Browser Compatibility**
   - **Support:** Chrome 64+, Firefox 67+, Edge 79+, Safari 12+, Opera 51+
   - **Not support:** Internet Explorer 11, older browser versions
   - **Reason:** Next.js 14 default browser support, modern JavaScript features (ES6+), CSS Grid/Flexbox
   - **Impact:** Users dengan old browsers tidak bisa akses atau experience broken UI
   - **Mitigation:** 
     - Display browser upgrade notice untuk unsupported browsers
     - Add browserslist config di package.json jika perlu enforce versi lebih tinggi
     - Provide browser compatibility guide untuk users
     - Consider polyfills untuk critical features (optional)

4. **Video Format**
   - **Recommended:** MP4 (H.264 codec, AAC audio) - Best browser compatibility
   - **Also support:** WebM (VP8/VP9 codec, Vorbis/Opus audio)
   - **Not recommended:** AVI, MOV, FLV, WMV (limited browser support, may not play)
   - **Reason:** HTML5 `<video>` tag browser support limitations
   - **Impact:** Non-standard format mungkin tidak bisa diplay di browser, error saat upload
   - **Mitigation:** 
     - Convert semua video ke MP4 H.264 sebelum upload
     - Add server-side video format validation (currently only PDF validated)
     - Provide video conversion guide untuk admin (recommended tools: HandBrake, FFmpeg)
     - Set video encoding standards: 720p, 30fps, 1-2 Mbps bitrate

5. **Language**
   - Hanya Bahasa Indonesia
   - **Reason:** Scope limitation, budget constraint, timeline constraint
   - **Impact:** International users atau non-Indonesian speakers tidak bisa gunakan
   - **Future Enhancement:** Bisa tambahkan i18n (internationalization) jika diperlukan
   - **Mitigation:** Provide English version di future release (Phase 2)

#### 14.1.2 Functional Limitations

1. **Offline Mode**
   - Tidak support offline viewing
   - **Reason:** Complexity dan security
   - **Impact:** Users harus online untuk akses

2. **Mobile App**
   - Tidak ada native mobile app
   - Hanya responsive web
   - **Reason:** Budget dan timeline
   - **Impact:** Mobile experience tidak optimal

3. **Live Streaming**
   - Tidak support live video/webinar
   - Hanya pre-recorded video
   - **Reason:** Infrastructure complexity
   - **Impact:** Tidak bisa untuk live training

4. **Social Features**
   - Tidak ada discussion forum, chat
   - **Reason:** Scope limitation
   - **Impact:** Tidak ada peer interaction

### 14.2 Risk

#### 14.2.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Performance degradation saat peak usage** | Medium | High | Load testing, Caching, CDN, Auto-scaling |
| **Microsoft SSO integration failure** | Low | Medium | Fallback ke email/password, Extensive testing |
| **Data loss saat deployment** | Low | Critical | Backup before deployment, Rollback plan |
| **Security breach / Unauthorized access** | Low | Critical | RBAC, Encryption, Security audit, Penetration testing |
| **Video streaming buffering issues** | Medium | Medium | CDN, Video compression, Adaptive bitrate |

#### 14.2.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Low user adoption** | Medium | High | Training, User guide, Support team, Change management |
| **Resistance to change** | Medium | Medium | Stakeholder engagement, Communication plan |
| **Incomplete requirements** | Low | High | Regular review meetings, Prototype validation |
| **Budget overrun** | Low | Medium | Strict scope control, Regular budget monitoring |
| **Timeline delay** | Medium | Medium | Buffer time, Prioritize MVP features, Agile approach |

#### 14.2.3 Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Insufficient training** | Medium | Medium | Comprehensive training program, User guide, Video tutorials |
| **Lack of support resources** | Low | Medium | Dedicated support team, Knowledge base, FAQ |
| **Data migration issues** | Low | High | Data validation, Testing, Rollback plan |
| **Cheating bypass** | Medium | Medium | Multiple detection methods, Manual review, Continuous improvement |

### 14.3 Constraint

#### 14.3.1 Budget Constraint
- **Constraint:** Limited budget untuk infrastructure dan development
- **Impact:** 
  - Pilih AWS tier yang cost-effective
  - Limit concurrent users
  - Prioritize MVP features
- **Mitigation:** 
  - Phased implementation
  - Use open-source libraries
  - Optimize resource usage

#### 14.3.2 Timeline Constraint
- **Constraint:** Target go-live: 3.5 bulan
- **Impact:**
  - Limited time untuk development
  - Compressed testing phase
  - Risk of bugs in production
- **Mitigation:**
  - Agile methodology
  - Prioritize critical features
  - Parallel development tracks
  - Automated testing

#### 14.3.3 Resource Constraint
- **Constraint:** Limited developer resources (2 backend, 2 frontend)
- **Impact:**
  - Cannot develop all features simultaneously
  - Risk of burnout
  - Knowledge silos
- **Mitigation:**
  - Clear task prioritization
  - Code review untuk knowledge sharing
  - Outsource non-critical tasks
  - Pair programming

#### 14.3.4 Technical Constraint
- **Constraint:** Must use existing tech stack (Next.js, PostgreSQL, AWS)
- **Impact:**
  - No flexibility untuk tech choice
  - Must work within framework limitations
- **Mitigation:**
  - Leverage framework best practices
  - Use proven libraries
  - Consult documentation

#### 14.3.5 Compliance Constraint
- **Constraint:** Must comply dengan data privacy regulations
- **Impact:**
  - Additional security measures required
  - Data encryption overhead
  - Audit trail requirements
- **Mitigation:**
  - Security by design
  - Regular security audits
  - Compliance checklist

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **LMS** | Learning Management System - Platform untuk mengelola pembelajaran |
| **RBAC** | Role-Based Access Control - Kontrol akses berdasarkan role |
| **SSO** | Single Sign-On - Login sekali untuk akses multiple systems |
| **PRE-TEST** | Test yang dikerjakan sebelum mengikuti kursus |
| **POST-TEST** | Test yang dikerjakan setelah menyelesaikan semua modul |
| **Enrollment** | Pendaftaran kursus oleh karyawan |
| **Completion Rate** | Persentase modul yang diselesaikan dari total modul |
| **Passing Score** | Nilai minimum untuk lulus test |
| **Grace Period** | Waktu tambahan setelah deadline |
| **Escalation** | Pelaporan ke atasan (department head) |
| **Cheating Detection** | Sistem monitoring untuk mendeteksi kecurangan saat test |
| **Force Submit** | Submit otomatis saat cheating terdeteksi |
| **Auto-Enrollment** | Pendaftaran otomatis berdasarkan department |
| **Cron Job** | Scheduled task yang berjalan otomatis |
| **ORM** | Object-Relational Mapping - Prisma |
| **CDN** | Content Delivery Network |
| **RTO** | Recovery Time Objective |
| **RPO** | Recovery Point Objective |

### B. Reference Documents

1. **docs/01_ERD_SISTEM.md** - Entity Relationship Diagram
2. **docs/02_CLASS_DIAGRAM_SISTEM.md** - Class Diagram
3. **docs/03_FLOWCHART_SISTEM.md** - Flowchart
4. **prisma/schema.prisma** - Database Schema
5. **docs/00_PANDUAN_DOKUMENTASI.md** - Documentation Guide
6. **docs/FSD_ELEARNING_BNIF.md** - FSD Part 1
7. **docs/FSD_ELEARNING_BNIF2.md** - FSD Part 2

### C. Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | Next.js | 14.x |
| | React | 18.x |
| | TypeScript | 5.x |
| | Tailwind CSS | 3.x |
| | Shadcn/UI | Latest |
| **Backend** | Next.js API Routes | 14.x |
| | Server Actions | Next.js 14 |
| **Database** | PostgreSQL | 15.x |
| **ORM** | Prisma | 5.x |
| **Authentication** | NextAuth.js | 4.x |
| **File Storage** | Local / SharePoint | - |
| **Email** | Nodemailer | Latest |
| **Deployment** | Docker | Latest |
| | AWS RDS | PostgreSQL 15 |
| | AWS S3 | - |
| | AWS ECS | - |
| **Monitoring** | AWS CloudWatch | - |
| **CI/CD** | GitHub Actions | - |

### D. Contact Information

| Role | Name | Email | Phone |
|------|------|-------|-------|
| **Project Manager** | - | - | - |
| **Business Analyst** | - | - | - |
| **System Analyst** | - | - | - |
| **Tech Lead** | - | - | - |
| **QA Lead** | - | - | - |
| **DevOps Engineer** | - | - | - |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Prepared by** | IT Development Team | | 11 Mei 2026 |
| **Reviewed by** | IT Manager | | |
| **Approved by** | Department Head IT | | |
| **Approved by** | Department Head HC | | |

---

**Document End**

**Document ID:** BNIF/IT/FSD/ELEARNING/V.01  
**Version:** 1.0  
**Status:** Final  
**Date:** 11 Mei 2026  

**© 2026 BNI Finance - E-Learning Management System**

---

**BNIF/IT Development/Functional Specification Document V.01**

---

## Summary Dokumen FSD

### File Structure:
1. **FSD_ELEARNING_BNIF.md** - Sections 1-3.2
   - Latar Belakang
   - Ruang Lingkup
   - Alur Proses Bisnis (Login & Enrollment Flow)

2. **FSD_ELEARNING_BNIF2.md** - Sections 3.3-8
   - Learning Flow
   - Kebutuhan Fungsional
   - Struktur Database & Tabel
   - Integrasi Sistem
   - Job Scheduler
   - Notifikasi & Reminder

3. **FSD_ELEARNING_PART3_FINAL.md** - Sections 9-14 + Appendix
   - Service Level Agreement (SLA)
   - Mock-up & User Interface (UI)
   - Report
   - User Access Matrix
   - Effort & Timeline
   - Limitation, Risk, & Constraint
   - Appendix

### Total Coverage:
✅ 14 Sections Lengkap
✅ Sesuai Format Contoh FSD Forgot Password
✅ Komprehensif & Detail
✅ Siap untuk Review & Approval

---

**END OF DOCUMENT**
