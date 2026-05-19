# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

E-Learning Management System (LMS) untuk **BNI Finance** — full-stack Next.js 14 (App Router) dengan:

- **Multi-role users**: KARYAWAN (employee), ADMIN, SUPER_ADMIN
- **Course structure**: Pre-test → Modules (Video/PDF) → Post-test, dengan enrollment & deadline management
- **Auth**: Microsoft Entra ID (Azure AD) SSO + manual credential login
- **Auto-enrollment**: Department-based rule engine, cron-scheduled
- **Progress tracking**: Video (≥95%) dan PDF (≥90%) completion, real-time sync
- **RBAC**: Permission-based access control stored in DB, injected into JWT
- **Rate limiting**: PostgreSQL-backed brute-force protection
- **Scheduler**: Auto-enrollment, H-7/3/1 reminders, deadline monitoring, email reports
- **Reporting**: Per-course reports, analytics dashboard, Excel export

**Tech Stack**: Next.js 14, Prisma + PostgreSQL, NextAuth v5 (beta, JWT strategy), Tailwind CSS, Radix UI, Recharts, FullCalendar, ExcelJS, Nodemailer.

**Prisma client output**: `src/generated/client` (custom path, not default `node_modules`)

---

## Commands

```bash
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build (SKIP_ENV_VALIDATION=true)
npm run build:prod   # Full production build
npm run start        # Start production server
npm run lint         # ESLint

# Prisma
npx prisma migrate dev    # Run migrations in dev (interactive)
npx prisma db push        # Push schema without migration (fast, dev only)
npm run postinstall       # Auto-runs prisma generate after npm install

# Database
npm run deploy:migrate    # prisma migrate deploy + seed permissions (CI/prod)
npm run seed:permissions  # Seed RBAC permissions only
npm run seed:ipa          # Seed legacy IPA users
npm run seed:ips          # Seed IPS course data
npm run backup:db         # Backup PostgreSQL (scripts/backup-database.sh)
npm run restore:db        # Restore from backup (scripts/restore-database.sh)

# Cache
npm run cache:clear       # Clear in-memory cache
npm run cache:stats       # Show cache hit/miss statistics

# Multi-role migration
npm run migrate:multi-role    # Migrate users to new multi-role system
npm run update:karyawan       # Update all KARYAWAN users to multi-role
npm run check:roles           # Audit user role assignments
```

---

## Architecture

### Directory Structure

```
src/
├── app/
│   ├── (admin)/                    # Route group: admin layout
│   │   ├── dashboard/
│   │   ├── courses/                # Course CRUD, module editor, test builder
│   │   │   ├── [courseId]/         # Course detail, setup wizard
│   │   │   │   ├── tests/          # Test builder (PRE/POST test)
│   │   │   │   └── report/        # Per-course analytics & export
│   │   │   ├── create/
│   │   │   └── _components/        # CourseSetupClient, PublishButton
│   │   ├── enrollments/             # Enrollment management, scheduler
│   │   ├── users/                  # User management, test attempt review
│   │   │   └── [userId]/          # User detail + course progress modal
│   │   ├── import/                 # Excel import (questions, users, enrollments)
│   │   ├── analytics/              # Global analytics dashboard
│   │   │   └── progress/          # Video/PDF completion analytics
│   │   ├── calendar/              # FullCalendar scheduler view
│   │   ├── scheduler/             # Scheduler logs & monitoring
│   │   ├── logs/                  # System logs viewer
│   │   ├── locked-accounts/       # Account lockout management
│   │   ├── roles/                 # RBAC role & permission management
│   │   ├── categories/           # Course category management
│   │   ├── settings/             # System settings
│   │   ├── notifications/        # Admin notifications
│   │   └── profile/
│   │
│   ├── (karyawan)/                 # Route group: employee layout
│   │   ├── dashboard/            # KPI cards, activity chart, leaderboard
│   │   │   └── _components/     # KPIGrid, UrgentAlerts, PerformanceAnalysis
│   │   ├── courses/             # Course catalog + course detail
│   │   │   ├── [courseId]/      # Course detail (modules list, enroll)
│   │   │   │   ├── modules/[moduleId]/  # Module viewer (video/pdf)
│   │   │   │   └── tests/[testId]/     # Test taking UI + result
│   │   ├── performance/         # Transcript, growth charts, Excel export
│   │   ├── calendar/            # Personal learning calendar
│   │   ├── notifications/
│   │   └── profile/
│   │
│   ├── auth/login/              # Login page (handles both providers)
│   ├── page.tsx                 # Root redirect → /dashboard or /admin
│   │
│   └── api/
│       ├── auth/[...nextauth]/  # NextAuth handler
│       ├── cron/                # Cron job endpoints (CRON_SECRET protected)
│       │   ├── auto-enrollment/  # Daily auto-enroll by department
│       │   ├── reminders/        # H-7/3/1 email reminders (1:00 UTC = 8 AM WIB)
│       │   ├── send-reports/     # Monthly department head reports
│       │   ├── monthly-reports/  # Alternative report runner
│       │   ├── scheduler-alerts/ # Failed email retry + alerts (hourly)
│       │   ├── retry-failed-emails/
│       │   ├── deadline-monitoring/ # Mark expired enrollments FAILED
│       │   └── purge-login-attempts/ # Clean old LoginAttempt records
│       ├── progress/
│       │   ├── video/save/       # Video progress save (POST)
│       │   └── pdf/save/         # PDF progress save (POST)
│       ├── admin/
│       │   ├── locked-accounts/  # count, unlock-account
│       │   ├── import/           # users, questions, enrollments, templates
│       │   ├── role-permissions/ # RBAC CRUD
│       │   ├── scheduler/        # trigger, retry-queue, stats
│       │   ├── analytics/        # struggling-users, video, pdf
│       │   └── reports/          # course reports, download
│       ├── analytics/export/     # Excel/PDF export
│       ├── categories/           # Category CRUD
│       ├── notifications/        # unread-count
│       ├── user/me/             # Current user data
│       └── tests/                # Test submission, start, violation
│
├── actions/                     # Server Actions (React Server Components)
│   ├── course.ts                # Course/Module/Test CRUD (requireAdmin)
│   ├── enrollment.ts            # Enrollment management
│   ├── module.ts                # Module completion, auto-complete enrollment
│   ├── test.ts                  # Test submission, retake, attempt review
│   ├── user-progress.ts         # Progress toggle
│   ├── performance.ts           # Transcript data aggregation
│   ├── login.ts                 # Credential login with rate limit
│   └── notifications.ts         # Mark read/unread
│
├── lib/                        # Shared server utilities
│   ├── auth.ts                  # NextAuth instance (JWT strategy, PrismaAdapter)
│   ├── auth.config.ts           # Lightweight Edge-compatible config (middleware only)
│   ├── auth-helpers.ts          # requireAdmin(), isAdmin(), hasRole(), getActiveRole()
│   ├── db.ts                    # Prisma singleton (avoids connection exhaustion)
│   ├── permissions.ts           # PERMISSIONS constants, ROUTE_PERMISSION_MAP (Edge-safe)
│   ├── permissions.server.ts    # getPermissionsForRole() — DB access, NOT Edge-safe
│   ├── rate-limiter.ts          # PostgreSQL rate limiting (5/email, 20/IP, 15-min window)
│   ├── scheduler.ts             # Auto-enrollment engine, reminder scheduler
│   ├── enrollment.ts            # createEnrollment(), batchCreateEnrollments()
│   ├── enrollment-access.ts     # checkEnrollmentAccess(), grace period logic
│   ├── notifications.ts         # notifyCourseEnrollment() with deduplication
│   ├── notifications/enrollment.ts  # sendEnrollmentNotification() email
│   ├── email.ts                 # Nodemailer wrapper (TLS on port 587)
│   ├── excel-template.ts        # Excel workbook factory (BNI brand styles)
│   ├── excel-import.ts          # Excel parsing for questions/users/enrollments import
│   ├── cache.ts                 # In-memory TTL cache (LRU, stats API)
│   ├── logger.ts                # Winston logger (file + console transport)
│   ├── sharepoint.ts            # SharePoint embed URL builder
│   ├── analytics.ts            # Analytics query helpers
│   ├── course-integrity.ts      # Course completeness validator
│   ├── env.ts                   # Environment validation (zod)
│   ├── scheduler-alerts.ts      # Scheduler failure alert logic
│   ├── rate-limit.ts            # API route rate limiting (100 req/min for progress APIs)
│   ├── file-validation.ts       # Video/PDF file validation
│   ├── services/
│   │   ├── video-progress.service.ts   # Video completion (≥95%)
│   │   └── pdf-progress.service.ts     # PDF completion (≥90%)
│   └── utils/
│       ├── date-formatter.ts    # Asia/Jakarta timezone date formatting
│       ├── file.utils.ts        # File size formatting
│       └── file-constants.ts    # Allowed file types, max sizes
│
├── components/
│   ├── admin/                   # Admin-specific components
│   │   ├── NewAdminLayout, NewSidebar, Pagination, ConfirmDialog
│   │   ├── questions-form.tsx, test-title-form.tsx
│   │   ├── AdminErrorBoundary, admin-layout-shell
│   │   └── FullCalendarWrapper, AdminCalendarClient
│   ├── karyawan/                # Karyawan-specific components
│   │   ├── KaryawanLayout, Navbar, RoleSelectionModal
│   ├── courses/                 # Shared course components
│   │   ├── EnrollButton, TestClient, TestRulesModal
│   │   ├── module-completion-button.tsx
│   ├── notifications/           # NotificationBell, NotificationsView
│   ├── analytics/                # Charts, export buttons, metric cards
│   ├── media/                    # SmartVideoPlayer, PDFViewer, SharePointPlayer
│   ├── auth/                     # LogoutButton, RoleSelectionModal
│   └── ui/                       # Radix-based primitives (button, dialog, etc.)
│
├── middleware.ts                # NextAuth middleware (Edge Runtime)
├── next-auth.d.ts               # Session type augmentation
├── routes.ts                    # publicRoutes, authRoutes, apiAuthPrefix
└── types/
    ├── module.types.ts          # Module-related types
    └── file-saver.d.ts          # FileSaver type declarations
```

---

## Authentication System

### NextAuth v5 (beta) — JWT Strategy

**Session strategy is JWT** (not database sessions). All user data is fetched fresh from Prisma at JWT creation/update on every request. `PrismaAdapter` is attached for OAuth account linking, not session storage.

`src/auth.ts` exports: `{ auth, signIn, signOut, handlers: { GET, POST } }`

`src/auth.config.ts` — lightweight config **without DB imports** (Edge Runtime safe), used by middleware.

### Providers

| Provider | Config | Notes |
|---|---|---|
| **Credentials** | email + bcrypt password | Rate-limited (see Rate Limiting) |
| **MicrosoftEntraID** | `AUTH_MICROSOFT_ENTRA_ID_*` env vars | JIT user provisioning, domain-restricted to `ALLOWED_DOMAIN` |

### JWT Callbacks (src/auth.ts)

```typescript
// jwt() — runs on every token creation/refresh
token.sub         // user.id
token.role        // Legacy single role (UserRole enum)
token.roles       // New multi-role array (UserRole[])
token.activeRole  // Currently selected role (UserRole?)
token.permissions // RBAC permissions array (fetched from DB for activeRole)
token.nip         // Employee number
token.lockedAt    // Admin lockout timestamp (Date | null)

// session() — injects into session.user
session.user.id, .role, .roles, .activeRole, .permissions, .nip, .lockedAt
```

### Multi-Role System

Users have `roles: UserRole[]` (e.g., `["ADMIN", "KARYAWAN"]`) and `activeRole: UserRole?` (which role is currently active).

Role switching: **`/api/auth/set-role`** → POST with `{ activeRole }` → triggers `session.update()` → new JWT with refreshed permissions.

**RoleSelectionModal** shown after login when `user.roles.length > 1`.

### RBAC Permissions

Permissions stored in DB (`Permission`, `RolePermission` tables), fetched via `getPermissionsForRole()` in `src/lib/permissions.server.ts`, injected into JWT.

**Permission keys** (`src/lib/permissions.ts`):

| Key | Label | Default for ADMIN |
|---|---|---|
| `manage_courses` | Kelola Kursus | ✓ |
| `view_course_reports` | Laporan Kursus | ✓ |
| `manage_users` | Kelola User | |
| `manage_roles` | Kelola Role & Permission | |
| `view_all_reports` | Semua Laporan | |
| `manage_settings` | Pengaturan Sistem | |

**SUPER_ADMIN**: All permissions hardcoded (no DB lookup needed).

**Route → Permission mapping**: `ROUTE_PERMISSION_MAP` in `src/lib/permissions.ts`, enforced at Edge via `src/middleware.ts`.

### Rate Limiting (PostgreSQL-backed)

```typescript
EMAIL_MAX_ATTEMPTS = 5   // per email, 15 minutes → per-account lockout
IP_MAX_ATTEMPTS    = 20  // per IP, 15 minutes → password-spray detection
```

Blocked users → redirect to `/auth/login?error=Locked`. Lockout clears automatically when window expires.

### Locked Accounts (Admin-level)

Admins can manually lock accounts via `/admin/locked-accounts`. Set `lockedAt` timestamp on User. Middleware intercepts locked users and redirects to signout.

---

## Database Schema

### Prisma Notes
- Output path: `src/generated/client` (custom)
- `postinstall` runs `prisma generate` automatically
- Use `connection_limit=10&pool_timeout=20` in `DATABASE_URL` for production

### Enums

```prisma
UserRole            { ADMIN | KARYAWAN | SUPER_ADMIN }
AuthMethod          { MICROSOFT | MANUAL }
ModuleType          { VIDEO | PDF }
TestType            { PRE | POST }
TestAttemptStatus   { ONGOING | SUBMITTED | FORCE_SUBMITTED }
EnrollmentStatus    { IN_PROGRESS | COMPLETED | FAILED | PENDING | REJECTED }
NotificationType    { SYSTEM | ENROLLMENT | COURSE_UPDATE | REMINDER }
```

### Core Models

**User** — `roles[]`, `activeRole`, `lockedAt` (admin lockout), `authMethod`, `lastLoginAt`, `department`, `nip`, `lokasi`

**Course** — `categoryId` **REQUIRED**, optional `deadlineDate` or `deadlineDuration`, `lockAfterDeadline`, `gracePeriodDays`, `isPublished`, `isVisible`

**Module** — `VIDEO` or `PDF`, `position` ordering, `isFree`, `duration` (seconds), `sharepointUrl` / `videoUrl` / `pdfUrl`, SharePoint embedded via `src/lib/sharepoint.ts`

**Test** — `PRE` or `POST`, `maxAttempts` (0 = unlimited), `passingScore` (default 70), `duration` (minutes), `randomizeQuestions`, `randomizeOptions`

**Enrollment** — `userId + courseId` unique, status flows PENDING → IN_PROGRESS → COMPLETED/FAILED, tracks `deadline`, reminder timestamps (`remindedAt7d/3d/1d`), `escalatedAt`, `approvedAt/ById`, `postTestAttempts`

**VideoProgress** — `currentTime`, `duration`, `completionRate`, `completed` (≥95%), `watchCount`, `totalWatchTime`. Unique per `userId + moduleId`.

**PDFProgress** — `currentPage`, `totalPages`, `pagesViewed` (JSON array), `scrollPosition` (JSON), `completionRate`, `completed` (≥90%), `readCount`, `totalReadTime`. Unique per `userId + moduleId`.

**TestAttempt** — linked to `enrollmentId` for post-test tracking, `attemptNumber`, `score`, `passed`, `timeSpent`, `TestAnswer[]`

**TestSession** — `ONGOING` sessions for active tests (orphan cleanup on page close)

**TestAnswer** — `testAttemptId + questionId` unique, `selectedOptionId`, `isCorrect`

**AutoEnrollmentRule** — `department`-based, `isActive`, `bypassDeadline`. Engine in `src/lib/scheduler.ts`.

**DepartmentConfig** — department head email for escalation reports

**Permission / RolePermission** — RBAC storage

**SchedulerLog** — all cron job runs logged: `jobName`, `status`, `message`, `duration`, `failedRecipients` (JSON), `metadata` (JSON)

**LoginAttempt** — rate limit tracking: `email`, `ipAddress`, `createdAt` (TTL: 15 min, purged by cron)

---

## Business Logic Patterns

### Enrollment Flow

```
PENDING → admin approves/rejects
  └→ APPROVED: IN_PROGRESS (accessible)
      └→ all modules completed AND post-test passed → COMPLETED
      └→ deadline passed → FAILED (or accessible during grace period)
```

Enrollment status transitions are managed in `src/actions/enrollment.ts` and `src/actions/module.ts`. Module completion auto-triggers enrollment completion check.

### Test Taking Flow

**PRE-TEST**: Optional entry quiz, score recorded, does NOT affect enrollment status.

**POST-TEST**:
- Must pass (`score >= passingScore`) to unlock enrollment completion
- Admin-configurable `maxAttempts` per test (0 = unlimited)
- After all modules completed AND post-test passed → auto `COMPLETED`
- If all attempts exhausted without passing → `FAILED`
- `TestClient` component in `src/app/(karyawan)/courses/[courseId]/tests/[testId]/_components/TestClient.tsx` handles the full test-taking UI

### Deadline & Access Logic (`src/lib/enrollment-access.ts`)

```
No deadline → always accessible
Within deadline → accessible
Past deadline + grace period available → accessible (penalty warning shown)
Past deadline + no grace OR lockAfterDeadline=true → ACCESS DENIED
```

Grace penalty formula: `(daysLate / graceDays) * 10` points max.

Expired enrollments marked `FAILED` via:
1. **Cron job** (`/api/cron/deadline-monitoring`) — primary
2. **Server action** (`checkAndUpdateExpiredEnrollments`) — on page load as fallback

### Auto-Enrollment Engine (`src/lib/scheduler.ts`)

- Reads `AutoEnrollmentRule` by matching `department`
- Excludes already-enrolled users
- Batch-creates `IN_PROGRESS` enrollments in chunks of 500
- Sends in-app notifications (deduplicated) and email

---

## Cron Jobs

All protected by `CRON_SECRET` Bearer token. Times in UTC (WIB = UTC+7).

| Endpoint | Schedule | Job |
|---|---|---|
| `/api/cron/auto-enrollment` | Daily | Auto-enroll by department rules |
| `/api/cron/reminders` | Daily 01:00 UTC (08:00 WIB) | H-7, H-3, H-1 email reminders |
| `/api/cron/send-reports` | Monthly 1st, 02:00 UTC | Department head reports |
| `/api/cron/monthly-reports` | Monthly | Alternative report runner |
| `/api/cron/scheduler-alerts` | Hourly | Failed email retry + scheduler alerts |
| `/api/cron/retry-failed-emails` | On-demand | Manual retry of failed emails |
| `/api/cron/deadline-monitoring` | Daily | Mark expired enrollments FAILED |
| `/api/cron/purge-login-attempts` | Daily | Clean expired `LoginAttempt` records |

---

## Progress Tracking

### Video (≥95% = complete)

- Client saves progress every `timeupdate` event → `POST /api/progress/video/save`
- Server calculates `completionRate = (currentTime / duration) * 100`
- Module auto-completes when `completionRate >= 95`
- `SmartVideoPlayer` component handles playback + progress sync

### PDF (≥90% = complete)

- Client tracks `pagesViewed` (array of page numbers) + `scrollPosition`
- Save on scroll + page change → `POST /api/progress/pdf/save`
- Module auto-completes when `completionRate >= 90`
- `PDFViewer` component handles PDF rendering + progress tracking

---

## API Route Patterns

### Progress APIs (both authenticated + rate-limited 100 req/min)

```
POST /api/progress/video/save   { moduleId, currentTime, duration }
POST /api/progress/pdf/save     { moduleId, currentPage, totalPages, pagesViewed, scrollPosition }
```

Returns `{ success, data: { completionRate, completed, moduleCompleted } }`

### Admin APIs

```
POST /api/admin/unlock-account            Remove lockedAt from user
GET  /api/admin/locked-accounts/count     Sidebar badge count
POST /api/auth/set-role                   Switch activeRole (updates DB + JWT refresh)
POST /api/auth/check-lockout              Sync client lockout state
GET  /api/admin/scheduler/stats           Scheduler monitoring stats
POST /api/admin/scheduler/trigger         Manually trigger a cron job
POST /api/admin/scheduler/retry-queue      Retry failed emails
```

### Import APIs

```
POST /api/admin/import/users        Excel → create/update users (bcrypt password)
POST /api/admin/import/questions     Excel → batch create questions + options
POST /api/admin/import/enrollments   Excel → batch create enrollments
GET  /api/admin/import/templates/[type]  Download Excel template
```

### Analytics APIs

```
GET /api/admin/analytics/struggling-users   Users below completion threshold
GET /api/admin/analytics/video              Video completion stats
GET /api/admin/analytics/pdf                PDF completion stats
GET /api/analytics/export                    Excel/PDF export for employee transcript
GET /api/admin/reports/courses/[courseId]   Course-specific report data
POST /api/admin/reports/download             Bulk download as ZIP
```

---

## UI Component Patterns

- **Admin layout**: `NewAdminLayout` with collapsible `NewSidebar`, admin navbar, mobile-responsive
- **Karyawan layout**: `KaryawanLayout` + `Navbar` with notification bell, role switcher, user menu
- **Course Wizard**: `CourseSetupClient` for multi-step course creation (details → modules → tests → publish)
- **Test Client**: `TestClient` in karyawan route handles full test-taking lifecycle (start → questions → submit → result)
- **Role Selection Modal**: Shown post-login for multi-role users
- **Toast**: Both `sonner` (structured toasts) and `react-hot-toast` configured in root layout
- **Charts**: Recharts components (`BarChartClient`, `DonutChartClient`) with consistent styling
- **Calendar**: FullCalendar with `AdminCalendarClient` and `KaryawanCalendarClient` variants
- **Excel Export**: `ExportButton` + `ExportTranscriptButton` using `exceljs` + `jspdf-autotable`

---

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://...elearning?connection_limit=10&pool_timeout=20"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# SMTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="noreply@bnifinance.co.id"
SMTP_PASS="..."
ADMIN_EMAIL="admin@bnifinance.co.id"

# Cron
CRON_SECRET="..."          # Bearer token for cron endpoints

# SSO
ALLOWED_DOMAIN="bnif.co.id"
AUTH_MICROSOFT_ENTRA_ID_ID="..."
AUTH_MICROSOFT_ENTRA_ID_SECRET="..."
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID="..."

# Optional
MAX_FILE_SIZE="10485760"    # 10MB default
```

---

## Development Notes

- **Prisma in middleware**: `src/middleware.ts` only imports `src/lib/permissions.ts` (no DB) to stay Edge Runtime compatible. All DB access for RBAC is in `src/lib/permissions.server.ts`, used only in `src/auth.ts`.
- **Timezone**: All date calculations use `Asia/Jakarta` (WIB) via `date-fns-tz` (`toZonedTime`, `fromZak`.
- **No database sessions**: JWT strategy means user data is always fresh from Prisma.
- **Module completion is transactional**: `completeModule` server action auto-completes enrollment in a Prisma transaction when all conditions are met.
- **Enrollment cascade**: `Course` deletion cascades to `Module`, `Test`, `Enrollment`, `TestSession`. `Module` deletion cascades to `UserProgress`, `VideoProgress`, `PDFProgress`.
- **Test cascade**: `Test` deletion cascades to `Question`, `Option`, `TestAttempt`, `TestAnswer`.
- **In-app notification deduplication**: `notifyCourseEnrollment()` uses a hash of `userId + courseId` to prevent duplicate notifications within a time window.
- **Excel import**: All import routes use `exceljs` for parsing, validate headers, and return structured error rows for failed imports.
- **Prisma transactions**: Enrollment batch creation, module completion, and test submission all use Prisma transactions to ensure atomicity.
