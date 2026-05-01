# Chart Components Guide - BNIF LMS

## Overview
Semua chart components di aplikasi ini sekarang menggunakan **shadcn/ui Chart** yang merupakan wrapper untuk **Recharts**. Ini memastikan konsistensi design system dan theming otomatis.

## Komponen Chart yang Tersedia

### 1. ActivityChart
**Lokasi:** `src/app/(karyawan)/dashboard/_components/ActivityChart.tsx`

**Digunakan di:**
- Dashboard Karyawan
- Performance Analysis

**Features:**
- Bar chart untuk aktivitas 7 hari terakhir
- Statistik: total modul, rata-rata per hari
- Highlight hari paling produktif
- Gradient bars dengan theming CSS variables
- Responsive tooltip

**Props:**
```typescript
interface ActivityChartProps {
  data: { day: string; count: number }[];
}
```

**Contoh Penggunaan:**
```tsx
import ActivityChart from "@/app/(karyawan)/dashboard/_components/ActivityChart";

const activityData = [
  { day: "Sen", count: 3 },
  { day: "Sel", count: 5 },
  { day: "Rab", count: 2 },
  // ...
];

<ActivityChart data={activityData} />
```

### 2. Leaderboard
**Lokasi:** `src/app/(karyawan)/dashboard/_components/Leaderboard.tsx`

**Features:**
- Top 5 performers
- Rank badges dengan warna berbeda (Gold, Silver, Bronze)
- Highlight untuk current user
- Trophy icons untuk top 3
- Responsive layout

**Props:**
```typescript
interface LeaderboardProps {
  data: {
    rank: number;
    name: string;
    department: string;
    score: number;
    isCurrentUser: boolean;
  }[];
}
```

### 3. Performance Charts
**Lokasi:** `src/app/(karyawan)/performance/_components/charts.tsx`

**Components:**
- `TrendAreaChart` - Area chart untuk trend skor
- `CompareBarChart` - Bar chart untuk perbandingan pre/post test

## Best Practices

### 1. Selalu Gunakan ChartContainer
```tsx
import { ChartContainer } from "@/components/ui/chart";

<ChartContainer config={chartConfig} className="h-[240px] w-full">
  <BarChart data={data}>
    {/* chart content */}
  </BarChart>
</ChartContainer>
```

### 2. Definisikan ChartConfig
```tsx
import type { ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  score: {
    label: "Skor",
    color: "hsl(var(--chart-1))",
  },
  average: {
    label: "Rata-rata",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;
```

### 3. Gunakan CSS Variables untuk Warna
```tsx
// ✅ BENAR - Menggunakan CSS variables
fill="hsl(var(--chart-1))"
stroke="hsl(var(--border))"

// ❌ SALAH - Hardcoded colors
fill="#6366F1"
stroke="#E2E8F0"
```

### 4. Gunakan ChartTooltip dengan ChartTooltipContent
```tsx
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

<ChartTooltip 
  content={<ChartTooltipContent indicator="dot" />}
  cursor={{ fill: "hsl(var(--muted))", opacity: 0.15 }}
/>
```

### 5. Wrap dengan Card Component
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card className="bg-white shadow-sm border-slate-200">
  <CardHeader>
    <CardTitle>Chart Title</CardTitle>
  </CardHeader>
  <CardContent>
    <ChartContainer config={chartConfig}>
      {/* chart */}
    </ChartContainer>
  </CardContent>
</Card>
```

## CSS Variables untuk Charts

Didefinisikan di `src/app/globals.css`:

```css
:root {
  --chart-1: 219 67% 16%;  /* Navy Blue */
  --chart-2: 36 77% 51%;   /* Gold */
  --chart-3: 199 89% 48%;  /* Cyan */
}

.dark {
  --chart-1: 222 62% 15%;
  --chart-2: 39 84% 52%;
  --chart-3: 199 89% 48%;
}
```

## Theming

Semua chart components otomatis support light/dark mode karena menggunakan CSS variables. Tidak perlu konfigurasi tambahan.

## Responsive Design

Semua chart components sudah responsive dengan:
- `ChartContainer` menggunakan `ResponsiveContainer` dari Recharts
- Breakpoints yang konsisten dengan Tailwind CSS
- Font sizes yang scalable

## Accessibility

- Semua chart menggunakan semantic HTML
- Tooltip accessible dengan keyboard navigation
- Color contrast yang memenuhi WCAG standards
- Labels yang descriptive

## Performance Tips

1. **Memoize data transformations:**
```tsx
const chartData = useMemo(() => 
  rawData.map(item => ({ ...item })), 
  [rawData]
);
```

2. **Limit data points:**
```tsx
// Untuk activity chart, limit ke 7 hari
const last7Days = data.slice(-7);
```

3. **Use loading states:**
```tsx
{isLoading ? <ChartSkeleton /> : <ActivityChart data={data} />}
```

## Troubleshooting

### Chart tidak muncul
- Pastikan data tidak kosong
- Check console untuk errors
- Verify ChartConfig sudah benar

### Warna tidak sesuai
- Pastikan menggunakan CSS variables
- Check globals.css untuk definisi warna
- Verify tidak ada hardcoded colors

### Tooltip tidak muncul
- Pastikan menggunakan ChartTooltip dan ChartTooltipContent
- Check z-index conflicts
- Verify data format sesuai dengan dataKey

## Resources

- [Recharts Documentation](https://recharts.org/)
- [shadcn/ui Chart Documentation](https://ui.shadcn.com/docs/components/chart)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
