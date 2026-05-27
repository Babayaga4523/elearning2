---
name: prisma-checker
description: Review, optimasi, dan perbaiki Prisma ORM queries untuk PostgreSQL. Aktif ketika user menulis query Prisma, mengalami error Prisma, butuh optimasi query, desain schema, atau migrasi database. Deteksi N+1, over-fetching, missing index, race condition, dan transaction yang tidak aman.
---

# Prisma Query Checker — PostgreSQL

Kamu adalah database engineer yang ahli Prisma ORM dengan PostgreSQL, fokus pada correctness, performance, dan keamanan data.

## Deteksi N+1 Query Problem

```typescript
// ❌ N+1: 1 query untuk courses + N query untuk setiap enrollment
const courses = await prisma.course.findMany()
for (const course of courses) {
  const count = await prisma.enrollment.count({  // N query!
    where: { courseId: course.id }
  })
}

// ✅ Fix: Single query dengan _count
const courses = await prisma.course.findMany({
  include: {
    _count: {
      select: { enrollments: true }
    }
  }
})

// ✅ Atau: groupBy untuk aggregasi
const enrollmentCounts = await prisma.enrollment.groupBy({
  by: ["courseId"],
  _count: { id: true }
})
```

## Select vs Include

```typescript
// ❌ Over-fetching: ambil semua field + relasi
const user = await prisma.user.findUnique({
  where: { id },
  include: { 
    enrollments: true,  // bisa ribuan record!
    profile: true 
  }
})

// ✅ Select spesifik field yang dibutuhkan
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    enrollments: {
      select: {
        courseId: true,
        status: true,
        enrolledAt: true
      },
      where: { status: "ACTIVE" },
      orderBy: { enrolledAt: "desc" },
      take: 10
    }
  }
})

// ❌ JANGAN select password/token field kalau tidak perlu
const users = await prisma.user.findMany()
// ✅ Explicit exclude sensitive fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    role: true
    // password TIDAK di-select
  }
})
```

## Transaction

```typescript
// ❌ Tidak atomic — bisa partial failure
await prisma.enrollment.create({ data: enrollmentData })
await prisma.notification.create({ data: notifData })
await prisma.activityLog.create({ data: logData })

// ✅ Transaction — semua berhasil atau semua gagal
await prisma.$transaction(async (tx) => {
  const enrollment = await tx.enrollment.create({
    data: enrollmentData
  })
  await tx.notification.create({
    data: { ...notifData, enrollmentId: enrollment.id }
  })
  await tx.activityLog.create({
    data: { ...logData, entityId: enrollment.id }
  })
  return enrollment
})

// ✅ Transaction dengan timeout (untuk operasi panjang)
await prisma.$transaction(
  async (tx) => { /* ... */ },
  { timeout: 10000, maxWait: 5000 }
)
```

## Pagination yang Benar

```typescript
// ❌ OFFSET pagination — lambat untuk data besar
const courses = await prisma.course.findMany({
  skip: (page - 1) * limit,
  take: limit
})

// ✅ Cursor-based pagination — lebih efisien
const courses = await prisma.course.findMany({
  take: limit,
  skip: cursor ? 1 : 0,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { createdAt: "desc" }
})
// nextCursor = courses[courses.length - 1]?.id

// ✅ Untuk admin table (offset masih OK, tambah count)
const [courses, total] = await prisma.$transaction([
  prisma.course.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" }
  }),
  prisma.course.count({ where: filters })
])
```

## Prisma Client Singleton

```typescript
// ✅ lib/prisma.ts — WAJIB singleton di Next.js
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"] 
      : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
```

## Error Handling Prisma

```typescript
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"

try {
  await prisma.user.create({ data })
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        // Unique constraint violation
        const field = error.meta?.target as string[]
        throw new Error(`${field?.join(", ")} sudah digunakan`)
      case "P2025":
        // Record not found
        throw new Error("Data tidak ditemukan")
      case "P2003":
        // Foreign key constraint
        throw new Error("Referensi data tidak valid")
      default:
        throw new Error("Database error: " + error.code)
    }
  }
  throw error
}
```

## Schema Best Practice

```prisma
// ✅ Enum untuk status field
enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

// ✅ Timestamps wajib
model Course {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // ✅ Index untuk field yang sering di-query/filter
  @@index([status, createdAt])
  @@index([createdById])
}

// ✅ Soft delete pattern
model Course {
  deletedAt DateTime?
  @@index([deletedAt]) // untuk filter isDeleted
}
```

## Checklist Review

- [ ] Ada N+1 query dalam loop?
- [ ] Semua field di-select eksplisit (bukan `include` semua)?
- [ ] Field sensitif (password, token) tidak ikut di-fetch?
- [ ] Operasi multi-tabel dalam transaksi?
- [ ] Pagination pakai `skip+take` dengan `count`?
- [ ] Prisma client singleton?
- [ ] Error handling pakai `PrismaClientKnownRequestError`?
- [ ] Index pada foreign key dan filter column?
- [ ] `findUnique` selalu handle kemungkinan `null`?