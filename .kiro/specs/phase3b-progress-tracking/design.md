# Design Document: Phase 3B - Progress Tracking

**Version:** 1.0  
**Date:** 28 April 2026  
**Status:** Approved for Implementation

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  VideoPlayer Component  │  PDFViewer Component              │
│  - Auto-save progress   │  - Track page & scroll            │
│  - Resume playback      │  - Resume reading                 │
│  - Progress indicator   │  - Progress indicator             │
├─────────────────────────────────────────────────────────────┤
│                   Progress Tracking Hook                     │
│  - useVideoProgress()   │  - usePDFProgress()               │
│  - Debounced saves      │  - Offline queue                  │
│  - Retry logic          │  - Sync on reconnect              │
├─────────────────────────────────────────────────────────────┤
│                     API Layer (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  /api/progress/video    │  /api/progress/pdf                │
│  - POST /save           │  - POST /save                     │
│  - GET /[moduleId]      │  - GET /[moduleId]                │
│  - DELETE /reset        │  - DELETE /reset                  │
├─────────────────────────────────────────────────────────────┤
│                   Service Layer                              │
├─────────────────────────────────────────────────────────────┤
│  VideoProgressService   │  PDFProgressService               │
│  - saveProgress()       │  - saveProgress()                 │
│  - getProgress()        │  - getProgress()                  │
│  - calculateCompletion()│  - calculateCompletion()          │
│  - updateModuleStatus() │  - updateModuleStatus()           │
├─────────────────────────────────────────────────────────────┤
│                   Database Layer (Prisma)                    │
├─────────────────────────────────────────────────────────────┤
│  VideoProgress Table    │  PDFProgress Table                │
│  - userId               │  - userId                         │
│  - moduleId             │  - moduleId                       │
│  - currentTime          │  - currentPage                    │
│  - duration             │  - totalPages                     │
│  - completionRate       │  - pagesViewed                    │
│  - completed            │  - scrollPosition                 │
│  - lastWatched          │  - completionRate                 │
│                         │  - completed                      │
│                         │  - lastRead                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. DATABASE SCHEMA

### 2.1 VideoProgress Model

```prisma
model VideoProgress {
  id              String   @id @default(cuid())
  userId          String
  moduleId        String
  
  // Progress tracking
  currentTime     Float    @default(0)      // Current playback position in seconds
  duration        Float    @default(0)      // Total video duration in seconds
  completionRate  Float    @default(0)      // Percentage (0-100)
  completed       Boolean  @default(false)  // True if completionRate >= 95
  
  // Metadata
  watchCount      Int      @default(0)      // Number of times video was played
  totalWatchTime  Float    @default(0)      // Total time spent watching (seconds)
  lastWatched     DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  module          Module   @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  
  @@unique([userId, moduleId])
  @@index([userId])
  @@index([moduleId])
  @@index([completed])
  @@index([lastWatched])
}
```

### 2.2 PDFProgress Model

```prisma
model PDFProgress {
  id              String   @id @default(cuid())
  userId          String
  moduleId        String
  
  // Progress tracking
  currentPage     Int      @default(1)      // Current page number
  totalPages      Int      @default(0)      // Total pages in PDF
  pagesViewed     Json     @default("[]")   // Array of page numbers viewed
  scrollPosition  Json     @default("{}")   // Object: { pageNum: scrollY }
  completionRate  Float    @default(0)      // Percentage (0-100)
  completed       Boolean  @default(false)  // True if completionRate >= 90
  
  // Metadata
  readCount       Int      @default(0)      // Number of times PDF was opened
  totalReadTime   Float    @default(0)      // Total time spent reading (seconds)
  lastRead        DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  module          Module   @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  
  @@unique([userId, moduleId])
  @@index([userId])
  @@index([moduleId])
  @@index([completed])
  @@index([lastRead])
}
```

### 2.3 Schema Relationships

```
User (1) ──────< (N) VideoProgress
User (1) ──────< (N) PDFProgress
Module (1) ────< (N) VideoProgress
Module (1) ────< (N) PDFProgress
```

---

## 3. API ENDPOINTS

### 3.1 Video Progress APIs

#### POST /api/progress/video/save
Save or update video progress.

**Request Body:**
```typescript
{
  moduleId: string;
  currentTime: number;      // seconds
  duration: number;         // seconds
  watchTime?: number;       // seconds watched in this session
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    id: string;
    completionRate: number;
    completed: boolean;
    moduleCompleted: boolean; // If module status was updated
  }
}
```

**Business Logic:**
1. Calculate `completionRate = (currentTime / duration) * 100`
2. Set `completed = true` if `completionRate >= 95`
3. Update `totalWatchTime += watchTime`
4. Increment `watchCount` if this is a new session
5. If `completed`, update Module completion status
6. Return updated progress

#### GET /api/progress/video/[moduleId]
Get video progress for current user and module.

**Response:**
```typescript
{
  success: boolean;
  data: {
    currentTime: number;
    duration: number;
    completionRate: number;
    completed: boolean;
    lastWatched: string;
  } | null
}
```

#### DELETE /api/progress/video/[moduleId]
Reset video progress (start from beginning).

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

### 3.2 PDF Progress APIs

#### POST /api/progress/pdf/save
Save or update PDF reading progress.

**Request Body:**
```typescript
{
  moduleId: string;
  currentPage: number;
  totalPages: number;
  scrollPosition?: number;  // scroll Y position for current page
  readTime?: number;        // seconds read in this session
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    id: string;
    completionRate: number;
    completed: boolean;
    moduleCompleted: boolean;
  }
}
```

**Business Logic:**
1. Add `currentPage` to `pagesViewed` array (if not already there)
2. Update `scrollPosition[currentPage] = scrollPosition`
3. Calculate `completionRate = (pagesViewed.length / totalPages) * 100`
4. Set `completed = true` if `completionRate >= 90`
5. Update `totalReadTime += readTime`
6. If `completed`, update Module completion status
7. Return updated progress

#### GET /api/progress/pdf/[moduleId]
Get PDF progress for current user and module.

**Response:**
```typescript
{
  success: boolean;
  data: {
    currentPage: number;
    totalPages: number;
    pagesViewed: number[];
    scrollPosition: Record<number, number>;
    completionRate: number;
    completed: boolean;
    lastRead: string;
  } | null
}
```

#### DELETE /api/progress/pdf/[moduleId]
Reset PDF progress.

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

### 3.3 Admin Analytics APIs

#### GET /api/admin/analytics/video
Get video analytics with filters.

**Query Parameters:**
```typescript
{
  courseId?: string;
  moduleId?: string;
  startDate?: string;
  endDate?: string;
  department?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    totalVideos: number;
    averageCompletionRate: number;
    totalWatchTime: number;
    videos: Array<{
      moduleId: string;
      moduleName: string;
      totalViews: number;
      averageWatchTime: number;
      completionRate: number;
      usersCompleted: number;
      usersInProgress: number;
      usersNotStarted: number;
    }>;
  }
}
```

#### GET /api/admin/analytics/pdf
Get PDF analytics with filters.

**Query Parameters:** Same as video

**Response:**
```typescript
{
  success: boolean;
  data: {
    totalPDFs: number;
    averageCompletionRate: number;
    totalReadTime: number;
    pdfs: Array<{
      moduleId: string;
      moduleName: string;
      totalReads: number;
      averagePagesRead: number;
      completionRate: number;
      usersCompleted: number;
      usersInProgress: number;
      usersNotStarted: number;
    }>;
  }
}
```

#### GET /api/admin/analytics/struggling-users
Get users who are struggling (progress < 50% after 7 days).

**Response:**
```typescript
{
  success: boolean;
  data: Array<{
    userId: string;
    userName: string;
    email: string;
    courseId: string;
    courseName: string;
    enrolledDate: string;
    daysSinceEnrollment: number;
    completionRate: number;
    stuckModule: {
      moduleId: string;
      moduleName: string;
      progress: number;
    };
  }>
}
```

---

## 4. FRONTEND COMPONENTS

### 4.1 Video Player Component

**File:** `src/components/media/VideoPlayer.tsx`

**Features:**
- HTML5 video player with custom controls
- Auto-save progress every 5 seconds (debounced)
- Resume from last position on load
- Show "Resume from XX:XX" notification
- Progress bar with completion percentage
- Offline queue for failed saves

**Props:**
```typescript
interface VideoPlayerProps {
  moduleId: string;
  videoUrl: string;
  onComplete?: () => void;
  className?: string;
}
```

**State Management:**
```typescript
{
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  progress: VideoProgress | null;
  showResumeNotification: boolean;
  isSaving: boolean;
  error: string | null;
}
```

### 4.2 PDF Viewer Component

**File:** `src/components/media/PDFViewer.tsx`

**Features:**
- PDF.js based viewer
- Auto-save page and scroll every 3 seconds (debounced)
- Resume from last page on load
- Show "Resume from page X" notification
- Progress bar with completion percentage
- Page navigation controls
- Offline queue for failed saves

**Props:**
```typescript
interface PDFViewerProps {
  moduleId: string;
  pdfUrl: string;
  onComplete?: () => void;
  className?: string;
}
```

**State Management:**
```typescript
{
  currentPage: number;
  totalPages: number;
  pagesViewed: Set<number>;
  scrollPosition: Record<number, number>;
  progress: PDFProgress | null;
  showResumeNotification: boolean;
  isSaving: boolean;
  error: string | null;
}
```

### 4.3 Custom Hooks

#### useVideoProgress Hook

**File:** `src/hooks/useVideoProgress.ts`

**Features:**
- Load progress on mount
- Debounced save (5 seconds)
- Retry logic (3 attempts with exponential backoff)
- Offline queue using IndexedDB
- Sync on reconnect

**API:**
```typescript
function useVideoProgress(moduleId: string) {
  return {
    progress: VideoProgress | null;
    isLoading: boolean;
    error: Error | null;
    saveProgress: (data: SaveVideoProgressData) => Promise<void>;
    resetProgress: () => Promise<void>;
  };
}
```

#### usePDFProgress Hook

**File:** `src/hooks/usePDFProgress.ts`

**Features:** Same as useVideoProgress but for PDF

**API:**
```typescript
function usePDFProgress(moduleId: string) {
  return {
    progress: PDFProgress | null;
    isLoading: boolean;
    error: Error | null;
    saveProgress: (data: SavePDFProgressData) => Promise<void>;
    resetProgress: () => Promise<void>;
  };
}
```

### 4.4 Admin Analytics Dashboard

**File:** `src/app/admin/analytics/progress/page.tsx`

**Features:**
- Video analytics table with filters
- PDF analytics table with filters
- Struggling users list
- Export to Excel functionality
- Real-time data refresh
- Responsive design

**Sections:**
1. **Overview Cards**
   - Total videos/PDFs
   - Average completion rate
   - Total watch/read time
   - Active users

2. **Video Analytics Table**
   - Module name
   - Total views
   - Average watch time
   - Completion rate
   - Users breakdown

3. **PDF Analytics Table**
   - Module name
   - Total reads
   - Average pages read
   - Completion rate
   - Users breakdown

4. **Struggling Users Table**
   - User name & email
   - Course name
   - Days since enrollment
   - Current progress
   - Stuck module

---

## 5. SERVICE LAYER

### 5.1 VideoProgressService

**File:** `src/lib/services/video-progress.service.ts`

**Methods:**
```typescript
class VideoProgressService {
  // Save or update progress
  async saveProgress(data: SaveVideoProgressInput): Promise<VideoProgress>;
  
  // Get progress for user and module
  async getProgress(userId: string, moduleId: string): Promise<VideoProgress | null>;
  
  // Calculate completion rate
  calculateCompletionRate(currentTime: number, duration: number): number;
  
  // Check if video is completed (>= 95%)
  isCompleted(completionRate: number): boolean;
  
  // Update module completion status if video completed
  async updateModuleCompletion(userId: string, moduleId: string): Promise<void>;
  
  // Reset progress
  async resetProgress(userId: string, moduleId: string): Promise<void>;
  
  // Get analytics
  async getAnalytics(filters: AnalyticsFilters): Promise<VideoAnalytics>;
}
```

### 5.2 PDFProgressService

**File:** `src/lib/services/pdf-progress.service.ts`

**Methods:**
```typescript
class PDFProgressService {
  // Save or update progress
  async saveProgress(data: SavePDFProgressInput): Promise<PDFProgress>;
  
  // Get progress for user and module
  async getProgress(userId: string, moduleId: string): Promise<PDFProgress | null>;
  
  // Calculate completion rate based on pages viewed
  calculateCompletionRate(pagesViewed: number[], totalPages: number): number;
  
  // Check if PDF is completed (>= 90%)
  isCompleted(completionRate: number): boolean;
  
  // Update module completion status if PDF completed
  async updateModuleCompletion(userId: string, moduleId: string): Promise<void>;
  
  // Reset progress
  async resetProgress(userId: string, moduleId: string): Promise<void>;
  
  // Get analytics
  async getAnalytics(filters: AnalyticsFilters): Promise<PDFAnalytics>;
}
```

---

## 6. PERFORMANCE OPTIMIZATIONS

### 6.1 Debouncing Strategy

**Video Progress:**
- Debounce save operations to 5 seconds
- Batch multiple updates into single API call
- Cancel pending saves on unmount

**PDF Progress:**
- Debounce save operations to 3 seconds
- Only save when page or scroll changes significantly (>10%)
- Cancel pending saves on unmount

### 6.2 Database Indexing

```sql
-- Indexes for fast queries
CREATE INDEX idx_video_progress_user ON VideoProgress(userId);
CREATE INDEX idx_video_progress_module ON VideoProgress(moduleId);
CREATE INDEX idx_video_progress_completed ON VideoProgress(completed);
CREATE INDEX idx_video_progress_last_watched ON VideoProgress(lastWatched);

CREATE INDEX idx_pdf_progress_user ON PDFProgress(userId);
CREATE INDEX idx_pdf_progress_module ON PDFProgress(moduleId);
CREATE INDEX idx_pdf_progress_completed ON PDFProgress(completed);
CREATE INDEX idx_pdf_progress_last_read ON PDFProgress(lastRead);
```

### 6.3 Caching Strategy

**Client-side:**
- Cache progress data in React state
- Use SWR for data fetching with revalidation
- IndexedDB for offline queue

**Server-side:**
- Cache analytics queries for 5 minutes
- Use Redis for frequently accessed data (future enhancement)

### 6.4 Query Optimization

**Analytics Queries:**
- Use aggregation pipelines
- Limit result sets with pagination
- Use database views for complex queries
- Implement cursor-based pagination

---

## 7. ERROR HANDLING

### 7.1 Network Errors

**Strategy:**
1. Retry failed saves 3 times with exponential backoff (1s, 2s, 4s)
2. Queue failed saves in IndexedDB
3. Sync queued saves when connection restored
4. Show user-friendly error messages

### 7.2 Validation Errors

**Client-side:**
- Validate data before sending to API
- Show inline error messages
- Prevent invalid state

**Server-side:**
- Validate all inputs with Zod schemas
- Return detailed error messages
- Log errors for debugging

### 7.3 Edge Cases

**Video:**
- Handle video duration = 0
- Handle seeking beyond duration
- Handle multiple tabs playing same video
- Handle browser refresh during playback

**PDF:**
- Handle PDF load failures
- Handle invalid page numbers
- Handle scroll position out of bounds
- Handle PDF with 0 pages

---

## 8. SECURITY CONSIDERATIONS

### 8.1 Authentication & Authorization

- All API endpoints require authentication
- Users can only access their own progress
- Admin endpoints require ADMIN role
- Validate userId matches session user

### 8.2 Data Validation

- Validate all numeric inputs (no negative values)
- Sanitize JSON data (pagesViewed, scrollPosition)
- Prevent SQL injection with Prisma
- Rate limit API endpoints (100 requests/minute per user)

### 8.3 Data Privacy

- Progress data is user-specific
- No cross-user data leakage
- Admin can only view aggregated analytics
- GDPR compliance: allow data deletion

---

## 9. TESTING STRATEGY

### 9.1 Unit Tests

**Backend:**
- VideoProgressService methods
- PDFProgressService methods
- Completion rate calculations
- Module status updates

**Frontend:**
- useVideoProgress hook
- usePDFProgress hook
- Progress calculations
- Debounce logic

### 9.2 Integration Tests

- API endpoint responses
- Database operations
- Progress save and retrieve flow
- Module completion updates

### 9.3 E2E Tests

- Video playback and progress save
- PDF reading and progress save
- Resume functionality
- Admin analytics dashboard

### 9.4 Performance Tests

- 100 concurrent progress saves
- Analytics query performance
- Large PDF handling (100+ pages)
- Long video handling (2+ hours)

---

## 10. DEPLOYMENT CHECKLIST

### 10.1 Pre-deployment

- [ ] Run database migration
- [ ] Update environment variables
- [ ] Run all tests
- [ ] Code review completed
- [ ] Documentation updated

### 10.2 Deployment

- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Monitor error logs
- [ ] Deploy to production
- [ ] Monitor performance metrics

### 10.3 Post-deployment

- [ ] Verify progress tracking works
- [ ] Check analytics dashboard
- [ ] Monitor database performance
- [ ] Collect user feedback
- [ ] Create rollback plan

---

## 11. FUTURE ENHANCEMENTS

### Phase 3C (Future)
- Offline video/PDF download
- Video quality selection
- PDF annotation and highlighting
- Social features (comments, discussions)
- Gamification (badges, achievements)
- Mobile app support
- Video transcription and subtitles
- PDF full-text search

---

**Design Status:** ✅ Approved  
**Ready for Implementation:** Yes  
**Estimated Effort:** 12-16 hours  
**Priority:** High
