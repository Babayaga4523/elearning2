/**
 * Chart Components Usage Examples
 * 
 * File ini menunjukkan cara menggunakan chart components yang sudah direfactor
 * dengan shadcn/ui di BNIF LMS.
 */

import ActivityChart from "@/app/(karyawan)/dashboard/_components/ActivityChart";
import Leaderboard from "@/app/(karyawan)/dashboard/_components/Leaderboard";

// ============================================================================
// Example 1: ActivityChart dengan data lengkap
// ============================================================================

export function ActivityChartExample() {
  const activityData = [
    { day: "Sen", count: 3 },
    { day: "Sel", count: 5 },
    { day: "Rab", count: 2 },
    { day: "Kam", count: 8 },
    { day: "Jum", count: 4 },
    { day: "Sab", count: 1 },
    { day: "Min", count: 0 },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ActivityChart data={activityData} />
    </div>
  );
}

// ============================================================================
// Example 2: ActivityChart dengan data kosong
// ============================================================================

export function ActivityChartEmptyExample() {
  const emptyData = [
    { day: "Sen", count: 0 },
    { day: "Sel", count: 0 },
    { day: "Rab", count: 0 },
    { day: "Kam", count: 0 },
    { day: "Jum", count: 0 },
    { day: "Sab", count: 0 },
    { day: "Min", count: 0 },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ActivityChart data={emptyData} />
    </div>
  );
}

// ============================================================================
// Example 3: Leaderboard dengan current user
// ============================================================================

export function LeaderboardExample() {
  const leaderboardData = [
    {
      rank: 1,
      name: "Budi Santoso",
      department: "IT Infrastructure",
      score: 1250,
      isCurrentUser: false,
    },
    {
      rank: 2,
      name: "Siti Aminah",
      department: "Finance & Accounting",
      score: 1180,
      isCurrentUser: false,
    },
    {
      rank: 3,
      name: "Yoga Utama",
      department: "Credit Operations",
      score: 1050,
      isCurrentUser: true, // Current user di rank 3
    },
    {
      rank: 4,
      name: "Andi Pratama",
      department: "Marketing",
      score: 980,
      isCurrentUser: false,
    },
    {
      rank: 5,
      name: "Dewi Kusuma",
      department: "Human Resources",
      score: 920,
      isCurrentUser: false,
    },
  ];

  return (
    <div className="max-w-md mx-auto p-6">
      <Leaderboard data={leaderboardData} />
    </div>
  );
}

// ============================================================================
// Example 4: Leaderboard kosong
// ============================================================================

export function LeaderboardEmptyExample() {
  return (
    <div className="max-w-md mx-auto p-6">
      <Leaderboard data={[]} />
    </div>
  );
}

// ============================================================================
// Example 5: Dashboard Layout dengan kedua chart
// ============================================================================

export function DashboardChartsExample() {
  const activityData = [
    { day: "Sen", count: 3 },
    { day: "Sel", count: 5 },
    { day: "Rab", count: 2 },
    { day: "Kam", count: 8 },
    { day: "Jum", count: 4 },
    { day: "Sab", count: 1 },
    { day: "Min", count: 0 },
  ];

  const leaderboardData = [
    {
      rank: 1,
      name: "Budi Santoso",
      department: "IT Infrastructure",
      score: 1250,
      isCurrentUser: false,
    },
    {
      rank: 2,
      name: "Siti Aminah",
      department: "Finance & Accounting",
      score: 1180,
      isCurrentUser: false,
    },
    {
      rank: 3,
      name: "Yoga Utama",
      department: "Credit Operations",
      score: 1050,
      isCurrentUser: true,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActivityChart data={activityData} />
        <Leaderboard data={leaderboardData} />
      </div>
    </div>
  );
}

// ============================================================================
// Example 6: Custom ChartConfig untuk chart baru
// ============================================================================

import { ChartConfig } from "@/components/ui/chart";

export const customChartConfig = {
  completed: {
    label: "Selesai",
    color: "hsl(var(--chart-1))",
  },
  inProgress: {
    label: "Sedang Berjalan",
    color: "hsl(var(--chart-2))",
  },
  pending: {
    label: "Menunggu",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

// ============================================================================
// Example 7: Responsive Grid Layout
// ============================================================================

export function ResponsiveChartsExample() {
  const activityData = [
    { day: "Sen", count: 3 },
    { day: "Sel", count: 5 },
    { day: "Rab", count: 2 },
    { day: "Kam", count: 8 },
    { day: "Jum", count: 4 },
    { day: "Sab", count: 1 },
    { day: "Min", count: 0 },
  ];

  const leaderboardData = [
    {
      rank: 1,
      name: "Budi Santoso",
      department: "IT Infrastructure",
      score: 1250,
      isCurrentUser: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Mobile: Stack vertically */}
        {/* Tablet: 1 column */}
        {/* Desktop: 2 columns */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ActivityChart data={activityData} />
          <Leaderboard data={leaderboardData} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Tips & Best Practices
// ============================================================================

/**
 * 1. SELALU gunakan ChartContainer untuk wrapping Recharts components
 * 2. DEFINISIKAN ChartConfig dengan type-safe menggunakan 'satisfies ChartConfig'
 * 3. GUNAKAN CSS variables untuk colors (hsl(var(--chart-1)))
 * 4. WRAP chart dengan Card component untuk konsistensi UI
 * 5. TAMBAHKAN loading states dan error handling
 * 6. MEMOIZE data transformations untuk performance
 * 7. LIMIT data points untuk chart yang besar
 * 8. GUNAKAN responsive classes (grid-cols-1 xl:grid-cols-2)
 */

/**
 * Common Pitfalls to Avoid:
 * 
 * ❌ Hardcoded colors: fill="#6366F1"
 * ✅ CSS variables: fill="hsl(var(--chart-1))"
 * 
 * ❌ Inline styles tanpa Card wrapper
 * ✅ Menggunakan Card, CardHeader, CardContent
 * 
 * ❌ Tidak handle empty state
 * ✅ Tampilkan message atau skeleton untuk empty data
 * 
 * ❌ Fixed height tanpa responsive
 * ✅ Gunakan className="h-[240px] w-full" di ChartContainer
 */
