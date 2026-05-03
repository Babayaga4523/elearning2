# Complete E-Learning Logic Documentation

## 🎯 Business Rules

### Kriteria Kelulusan Karyawan

**Karyawan dinyatakan LULUS jika:**
1. ✅ Menyelesaikan semua modul pembelajaran
2. ✅ Mengerjakan Pre-Test (jika ada)
3. ✅ Mengerjakan Post-Test
4. ✅ **Nilai Post-Test ≥ KKM (Kriteria Ketuntasan Minimal)**

**Contoh:**
- KKM = 70%
- Nilai 70% → **LULUS** ✅
- Nilai 75% → **LULUS** ✅
- Nilai 69% → **GAGAL** ❌
- Nilai 65% → **GAGAL** ❌

---

## 📊 Status Enrollment

### 1. **PENDING**
- Karyawan sudah mendaftar tapi belum disetujui admin
- Tidak bisa akses materi
- Menunggu approval

### 2. **IN_PROGRESS**
- Karyawan sedang mengerjakan kursus
- Bisa akses semua materi
- Belum menyelesaikan Post-Test atau belum lulus

### 3. **FAILED**
- Karyawan gagal Post-Test (nilai < KKM)
- Masih bisa retry jika ada sisa percobaan
- Status sementara, bisa berubah jadi COMPLETED jika retry dan lulus

### 4. **COMPLETED**
- Karyawan **LULUS** Post-Test (nilai ≥ KKM)
- Kursus selesai
- Tidak perlu retry lagi

### 5. **REJECTED**
- Pendaftaran ditolak admin
- Tidak bisa akses materi

### 6. **CHEATING**
- Terdeteksi kecurangan saat test
- Kursus diblokir
- Tidak bisa retry

---

## 🔄 Flow Lengkap Karyawan

### Step 1: Pendaftaran
```
Karyawan → Daftar Kursus → Status: PENDING
                          ↓
                    Admin Approve
                          ↓
                   Status: IN_PROGRESS
```

### Step 2: Pre-Test (Opsional)
```
Karyawan → Kerjakan Pre-Test → Nilai dicatat
                              ↓
                        Lanjut ke Modul
                        (tidak affect status)
```

**Catatan Pre-Test:**
- ✅ Tidak mempengaruhi status enrollment
- ✅ Hanya untuk mengukur pengetahuan awal
- ✅ Bisa retry sesuai maxAttempts
- ✅ Tidak ada konsekuensi jika gagal

### Step 3: Modul Pembelajaran
```
Karyawan → Selesaikan Modul 1 → Progress 20%
        → Selesaikan Modul 2 → Progress 40%
        → Selesaikan Modul 3 → Progress 60%
        → Selesaikan Modul 4 → Progress 80%
        → Selesaikan Modul 5 → Progress 100%
                              ↓
                    Semua Modul Selesai
                    (Status masih IN_PROGRESS)
```

**Catatan Modul:**
- ✅ Harus diselesaikan semua
- ✅ Progress dihitung otomatis
- ✅ Status masih IN_PROGRESS sampai Post-Test lulus

### Step 4: Post-Test (Menentukan Kelulusan)
```
Karyawan → Kerjakan Post-Test → Submit
                               ↓
                        Hitung Nilai
                               ↓
                    ┌──────────┴──────────┐
                    ↓                     ↓
            Nilai ≥ KKM            Nilai < KKM
                    ↓                     ↓
              Status: COMPLETED    Status: FAILED
              🎉 LULUS!            ❌ Gagal
                                        ↓
                                  Cek Sisa Percobaan
                                        ↓
                            ┌───────────┴───────────┐
                            ↓                       ↓
                    Ada Sisa Percobaan      Tidak Ada Sisa
                            ↓                       ↓
                      Bisa Retry            Tetap FAILED
                      (Kembali ke Step 4)   (Hubungi Admin)
```

---

## 💻 Implementation Logic

### 1. **Submit Post-Test** (`src/actions/test.ts`)

```typescript
// Calculate score
const score = (correctAnswers / totalQuestions) * 100;

// Check if passed
const finalPassed = score >= test.passingScore;

if (finalPassed) {
  // LULUS: Status = COMPLETED
  enrollmentUpdate = {
    status: "COMPLETED",
    postTestAttempts: nextAttemptNumber,
  };
} else {
  // GAGAL: Status = FAILED (bisa retry)
  enrollmentUpdate = {
    status: "FAILED",
    postTestAttempts: nextAttemptNumber,
  };
}
```

**Logic:**
- ✅ `score >= passingScore` → LULUS → COMPLETED
- ✅ `score < passingScore` → GAGAL → FAILED

### 2. **Complete Module** (`src/actions/module.ts`)

```typescript
// Check if all modules completed
const allModulesCompleted = completedModules.length >= courseModules.length;

if (allModulesCompleted) {
  // Check if Post-Test exists
  const postTest = await db.test.findFirst({
    where: { courseId, type: "POST" }
  });
  
  let canComplete = true;
  
  // If Post-Test exists, user must pass it
  if (postTest) {
    const passedPostTest = await db.testAttempt.findFirst({
      where: { userId, testId: postTest.id, passed: true }
    });
    canComplete = !!passedPostTest;
  }
  
  // Only mark as COMPLETED if Post-Test passed
  if (canComplete) {
    status = "COMPLETED";
  }
}
```

**Logic:**
- ✅ Semua modul selesai + Post-Test lulus → COMPLETED
- ✅ Semua modul selesai + Post-Test belum lulus → IN_PROGRESS
- ✅ Semua modul selesai + Tidak ada Post-Test → COMPLETED

### 3. **Retry Logic** (`src/app/(karyawan)/courses/[courseId]/tests/[testId]/page.tsx`)

```typescript
// RULE 1: If user has PASSED, redirect to result (no retry)
if (bestPassedAttempt) {
  return redirect(result);
}

// RULE 2: Check max attempts
const effectiveMaxAttempts = test.type === "POST" 
  ? (enrollment?.maxPostTestAttempts ?? test.maxAttempts ?? 3)
  : (test.maxAttempts ?? 0);

const actualAttemptCount = attempts.length;

// RULE 3: If used all attempts, redirect to result
const hasUsedAllAttempts = effectiveMaxAttempts > 0 && actualAttemptCount >= effectiveMaxAttempts;

if (hasUsedAllAttempts && latestAttempt) {
  return redirect(result);
}

// RULE 4: Allow retry if failed but has remaining attempts
```

**Logic:**
- ✅ Sudah lulus → tidak bisa retry
- ✅ Gagal + ada sisa percobaan → bisa retry
- ✅ Gagal + tidak ada sisa → tidak bisa retry

---

## 📈 Contoh Skenario

### Skenario 1: Karyawan Lulus di Percobaan Pertama

```
1. Daftar kursus → PENDING
2. Admin approve → IN_PROGRESS
3. Kerjakan Pre-Test → Nilai 60% (dicatat saja)
4. Selesaikan 5 modul → Progress 100%
5. Kerjakan Post-Test → Nilai 80% (KKM 70%)
   → LULUS! → Status: COMPLETED
6. UI menampilkan "Kursus Selesai" ✅
```

### Skenario 2: Karyawan Gagal, Retry, Lalu Lulus

```
1. Daftar kursus → PENDING
2. Admin approve → IN_PROGRESS
3. Kerjakan Pre-Test → Nilai 55%
4. Selesaikan 5 modul → Progress 100%
5. Kerjakan Post-Test (Attempt 1) → Nilai 65% (KKM 70%)
   → GAGAL → Status: FAILED
6. UI menampilkan "Percobaan: 1/3" (masih ada 2 sisa)
7. Retry Post-Test (Attempt 2) → Nilai 75%
   → LULUS! → Status: COMPLETED
8. UI menampilkan "Kursus Selesai" ✅
```

### Skenario 3: Karyawan Gagal Semua Percobaan

```
1. Daftar kursus → PENDING
2. Admin approve → IN_PROGRESS
3. Selesaikan 5 modul → Progress 100%
4. Kerjakan Post-Test (Attempt 1) → Nilai 60% (KKM 70%)
   → GAGAL → Status: FAILED
5. Retry (Attempt 2) → Nilai 65%
   → GAGAL → Status: FAILED
6. Retry (Attempt 3) → Nilai 68%
   → GAGAL → Status: FAILED
7. UI menampilkan "Batas Percobaan Tercapai" ❌
8. Status tetap FAILED
9. Karyawan harus hubungi admin untuk tambah percobaan
```

### Skenario 4: Kursus Tanpa Post-Test

```
1. Daftar kursus → PENDING
2. Admin approve → IN_PROGRESS
3. Kerjakan Pre-Test → Nilai 70%
4. Selesaikan 5 modul → Progress 100%
5. Tidak ada Post-Test
   → Otomatis COMPLETED setelah modul selesai
6. UI menampilkan "Kursus Selesai" ✅
```

---

## 🎨 UI Display Logic

### Course Detail Page

**Progress Card:**
```typescript
// Progress
const progress = (completedModules / totalModules) * 100;

// Pre-Test Status
const preStatus = latestPreAttempt?.passed ? "Selesai" : "Belum";

// Post-Test Status
const postStatus = latestPostAttempt?.passed ? "Selesai" : "Belum";

// CTA Button
if (enrollment.status === "COMPLETED") {
  return "Kursus Selesai" ✅
} else if (enrollment.status === "FAILED") {
  return "Retry Post-Test" (jika ada sisa)
} else {
  return "Lanjutkan Belajar"
}
```

### Test Step Card

**Percobaan Display:**
```typescript
// Show attempts
{testInfo.maxAttempts === 0 ? (
  <span>Unlimited</span>
) : (
  <span className={attemptCount >= maxAttempts ? "text-red-600" : "text-blue-600"}>
    {attemptCount}/{maxAttempts}
  </span>
)}
```

**Status Badge:**
```typescript
{testStatus === "LULUS" && <Badge>Lulus</Badge>}
{testStatus === "GAGAL" && <Badge>Gagal</Badge>}
{testStatus === "KECURANGAN" && <Badge>Kecurangan</Badge>}
```

---

## ✅ Checklist Validasi

### Pre-Test
- [x] Bisa dikerjakan setelah enrollment approved
- [x] Nilai dicatat tapi tidak affect status
- [x] Bisa retry sesuai maxAttempts
- [x] Tidak ada konsekuensi jika gagal

### Modul
- [x] Harus diselesaikan semua
- [x] Progress dihitung otomatis
- [x] Tidak mengubah status menjadi COMPLETED jika Post-Test belum lulus

### Post-Test
- [x] Hanya bisa dikerjakan setelah semua modul selesai
- [x] Nilai ≥ KKM → LULUS → Status COMPLETED
- [x] Nilai < KKM → GAGAL → Status FAILED
- [x] Bisa retry jika ada sisa percobaan
- [x] Tidak bisa retry jika sudah lulus
- [x] Tidak bisa retry jika tidak ada sisa percobaan

### UI
- [x] Menampilkan "Kursus Selesai" hanya jika status COMPLETED
- [x] Menampilkan sisa percobaan dengan benar
- [x] Menampilkan status LULUS/GAGAL dengan jelas
- [x] Tombol retry muncul jika gagal dan ada sisa percobaan

---

## 🚀 Summary

**Logic E-Learning Sudah Sempurna:**

1. ✅ **Kelulusan ditentukan oleh Post-Test**
   - Nilai ≥ KKM → LULUS
   - Nilai < KKM → GAGAL

2. ✅ **Status COMPLETED hanya jika:**
   - Semua modul selesai
   - Post-Test lulus (nilai ≥ KKM)

3. ✅ **Retry Logic:**
   - Bisa retry jika gagal dan ada sisa percobaan
   - Tidak bisa retry jika sudah lulus
   - Tidak bisa retry jika tidak ada sisa

4. ✅ **UI Display:**
   - "Kursus Selesai" hanya jika benar-benar selesai
   - Sisa percobaan ditampilkan dengan jelas
   - Status LULUS/GAGAL jelas

---

**Tanggal:** 1 Mei 2026  
**Developer:** Kiro AI Assistant  
**Status:** ✅ **LOGIC SEMPURNA - SESUAI REQUIREMENT**
