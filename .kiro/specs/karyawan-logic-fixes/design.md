# Karyawan Logic Fixes Bugfix Design

## Overview

This design addresses 23 documented bugs and logic errors across the karyawan (employee) e-learning platform, ranging from critical security vulnerabilities to code quality improvements. The fixes target test proctoring security, enrollment status handling, progress tracking accuracy, and type safety.

**Fix Strategy:**
- **Critical (5 bugs)**: Immediate security and data integrity fixes with backward compatibility
- **High (6 bugs)**: Logic corrections for core functionality with regression prevention
- **Medium (7 bugs)**: UX consistency improvements and error handling enhancements
- **Low (5 bugs)**: Code quality and maintainability improvements

**Affected Systems:**
- Frontend: TestClient, Dashboard, Course Detail, Calendar
- Backend: Course actions, Test actions
- Database: Schema validation constraints
- API: PDF download endpoint

---

## Glossary

- **Bug_Condition (C)**: The set of inputs/conditions that trigger each documented bug
- **Property (P)**: The expected correct behavior when bug conditions are met
- **Preservation**: Existing functionality that must remain unchanged by fixes
- **SESSION_ID**: Unique identifier for test-taking session used for tab-lock mechanism
- **Enrollment Status**: User's current state in a course (IN_PROGRESS, COMPLETED, FAILED, PENDING, REJECTED, CHEATING)
- **Test Proctoring**: Security system tracking tab switches, speed hacks, and violations during tests
- **Hydration Mismatch**: React error when server-rendered HTML differs from client-rendered output
- **isCheated**: Boolean flag indicating test attempt involved cheating (violations or speed hack)
- **postTestAttempts**: Counter tracking number of post-test attempts per enrollment

---

## Bug Details

### Bug Condition

The bugs manifest across multiple conditions organized by severity:

**Critical Security Conditions:**

```
FUNCTION isBugCondition_Critical(input)
  INPUT: input of type { component: string, renderCount: number, enrollmentStatus: string, urlParam: string, randomSeed: string }
  OUTPUT: boolean
  
  RETURN (
    // Bug 1.1: SESSION_ID regenerates on every render
    (input.component === "TestClient" AND input.renderCount > 1 AND SESSION_ID_changes_on_rerender)
    
    OR
    
    // Bug 1.2: Server-side randomization causes hydration mismatch
    (input.component === "TestPage" AND input.randomSeed === "Math.random()" AND isServerComponent)
    
    OR
    
    // Bug 1.3: FAILED status users can access course content
    (input.enrollmentStatus === "FAILED" AND userCanAccessModules === true)
    
    OR
    
    // Bug 1.4: parseInt returns NaN breaking admin page
    (input.urlParam === "?step=abc" AND parseInt(input.urlParam) === NaN)
    
    OR
    
    // Bug 1.5: CHEATING/FAILED enrollments appear in active courses
    (input.enrollmentStatus IN ["CHEATING", "FAILED"] AND appearsInDashboard === true)
  )
END FUNCTION
```

**High Priority Logic Conditions:**

```
FUNCTION isBugCondition_High(input)
  INPUT: input of type { context: string, enrollmentStatus: string, moduleCompletion: number, testAttempts: array, formData: object }
  OUTPUT: boolean
  
  RETURN (
    // Bug 1.6: CHEATING/FAILED in calendar deadlines
    (input.context === "Calendar" AND input.enrollmentStatus IN ["CHEATING", "FAILED"])
    
    OR
    
    // Bug 1.7: PDF API missing deadline validation
    (input.context === "PDF_API" AND deadlineValidation === false)
    
    OR
    
    // Bug 1.8: nextModuleId falls back to first module when all complete
    (input.moduleCompletion === 100 AND nextModuleId === firstModuleId)
    
    OR
    
    // Bug 1.9: Average score includes cheated attempts
    (input.testAttempts.some(a => a.isCheated === true) AND includedInAverage === true)
    
    OR
    
    // Bug 1.10: Completion rate counts FAILED as completed
    (input.enrollmentStatus === "FAILED" AND countedAsCompleted === true)
    
    OR
    
    // Bug 1.11: Test form allows 0 or multiple correct answers
    (input.formData.correctAnswerCount !== 1)
  )
END FUNCTION
```

**Medium Priority UX Conditions:**

```
FUNCTION isBugCondition_Medium(input)
  INPUT: input of type { errorType: string, asyncPattern: string, definition: string, nullCheck: boolean, reference: string }
  OUTPUT: boolean
  
  RETURN (
    // Bug 1.12: localStorage not cleared on server error
    (input.errorType === "SERVER_ERROR" AND localStorageCleared === false)
    
    OR
    
    // Bug 1.13: startTransition wraps async functions
    (input.asyncPattern === "startTransition(async () => {...})")
    
    OR
    
    // Bug 1.14: Active courses definition differs between pages
    (input.definition.calendar !== input.definition.dashboard)
    
    OR
    
    // Bug 1.15: Missing null check for getPerformanceData
    (input.nullCheck === false AND accessingProperties === true)
    
    OR
    
    // Bug 1.16: test.questions passed to useState without cloning
    (input.reference === "direct" AND potentialMutation === true)
    
    OR
    
    // Bug 1.17: handlePoke missing error feedback
    (actionFails === true AND errorFeedback === false)
  )
END FUNCTION
```

### Examples

**Critical Examples:**

1. **SESSION_ID Regeneration (Bug 1.1)**
   - **Current**: User opens test → SESSION_ID = "abc123" → Component re-renders → SESSION_ID = "xyz789" → Tab lock breaks → User opens second tab successfully
   - **Expected**: User opens test → SESSION_ID = "abc123" → Component re-renders → SESSION_ID = "abc123" (unchanged) → Tab lock works → Second tab blocked

2. **Server-Side Randomization (Bug 1.2)**
   - **Current**: Server renders questions [Q3, Q1, Q2] → Client hydrates with [Q2, Q3, Q1] → Hydration mismatch error → Questions flicker/reorder
   - **Expected**: Server renders questions in original order → Client randomizes on mount → No hydration mismatch → Consistent display

3. **FAILED Status Access (Bug 1.3)**
   - **Current**: User fails post-test → enrollment.status = "FAILED" → isEnrolled = true → User accesses modules and tests
   - **Expected**: User fails post-test → enrollment.status = "FAILED" → isEnrolled = false → User sees "Re-enrollment required" message

**High Priority Examples:**

4. **Average Score with Cheating (Bug 1.9)**
   - **Current**: Attempts = [80 (valid), 90 (cheated), 70 (valid)] → avgScore = (80+90+70)/3 = 80
   - **Expected**: Attempts = [80 (valid), 90 (cheated), 70 (valid)] → Filter cheated → avgScore = (80+70)/2 = 75

5. **nextModuleId Fallback (Bug 1.8)**
   - **Current**: All 5 modules completed → nextModuleId = course.modules[0].id → "LANJUTKAN BELAJAR" button redirects to Module 1
   - **Expected**: All 5 modules completed → nextModuleId = null → Show "Course Complete" message or post-test button

**Medium Priority Examples:**

6. **localStorage Not Cleared (Bug 1.12)**
   - **Current**: Test submit fails with 500 error → localStorage still contains answers → User refreshes → Duplicate attempt created
   - **Expected**: Test submit fails with 500 error → localStorage cleared → User refreshes → Clean state, no duplicate

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

**Test Proctoring System (3.1)**
- Users taking tests without violations SHALL CONTINUE TO have tab switches and speed hacks tracked correctly
- Test submissions within time limits SHALL CONTINUE TO process successfully
- Tests with randomization disabled SHALL CONTINUE TO display questions in static order

**Enrollment Workflow (3.2)**
- Users with IN_PROGRESS status SHALL CONTINUE TO access course materials normally
- Users with COMPLETED status SHALL CONTINUE TO view courses as completed
- Users with PENDING status SHALL CONTINUE TO see waiting approval messages
- Users with REJECTED status SHALL CONTINUE TO see rejection messages with reasons

**Course Progress Tracking (3.3)**
- Module completion SHALL CONTINUE TO update correctly in database
- Dashboard completed module counts SHALL CONTINUE TO display accurately
- Course detail progress percentages SHALL CONTINUE TO calculate correctly

**Admin Functionality (3.4)**
- Admin analytics SHALL CONTINUE TO display correctly (except completion rate fix)
- Admin enrollment approval/rejection workflow SHALL CONTINUE TO function
- Admin course management SHALL CONTINUE TO work (except step validation fix)

**Calendar & Notifications (3.5)**
- Valid deadline events SHALL CONTINUE TO display correctly in calendar
- Notification system SHALL CONTINUE TO function normally

**PDF Download (3.6)**
- Enrolled users downloading PDFs before deadline SHALL CONTINUE TO work
- Admin PDF downloads SHALL CONTINUE TO work without restrictions

**Test Scoring (3.7)**
- Tests submitted with correct answers SHALL CONTINUE TO calculate scores accurately
- Test attempts marked as cheated SHALL CONTINUE TO update enrollment status appropriately

**UI/UX Components (3.8)**
- Page navigation and routing SHALL CONTINUE TO work correctly
- Form validation SHALL CONTINUE TO function
- Component styling SHALL CONTINUE TO display correctly (except hardcoded color improvements)

---

## Hypothesized Root Cause

Based on the bug analysis, the root causes are organized by category:

### 1. **React State Management Issues**

**Bug 1.1 (SESSION_ID)**: The `SESSION_ID` is declared as a constant that calls `crypto.randomUUID()` on every render instead of being memoized. React re-renders cause the constant to be re-evaluated, generating a new UUID each time.

**Bug 1.16 (Direct Reference)**: Passing `test.questions` directly to `useState` creates a reference to the prop object. Any mutations to the state array could affect the original prop.

### 2. **Server/Client Hydration Mismatch**

**Bug 1.2 (Math.random on Server)**: Using `Math.random()` in a Server Component causes non-deterministic rendering. Each request generates a different random seed, so server HTML differs from client hydration, triggering React hydration errors.

### 3. **Business Logic Errors**

**Bug 1.3 (FAILED Access)**: The `isEnrolled` condition includes `enrollment.status === "FAILED"` in the OR chain, treating FAILED users as enrolled when they should be blocked.

**Bug 1.5, 1.6 (CHEATING/FAILED in Lists)**: Filter conditions use `notIn: ["REJECTED", "PENDING"]` but don't exclude CHEATING and FAILED statuses, allowing them to appear in active course lists.

**Bug 1.8 (nextModuleId Fallback)**: The fallback logic uses `?? course.modules[0]?.id` which returns the first module when all are complete, instead of returning `null` to indicate completion.

**Bug 1.9 (Cheated in Average)**: The average score calculation doesn't filter `isCheated === true` attempts before computing the mean.

**Bug 1.10 (FAILED in Completion Rate)**: The completion rate formula adds `failedCount` to the numerator, inflating the percentage.

### 4. **Input Validation Gaps**

**Bug 1.4 (parseInt NaN)**: The code calls `parseInt(searchParams.step || "2")` without checking if the result is `NaN`. Non-numeric URL parameters break the page.

**Bug 1.7 (PDF Deadline)**: The PDF API checks enrollment existence but doesn't validate if `course.deadlineDate` has passed for non-admin users.

**Bug 1.11 (Form Schema)**: The Zod schema validates `options.min(2)` but doesn't enforce exactly one `isCorrect: true` option per question.

### 5. **Error Handling Deficiencies**

**Bug 1.12 (localStorage Cleanup)**: The catch block handles offline scenarios but doesn't clear localStorage for server errors, leaving stale data that can cause duplicate submissions.

**Bug 1.15 (Null Check)**: The code accesses `data.summary.totalCourses` without first checking if `data` or `data.summary` is null/undefined.

**Bug 1.17 (handlePoke Error)**: The action only shows success toast but has no `else` branch for errors and doesn't reset `pokingId` state on failure.

### 6. **React Anti-Patterns**

**Bug 1.13 (startTransition + async)**: Using `startTransition(async () => {...})` is an anti-pattern. React's `startTransition` expects synchronous callbacks; wrapping async functions can cause unpredictable state updates.

### 7. **Inconsistent Definitions**

**Bug 1.14 (Active Courses)**: Calendar defines active courses as `status === "IN_PROGRESS"` only, while Dashboard includes `["IN_PROGRESS", "COMPLETED", "FAILED", "CHEATING"]`, creating inconsistent counts.

### 8. **Type Safety Erosion**

**Bug 1.18 (as any Casting)**: Extensive use of `(db.enrollment as any)` and similar casts removes TypeScript's compile-time safety, hiding potential runtime errors when Prisma schema changes.

### 9. **Code Quality Issues**

**Bug 1.19 (Static Greeting)**: The `useEffect` runs once with empty dependencies, so time-based greetings never update if the user keeps the tab open across time periods.

**Bug 1.20 (Redundant Icon)**: `CheckCircle2` is defined locally in TestClient when it's already available from `lucide-react`, creating unnecessary code duplication.

**Bug 1.22 (Hardcoded Colors)**: Inline `style={{ background: "#..." }}` objects prevent centralized theme management and dark mode support.

**Bug 1.23 (Unsafe Access)**: `courseTitleMap[c.courseId]` could be undefined if `coursePopularity` contains IDs not in `topCourseIds` due to race conditions.

---

## Correctness Properties

Property 1: Bug Condition - Critical Security Fixes

_For any_ input where critical security bug conditions hold (SESSION_ID regeneration, server-side randomization, FAILED status access, NaN from parseInt, or CHEATING/FAILED in active lists), the fixed code SHALL prevent security vulnerabilities, maintain session integrity, enforce access control, validate inputs safely, and filter inappropriate statuses from user-facing lists.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Bug Condition - High Priority Logic Fixes

_For any_ input where high priority logic bug conditions hold (CHEATING/FAILED in calendar, missing PDF deadline check, incorrect nextModuleId fallback, cheated attempts in average, FAILED in completion rate, or invalid test form data), the fixed code SHALL enforce correct business logic, validate deadlines, return appropriate null values for completion states, filter invalid data from calculations, and ensure form data integrity.

**Validates: Requirements 2.6, 2.7, 2.8, 2.9, 2.10, 2.11**

Property 3: Bug Condition - Medium Priority UX Fixes

_For any_ input where medium priority UX bug conditions hold (localStorage not cleared on error, startTransition with async, inconsistent active course definitions, missing null checks, direct references without cloning, or missing error feedback), the fixed code SHALL clean up state appropriately, use correct React patterns, standardize definitions across components, validate data before access, clone references to prevent mutations, and provide user feedback for all error scenarios.

**Validates: Requirements 2.12, 2.13, 2.14, 2.15, 2.16, 2.17**

Property 4: Bug Condition - Low Priority Code Quality Fixes

_For any_ input where low priority code quality bug conditions hold (excessive type casting, static time-based content, redundant definitions, hardcoded styles, or unsafe property access), the fixed code SHALL use proper TypeScript types, optionally update dynamic content, remove redundant code, use centralized styling, and implement safe access patterns.

**Validates: Requirements 2.18, 2.19, 2.20, 2.21, 2.22, 2.23**

Property 5: Preservation - Existing Functionality

_For any_ input where bug conditions do NOT hold (valid test sessions, correct enrollment statuses, proper form submissions, valid URL parameters, non-cheated attempts), the fixed code SHALL produce exactly the same behavior as the original code, preserving all test proctoring, enrollment workflows, progress tracking, admin functionality, calendar operations, PDF downloads, test scoring, and UI/UX components.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

---

## Fix Implementation

### Changes Required

The fixes are organized by severity and file location:

