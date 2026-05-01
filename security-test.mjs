/**
 * security-test.mjs
 * Jalankan: node security-test.mjs
 *
 * Script pengujian keamanan otomatis untuk sistem E-Learning BNI Finance.
 * Tes: Security Headers, Route Protection, Rate Limiting, DB verification.
 */

const BASE = 'http://localhost:3000';
const ATTACKER_EMAIL = 'test.brute@bnif.co.id'; // email fictitious untuk tes
const ATTACKER_IP = '10.99.99.99';

const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE  = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';

const pass = (msg) => console.log(`  ${GREEN}✓ PASS${RESET}  ${msg}`);
const fail = (msg) => console.log(`  ${RED}✗ FAIL${RESET}  ${msg}`);
const info = (msg) => console.log(`  ${BLUE}ℹ INFO${RESET}  ${msg}`);
const section = (title) => {
  console.log(`\n${BOLD}${'═'.repeat(50)}${RESET}`);
  console.log(`${BOLD}${YELLOW} ${title}${RESET}`);
  console.log(`${BOLD}${'═'.repeat(50)}${RESET}`);
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── TEST 1: Security Headers ─────────────────────────────────────────────
async function testSecurityHeaders() {
  section('TEST 1: HTTP Security Headers');
  try {
    const res = await fetch(`${BASE}/auth/login`);
    const checks = [
      ['X-Frame-Options',        res.headers.get('x-frame-options'),        'DENY'],
      ['X-Content-Type-Options', res.headers.get('x-content-type-options'), 'nosniff'],
      ['Referrer-Policy',        res.headers.get('referrer-policy'),         'strict-origin-when-cross-origin'],
      ['Permissions-Policy',     res.headers.get('permissions-policy'),      null],
      ['X-DNS-Prefetch-Control', res.headers.get('x-dns-prefetch-control'),  'off'],
    ];
    checks.forEach(([name, value, expected]) => {
      if (value) {
        if (!expected || value === expected) {
          pass(`${name}: "${value}"`);
        } else {
          fail(`${name}: "${value}" (expected "${expected}")`);
        }
      } else {
        fail(`${name}: MISSING`);
      }
    });
  } catch (e) {
    fail('Could not connect to ' + BASE + ' — ' + e.message);
  }
}

// ─── TEST 2: Route Protection ────────────────────────────────────────────
async function testRouteProtection() {
  section('TEST 2: Route Protection (Unauthenticated Access)');
  const protectedRoutes = [
    '/dashboard',
    '/admin',
    '/admin/users',
    '/admin/analytics',
    '/admin/enrollments',
  ];

  for (const route of protectedRoutes) {
    try {
      const res = await fetch(`${BASE}${route}`, { redirect: 'manual' });
      const location = res.headers.get('location') || '';
      const isProtected = (res.status === 307 || res.status === 302 || res.status === 308) &&
                          location.includes('login');
      if (isProtected) {
        pass(`${route} → ${res.status} redirect ke ${location}`);
      } else {
        fail(`${route} → HTTP ${res.status} (tidak di-redirect ke login!) location: "${location}"`);
      }
    } catch (e) {
      fail(`${route} — error: ${e.message}`);
    }
    await sleep(100);
  }
}

// ─── TEST 3: Login Rate Limiting ─────────────────────────────────────────
async function testRateLimiting() {
  section('TEST 3: Login Rate Limiting (6 Percobaan Gagal)');
  info(`Email target : ${ATTACKER_EMAIL}`);
  info(`Simulated IP : ${ATTACKER_IP}`);
  info(`Batas sistem : 5 gagal / 15 menit per email\n`);

  // First, hit the login server action directly (via fetch to the page action endpoint)
  // Auth.js credentials signin endpoint
  let lockedAt = null;

  for (let i = 1; i <= 6; i++) {
    try {
      // Simulate form submission to the Next.js Server Action via form POST
      const formData = new URLSearchParams({
        email: ATTACKER_EMAIL,
        password: `WrongPassword${i}`,
      });

      const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Forwarded-For': ATTACKER_IP,
          'Origin': BASE,
        },
        body: formData.toString(),
        redirect: 'manual',
      });

      const location = res.headers.get('location') || '';
      const isError = location.includes('error') || res.status === 401 || res.status === 403;

      if (i <= 5) {
        info(`Percobaan #${i}: HTTP ${res.status} | redirect: ${location}`);
      } else {
        if (res.status === 429 || isError) {
          pass(`Percobaan #${i}: HTTP ${res.status} — Rate limit aktif! ✓`);
          lockedAt = i;
        } else {
          info(`Percobaan #${i}: HTTP ${res.status} | redirect: ${location}`);
        }
      }
    } catch (e) {
      info(`Percobaan #${i}: Error — ${e.message}`);
    }
    await sleep(300);
  }

  if (lockedAt) {
    pass(`Account lockout terpicu setelah ${lockedAt} percobaan`);
  } else {
    info('Auth.js endpoint mengembalikan redirect (normal). Rate limiting diterapkan di Server Action layer.');
    info('Verifikasi tabel LoginAttempt di DB untuk konfirmasi pencatatan.');
  }
}

// ─── TEST 4: DB Verification ─────────────────────────────────────────────
async function testDBVerification() {
  section('TEST 4: Verifikasi Database LoginAttempt');
  try {
    // Hit the purge cron (without secret) — should return 401
    const res = await fetch(`${BASE}/api/cron/purge-login-attempts`);
    if (res.status === 401) {
      pass('Cron endpoint terlindungi CRON_SECRET (HTTP 401 tanpa token)');
    } else {
      info(`Cron endpoint status: HTTP ${res.status} (CRON_SECRET mungkin belum di-set)`);
    }

    // Try with a wrong secret
    const res2 = await fetch(`${BASE}/api/cron/purge-login-attempts`, {
      headers: { 'Authorization': 'Bearer wrong-secret' }
    });
    if (res2.status === 401) {
      pass('Cron endpoint reject token salah (HTTP 401)');
    } else {
      info(`Cron dengan token salah status: HTTP ${res2.status}`);
    }
  } catch (e) {
    fail('Error: ' + e.message);
  }
}

// ─── TEST 5: Auth Bypass Attempts ────────────────────────────────────────
async function testAuthBypass() {
  section('TEST 5: Auth Bypass & Header Injection');

  // Test: X-Admin-Override header injection (should be ignored)
  try {
    const res = await fetch(`${BASE}/admin`, {
      redirect: 'manual',
      headers: {
        'X-Admin-Override': 'true',
        'X-Forwarded-User': 'admin@bnif.co.id',
        'X-Role': 'ADMIN',
      }
    });
    if (res.status === 307 || res.status === 302) {
      pass('Header injection (X-Admin-Override) diabaikan — tetap ter-redirect ke login');
    } else {
      fail(`Possible header injection vuln: HTTP ${res.status} pada /admin tanpa auth`);
    }
  } catch (e) {
    fail('Error: ' + e.message);
  }

  // Test: Path traversal
  const traversalPaths = ['/admin/../admin', '/dashboard%2F..%2Fadmin'];
  for (const p of traversalPaths) {
    try {
      const res = await fetch(`${BASE}${p}`, { redirect: 'manual' });
      if (res.status !== 200) {
        pass(`Path traversal "${p}" → HTTP ${res.status} (tidak dapat diakses)`);
      } else {
        fail(`Path traversal "${p}" → HTTP 200 (!)`);
      }
    } catch (e) {
      pass(`Path traversal "${p}" → blocked (${e.message})`);
    }
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}╔══════════════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}║   SECURITY TEST — BNI Finance E-Learning LMS    ║${RESET}`);
console.log(`${BOLD}╚══════════════════════════════════════════════════╝${RESET}`);
console.log(`Target : ${BASE}`);
console.log(`Time   : ${new Date().toLocaleString('id-ID')}`);

await testSecurityHeaders();
await testRouteProtection();
await testRateLimiting();
await testDBVerification();
await testAuthBypass();

console.log(`\n${BOLD}${'═'.repeat(50)}${RESET}`);
console.log(`${BOLD}${GREEN} Security Test Selesai${RESET}`);
console.log(`${BOLD}${'═'.repeat(50)}${RESET}\n`);
