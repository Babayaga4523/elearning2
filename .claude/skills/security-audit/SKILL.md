---
name: security-audit
description: Audit keamanan kode Next.js 14, API routes, Auth.js, dan Prisma dari sisi security vulnerability. Aktif ketika user meminta security review, menemukan potensi celah keamanan, implementasi RBAC/permission, atau sebelum deployment ke production. Cakupan: authentication, authorization, input validation, SQL injection, XSS, CSRF, data exposure.
---

# Security Audit — HCMS E-Learning

Kamu adalah security engineer yang mengaudit aplikasi Next.js 14 enterprise untuk BNI Finance (lingkungan perbankan, standar keamanan tinggi).

## Kategori Temuan

```
🔴 CRITICAL  — Wajib fix sebelum production
🟠 HIGH      — Fix dalam sprint ini
🟡 MEDIUM    — Fix sprint berikutnya
🔵 LOW       — Nice to have
```

---

## Authentication & Authorization

### Auth Check di Setiap Layer
```typescript
// ✅ API Route — selalu cek session
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // ...
}

// ✅ Server Action — selalu cek session
"use server"
export async function deleteModule(moduleId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  if (session.user.role !== "ADMIN") throw new Error("Forbidden")
  // ...
}

// ✅ RBAC check — cek permission spesifik
async function checkPermission(userId: string, action: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, permissions: true }
  })
  
  if (user?.role === "SUPER_ADMIN") return true
  return user?.permissions?.includes(action) ?? false
}
```

### IDOR (Insecure Direct Object Reference)
```typescript
// ❌ BERBAHAYA: user bisa akses data orang lain dengan ganti ID
const enrollment = await prisma.enrollment.findUnique({
  where: { id: params.enrollmentId }
})

// ✅ Selalu scope ke user yang login
const enrollment = await prisma.enrollment.findUnique({
  where: { 
    id: params.enrollmentId,
    userId: session.user.id  // WAJIB!
  }
})
```

---

## Input Validation

### Zod Schema untuk Semua Input
```typescript
import { z } from "zod"

// ✅ Schema yang ketat
const createCourseSchema = z.object({
  title: z.string()
    .min(3, "Minimal 3 karakter")
    .max(100, "Maksimal 100 karakter")
    .trim(),
  description: z.string()
    .max(2000)
    .optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  scheduledAt: z.string().datetime().optional(),
})

// ✅ Validasi di Server Action
export async function createCourse(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  
  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
  }
  
  const parsed = createCourseSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }
  
  // Aman: data sudah validated
  await prisma.course.create({ data: parsed.data })
}
```

---

## Data Exposure Prevention

```typescript
// ❌ Kembalikan semua field user
const user = await prisma.user.findUnique({ where: { id } })
return NextResponse.json(user)

// ✅ Select hanya field yang aman dikembalikan ke client
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    // TIDAK: password, passwordResetToken, internalNotes
  }
})

// ✅ Utility type untuk response aman
type PublicUser = Pick<User, "id" | "name" | "email" | "role">
```

---

## Environment Variable Safety

```typescript
// ❌ Expose server secret ke client
// next.config.js
env: {
  DATABASE_URL: process.env.DATABASE_URL, // BAHAYA!
  JWT_SECRET: process.env.JWT_SECRET,     // BAHAYA!
}

// ✅ Hanya NEXT_PUBLIC_ yang boleh di client
// next.config.js
env: {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL, // OK
}

// ✅ Cek ENV wajib saat startup
// lib/env.ts
function checkEnv() {
  const required = ["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"]
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env: ${key}`)
    }
  }
}
```

---

## File Upload Security (jika ada)

```typescript
// ✅ Validasi file upload
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function uploadFile(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  
  const file = formData.get("file") as File
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Tipe file tidak diizinkan" }
  }
  
  if (file.size > MAX_SIZE) {
    return { error: "Ukuran file melebihi batas" }
  }
  
  // Rename file — jangan pakai nama asli dari user!
  const safeName = `${Date.now()}-${randomBytes(8).toString("hex")}`
  const ext = file.type === "application/pdf" ? ".pdf" : ".jpg"
}
```

---

## Rate Limiting & Brute Force

```typescript
// ✅ Rate limiting pada endpoint sensitif
// middleware.ts atau di route handler

import { Ratelimit } from "@upstash/ratelimit"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 request per menit
})

export async function POST(req: NextRequest) {
  const ip = req.ip ?? "anonymous"
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return NextResponse.json(
      { error: "Terlalu banyak request" },
      { status: 429 }
    )
  }
}
```

---

## Security Headers

```typescript
// next.config.ts
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob:;
    `.replace(/\n/g, "")
  },
]

module.exports = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  }
}
```

---

## Security Checklist Pre-Deployment

### Authentication
- [ ] Semua route protected di middleware
- [ ] Session di-check di setiap API route & Server Action
- [ ] NEXTAUTH_SECRET kuat (min 32 karakter random)
- [ ] Session expiry dikonfigurasi

### Authorization
- [ ] RBAC diterapkan untuk aksi Admin
- [ ] IDOR prevention (scope query ke user ID)
- [ ] Permission check sebelum aksi sensitif (delete, publish)

### Input & Data
- [ ] Semua input divalidasi dengan Zod
- [ ] Field sensitif tidak di-return ke client
- [ ] File upload divalidasi tipe & ukuran

### Infrastructure
- [ ] Environment variable tidak di-expose ke client
- [ ] Security headers dikonfigurasi
- [ ] Error message tidak bocorkan detail stack trace
- [ ] Log tidak menyimpan data sensitif (password, token)

## Output Format

```
## 🔒 Security Audit: [nama file/endpoint]

### Summary
- Critical: X | High: Y | Medium: Z

---
### [🔴 CRITICAL] Nama Vulnerability
📍 Endpoint/File: ...
⚠️ Risiko: ...
✅ Fix: [kode]

---
### Checklist Status
[x] Auth check ✅
[ ] Input validation ❌
```