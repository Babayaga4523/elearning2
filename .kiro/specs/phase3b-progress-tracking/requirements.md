# Requirements: Phase 3B - Progress Tracking

**Feature Name:** phase3b-progress-tracking  
**Created:** 28 April 2026  
**Status:** Draft  
**Priority:** High

---

## 1. OVERVIEW

### 1.1 Feature Description
Implementasi sistem tracking progress untuk konten video dan PDF, memungkinkan karyawan untuk:
- Melanjutkan video dari posisi terakhir yang ditonton
- Melanjutkan membaca PDF dari halaman terakhir
- Melihat progress completion secara real-time
- Admin dapat melihat analytics progress karyawan

### 1.2 Business Goals
- **Meningkatkan completion rate** - Karyawan dapat melanjutkan dari posisi terakhir
- **Meningkatkan engagement** - Progress tracking memotivasi untuk menyelesaikan
- **Data analytics** - Admin dapat monitor progress dan identifikasi bottleneck
- **Better UX** - Tidak perlu mencari posisi terakhir secara manual

### 1.3 Success Metrics
- Video completion rate meningkat 30%
- PDF completion rate meningkat 25%
- Time to complete course berkurang 20%
- User satisfaction score meningkat

---

## 2. USER STORIES

### 2.1 Video Progress Tracking

#### US-1: Save Video Progress Automatically
**As a** karyawan  
**I want** video progress saya tersimpan otomatis setiap 5 detik  
**So that** saya tidak kehilangan progress jika browser tertutup

**Acceptance Criteria:**
- Progress tersimpan setiap 5 detik saat video diputar
- Progress tersimpan saat video di-pause
- Progress tersimpan saat user meninggalkan halaman
- Tidak ada lag atau freeze saat menyimpan progress

#### US-2: Resume Video from Last Position
**As a** karyawan  
**I want** video otomatis dimulai dari posisi terakhir yang saya tonton  
**So that** saya tidak perlu mencari posisi terakhir secara manual

**Acceptance Criteria:**
- Video dimulai dari posisi terakhir (dengan toleransi ±2 detik)
- Jika video sudah selesai (>95%), mulai dari awal
- Tampilkan notifikasi "Melanjutkan dari menit XX:XX"
- User dapat memilih untuk mulai dari awal

#### US-3: Video Completion Tracking
**As a** karyawan  
**I want** progress bar menunjukkan berapa persen video yang sudah saya tonton  
**So that** saya tahu berapa lagi yang harus ditonton

**Acceptance Criteria:**
- Progress bar menunjukkan persentase akurat (0-100%)
- Video dianggap selesai jika sudah ditonton >95%
- Status "Completed" muncul jika video selesai
- Progress tersinkronisasi dengan module completion

### 2.2 PDF Progress Tracking

#### US-4: Save PDF Reading Progress
**As a** karyawan  
**I want** halaman PDF yang sedang saya baca tersimpan otomatis  
**So that** saya dapat melanjutkan dari halaman terakhir

**Acceptance Criteria:**
- Current page tersimpan setiap 3 detik
- Scroll position tersimpan untuk setiap halaman
- Progress tersimpan saat user meninggalkan halaman
- Tidak mengganggu performa scrolling

#### US-5: Resume PDF from Last Page
**As a** karyawan  
**I want** PDF otomatis terbuka di halaman terakhir yang saya baca  
**So that** saya tidak perlu scroll mencari halaman terakhir

**Acceptance Criteria:**
- PDF terbuka di halaman terakhir yang dibaca
- Scroll position di-restore dengan akurat
- Tampilkan notifikasi "Melanjutkan dari halaman X"
- User dapat jump ke halaman lain jika mau

#### US-6: PDF Completion Tracking
**As a** karyawan  
**I want** melihat berapa persen PDF yang sudah saya baca  
**So that** saya tahu progress saya

**Acceptance Criteria:**
- Progress bar menunjukkan persentase halaman yang sudah dibaca
- PDF dianggap selesai jika >90% halaman sudah dibuka
- Status "Completed" muncul jika PDF selesai
- Progress tersinkronisasi dengan module completion

### 2.3 Admin Analytics

#### US-7: View Video Analytics
**As an** admin  
**I want** melihat analytics video watch time per karyawan  
**So that** saya dapat monitor engagement

**Acceptance Criteria:**
- Dashboard menampilkan average watch time per video
- Tampilkan completion rate per video
- Tampilkan list karyawan yang belum menonton
- Filter by course, department, date range

#### US-8: View PDF Analytics
**As an** admin  
**I want** melihat analytics PDF reading progress per karyawan  
**So that** saya dapat monitor engagement

**Acceptance Criteria:**
- Dashboard menampilkan average pages read per PDF
- Tampilkan completion rate per PDF
- Tampilkan list karyawan yang belum membaca
- Filter by course, department, date range

#### US-9: Identify Struggling Users
**As an** admin  
**I want** melihat karyawan yang stuck di module tertentu  
**So that** saya dapat memberikan bantuan

**Acceptance Criteria:**
- Tampilkan list karyawan dengan progress <50% setelah 7 hari
- Tampilkan average time spent per module
- Highlight module dengan completion rate rendah (<60%)
- Export data untuk follow-up

---

## 3. FUNCTIONAL REQUIREMENTS

### 3.1 Video Progress Tracking

#### FR-1: Auto-save Video Progress
- System MUST save video progress every 5 seconds during playback
- System MUST save progress when video is paused
- System MUST save progress when user navigates away
- System MUST handle network failures gracefully (retry 3x)

#### FR-2: Video Progress Data
- System MUST store: userId, moduleId, currentTime, duration, lastWatched
- System MUST calculate completion percentage: (currentTime / duration) * 100
- System MUST mark as completed when progress >= 95%
- System MUST update module completion status when video completed

#### FR-3: Resume Video Playback
- System MUST load last saved progress on video load
- System MUST start video from saved position (±2 seconds tolerance)
- System MUST show "Resume from XX:XX" notification
- System MUST provide "Start from beginning" option

### 3.2 PDF Progress Tracking

#### FR-4: Auto-save PDF Progress
- System MUST save current page every 3 seconds
- System MUST save scroll position for current page
- System MUST track which pages have been viewed
- System MUST save total time spent reading

#### FR-5: PDF Progress Data
- System MUST store: userId, moduleId, currentPage, totalPages, scrollPosition, pagesViewed[], timeSpent
- System MUST calculate completion percentage: (pagesViewed.length / totalPages) * 100
- System MUST mark as completed when progress >= 90%
- System MUST update module completion status when PDF completed

#### FR-6: Resume PDF Reading
- System MUST load last saved page on PDF open
- System MUST restore scroll position for that page
- System MUST show "Resume from page X" notification
- System MUST allow jumping to any page

### 3.3 Analytics Dashboard

#### FR-7: Video Analytics
- System MUST display average watch time per video
- System MUST display completion rate per video
- System MUST display list of users who haven't watched
- System MUST support filtering by course, department, date range

#### FR-8: PDF Analytics
- System MUST display average pages read per PDF
- System MUST display completion rate per PDF
- System MUST display list of users who haven't read
- System MUST support filtering by course, department, date range

#### FR-9: Progress Reports
- System MUST identify users with <50% progress after 7 days
- System MUST calculate average time spent per module
- System MUST highlight modules with <60% completion rate
- System MUST allow exporting data to Excel

---

## 4. NON-FUNCTIONAL REQUIREMENTS

### 4.1 Performance
- **NFR-1:** Progress save operation MUST complete within 500ms
- **NFR-2:** Video resume MUST load within 1 second
- **NFR-3:** PDF page restore MUST complete within 800ms
- **NFR-4:** Analytics dashboard MUST load within 2 seconds
- **NFR-5:** System MUST handle 100 concurrent progress saves

### 4.2 Reliability
- **NFR-6:** Progress save MUST have 99.9% success rate
- **NFR-7:** System MUST retry failed saves 3 times with exponential backoff
- **NFR-8:** System MUST queue progress saves if offline (IndexedDB)
- **NFR-9:** System MUST sync queued saves when online

### 4.3 Usability
- **NFR-10:** Progress indicators MUST be visible and intuitive
- **NFR-11:** Resume notifications MUST be non-intrusive
- **NFR-12:** Analytics dashboard MUST be responsive (mobile-friendly)
- **NFR-13:** All text MUST be in Bahasa Indonesia

### 4.4 Security
- **NFR-14:** Progress data MUST be user-specific (no cross-user access)
- **NFR-15:** API endpoints MUST require authentication
- **NFR-16:** Admin analytics MUST require ADMIN role
- **NFR-17:** Progress data MUST be encrypted in transit (HTTPS)

### 4.5 Scalability
- **NFR-18:** System MUST support 1000+ concurrent users
- **NFR-19:** Database MUST handle 10,000+ progress records per day
- **NFR-20:** Analytics queries MUST be optimized with proper indexing

---

## 5. TECHNICAL CONSTRAINTS

### 5.1 Technology Stack
- **Frontend:** React, Next.js 14, TypeScript
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL (existing)
- **Video Player:** HTML5 Video API or React Player
- **PDF Viewer:** react-pdf or PDF.js

### 5.2 Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 5.3 Integration Points
- **Module System:** Must integrate with existing Module model
- **Enrollment System:** Must update enrollment progress
- **Analytics System:** Must feed data to existing analytics
- **Notification System:** Optional notifications for milestones

---

## 6. ASSUMPTIONS & DEPENDENCIES

### 6.1 Assumptions
- Users have stable internet connection (for auto-save)
- Video files are hosted and accessible
- PDF files are already uploaded to system
- Module completion logic exists and can be updated

### 6.2 Dependencies
- **Database Migration:** New tables for VideoProgress and PDFProgress
- **Module Model Update:** Add progress tracking fields
- **Video Player Component:** May need to create or update
- **PDF Viewer Component:** May need to create or update

---

## 7. OUT OF SCOPE

The following are explicitly OUT OF SCOPE for Phase 3B:

- ❌ Offline video/PDF download
- ❌ Video quality selection
- ❌ PDF annotation/highlighting
- ❌ Social features (comments, likes)
- ❌ Gamification (badges, points)
- ❌ Mobile app implementation
- ❌ Video transcription/subtitles
- ❌ PDF text search

---

## 8. RISKS & MITIGATION

### 8.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| High frequency saves cause performance issues | High | Medium | Implement debouncing, batch saves |
| Network failures lose progress | High | Medium | Implement retry logic, offline queue |
| Large PDF files slow down page restore | Medium | High | Lazy load pages, optimize scroll restore |
| Video player compatibility issues | Medium | Low | Use well-tested library (React Player) |

### 8.2 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Users don't want auto-resume | Low | Low | Provide "Start from beginning" option |
| Progress tracking feels intrusive | Medium | Low | Make it subtle, non-intrusive |
| Analytics reveal poor content quality | High | Medium | Use data to improve content |

---

## 9. ACCEPTANCE CRITERIA SUMMARY

### Phase 3B is considered COMPLETE when:

✅ **Video Tracking:**
- [ ] Video progress saves automatically every 5 seconds
- [ ] Video resumes from last position on reload
- [ ] Progress bar shows accurate percentage
- [ ] Completion status updates correctly

✅ **PDF Tracking:**
- [ ] PDF page and scroll position save automatically
- [ ] PDF opens at last read page
- [ ] Progress bar shows accurate percentage
- [ ] Completion status updates correctly

✅ **Analytics:**
- [ ] Admin can view video watch time analytics
- [ ] Admin can view PDF reading analytics
- [ ] Dashboard shows completion rates
- [ ] Can identify struggling users

✅ **Performance:**
- [ ] All operations complete within specified time limits
- [ ] No lag or freeze during normal usage
- [ ] System handles 100+ concurrent users

✅ **Testing:**
- [ ] Unit tests for all progress tracking functions
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user flows
- [ ] Performance tests pass

---

## 10. NEXT STEPS

After requirements approval:
1. Create design document (database schema, API endpoints, components)
2. Create database migration
3. Implement backend APIs
4. Implement frontend components
5. Integration testing
6. User acceptance testing
7. Production deployment

---

**Document Status:** Draft  
**Requires Approval From:** Product Owner, Tech Lead  
**Estimated Implementation Time:** 12-16 hours  
**Target Completion:** 30 April 2026
