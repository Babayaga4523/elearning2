import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  TrendingUp,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  Medal,
  Check,
  Sparkles,
  Download,
} from "lucide-react";
import { getPerformanceData } from "@/actions/performance";
import Link from "next/link";
import { ExportTranscriptButton } from "./_components/ExportTranscriptButton";
import { TrendAreaChart, CompareBarChart } from "./_components/charts";
import { PerformanceClient } from "./_components/PerformanceClient";
import { checkAndUpdateExpiredEnrollments } from "@/actions/enrollment-deadline";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════════════════ */
const t = {
  navy: "#0F1C3F",
  navyMid: "#1A2D5A",
  gold: "#E8A020",
  surface: "#F8F9FB",
  border: "#E4E7EC",
  text: "#101828",
  textSecondary: "#475467",
  textTertiary: "#98A2B3",
  success: { bg: "#ECFDF3", text: "#027A48", border: "#6CE9A6" },
  warning: { bg: "#FFFAEB", text: "#B54708", border: "#FEC84B" },
  info: { bg: "#EFF8FF", text: "#175CD3", border: "#B2DDFF" },
};

const trendChartConfig = {
  score: { label: "Skor", color: "#E8A020" },
};

const compareChartConfig = {
  preScore: { label: "Pre-Test", color: "#B2DDFF" },
  postScore: { label: "Post-Test", color: "#E8A020" },
};

/* ─── Metric Card ────────────────────────────────────────────────────── */
function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  progress,
  progressLabel,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  progress?: number;
  progressLabel?: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-[#E4E7EC] p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-[#98A2B3] uppercase tracking-widest font-['DM_Sans']">
          {label}
        </span>
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            iconBg
          )}
        >
          <Icon size={16} className={iconColor} />
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold text-[#101828] font-['Lexend_Deca'] leading-none tracking-tight tabular-nums">
          {value}
        </span>
        {sub && (
          <span className="text-xs text-[#475467] font-['DM_Sans'] font-medium">
            {sub}
          </span>
        )}
      </div>

      {progress !== undefined && (
        <>
          <div className="h-1.5 bg-[#F1F3F7] rounded-full overflow-hidden mt-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#E8A020] to-[#F5C05A] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {progressLabel && (
            <p className="text-right text-[11px] text-[#98A2B3] mt-1 font-['DM_Sans']">
              {progressLabel}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Section Header ─────────────────────────────────────────────────── */
function SectionHeader({
  title,
  subtitle,
  badge,
  action,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-base font-semibold text-[#101828] font-['Lexend_Deca']">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-[#98A2B3] font-['DM_Sans'] mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="px-2.5 py-1 rounded-full bg-[#F8F9FB] border border-[#E4E7EC] text-[10px] font-bold text-[#475467]">
            {badge}
          </span>
        )}
        {action}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════════ */
export default async function PerformancePage() {
  const session = await auth();
  if (!session?.user?.id) return redirect("/");

  await checkAndUpdateExpiredEnrollments();

  const data = await getPerformanceData();

  if (!data || !data.summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FEF3F2] flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-[#B42318]" />
          </div>
          <p className="text-base font-semibold text-[#101828] font-['DM_Sans']">
            Gagal memuat data performa
          </p>
        </div>
      </div>
    );
  }

  if (data.summary.totalCourses === 0) return <EmptyState />;

  const passRate =
    data.summary.totalTestsTaken > 0
      ? Math.round((data.summary.totalTestsPassed / data.summary.totalTestsTaken) * 100)
      : 0;

  const completionPct =
    data.summary.totalCourses > 0
      ? Math.round(
          (data.summary.completedCourses / data.summary.totalCourses) * 100
        )
      : 0;

  const barData = data.courseAnalysis
    .filter((c: any) => c.preScore !== null || c.postScore !== null)
    .slice(0, 6)
    .map((c: any) => ({
      name:
        c.title.length > 14 ? c.title.slice(0, 14) + "…" : c.title,
      preScore: c.preScore ?? 0,
      postScore: c.postScore ?? 0,
    }));

  return (
    <div
      className="min-h-screen bg-[#F8F9FB] overflow-x-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ═══ Hero Header ════════════════════════════════════════════════ */}
        <header
          className="rounded-2xl overflow-hidden relative"
          style={{
            background: `linear-gradient(135deg, ${t.navy} 0%, ${t.navyMid} 60%, #1e3a5f 100%)`,
          }}
        >
          {/* Ambient glows */}
          <div
            className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-10 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${t.gold} 0%, transparent 70%)`,
            }}
          />
          <div
            className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full opacity-5 pointer-events-none"
            style={{ background: `radial-gradient(circle, #2E90FA 0%, transparent 70%)` }}
          />

          <div className="relative z-10 px-8 py-8 md:px-10 md:py-9 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-semibold uppercase tracking-widest text-white/70 mb-3">
                <Sparkles size={10} />
                Performa Belajar
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white font-['Lexend_Deca'] leading-tight tracking-tight mb-2">
                Analisis Pembelajaran
              </h1>
              <p className="text-sm text-white/60 font-['DM_Sans'] max-w-xl leading-relaxed">
                Lacak kemajuan pembelajaran, analisis hasil ujian, dan temukan area
                untuk peningkatan karir Anda.
              </p>
            </div>
            <div className="shrink-0">
              <ExportTranscriptButton data={data} userName={session.user.name || "Karyawan"} />
            </div>
          </div>
        </header>

        {/* ═══ KPI Grid ════════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            label="Kursus Diikuti"
            value={data.summary.totalCourses}
            icon={BookOpen}
            iconBg="bg-[#EFF8FF]"
            iconColor="text-[#175CD3]"
          />
          <MetricCard
            label="Kursus Selesai"
            value={data.summary.completedCourses}
            icon={CheckCircle2}
            iconBg="bg-[#ECFDF3]"
            iconColor="text-[#027A48]"
            progress={completionPct}
            progressLabel={`${completionPct}% selesai`}
          />
          <MetricCard
            label="Post-Test Diambil"
            value={data.summary.totalTestsTaken}
            sub="ujian"
            icon={ClipboardList}
            iconBg="bg-[#FFFAEB]"
            iconColor="text-[#B54708]"
          />
          <MetricCard
            label="Tingkat Kelulusan"
            value={`${passRate}%`}
            sub={`${data.summary.totalTestsPassed} lulus`}
            icon={Medal}
            iconBg="bg-[#FEF3DC]"
            iconColor="text-[#C4861A]"
          />
        </section>

        {/* ═══ Charts Row ══════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Trend Area Chart */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E4E7EC] flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#101828] font-['Lexend_Deca']">
                  Tren Skor Ujian
                </h3>
                <p className="text-xs text-[#98A2B3] font-['DM_Sans'] mt-0.5">
                  10 percobaan terakhir
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#F8F9FB] border border-[#E4E7EC] text-[11px] font-semibold text-[#475467] font-['DM_Sans']">
                Post-Test
              </span>
            </div>
            <div className="p-5 h-full min-h-[280px]">
              <TrendAreaChart trendData={data.trendData} config={trendChartConfig} />
            </div>
          </div>

          {/* Compare Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E4E7EC]">
              <h3 className="text-base font-semibold text-[#101828] font-['Lexend_Deca']">
                Pre vs Post-Test
              </h3>
              <p className="text-xs text-[#98A2B3] font-['DM_Sans'] mt-0.5">
                Perbandingan skor per kursus
              </p>
            </div>
            <div className="p-5 h-full min-h-[280px] flex items-center">
              <CompareBarChart barData={barData} config={compareChartConfig} />
            </div>
          </div>
        </section>

        {/* ═══ Bottom Row ══════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Analysis */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E4E7EC]">
              <h3 className="text-base font-semibold text-[#101828] font-['Lexend_Deca']">
                Analisis Kompetensi
              </h3>
              <p className="text-xs text-[#98A2B3] font-['DM_Sans'] mt-0.5">
                {data.courseAnalysis.length} kursus
              </p>
            </div>
            <div className="p-4">
              <PerformanceClient courseAnalysis={data.courseAnalysis} />
            </div>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-5">
            {/* Avg Score Card */}
            <div
              className="rounded-2xl p-6 text-center relative overflow-hidden flex flex-col justify-center min-h-[140px]"
              style={{
                background: `linear-gradient(135deg, ${t.navy} 0%, ${t.navyMid} 100%)`,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div
                className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-10 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${t.gold} 0%, transparent 70%)` }}
              />
              <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full opacity-5 pointer-events-none"
                style={{ background: `radial-gradient(circle, #2E90FA 0%, transparent 70%)` }}
              />
              <div className="relative z-10">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-2">
                  Average Score
                </p>
                <h3 className="text-5xl font-bold text-white font-['Lexend_Deca'] leading-none">
                  {data.summary.averageScore}
                  <span className="text-2xl text-white/60 font-medium ml-1">%</span>
                </h3>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden flex-1">
              <div className="px-5 py-4 border-b border-[#E4E7EC]">
                <h3 className="text-base font-semibold text-[#101828] font-['Lexend_Deca']">
                  Aktivitas Terbaru
                </h3>
                <p className="text-xs text-[#98A2B3] font-['DM_Sans'] mt-0.5">
                  Percobaan ujian terakhir
                </p>
              </div>
              <div className="p-5">
                {data.recentActivity.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-[#98A2B3] font-['DM_Sans']">
                      Belum ada aktivitas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.recentActivity.slice(0, 4).map((activity: any) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2",
                            activity.passed
                              ? "bg-[#ECFDF3] border-[#6CE9A6] text-[#027A48]"
                              : "bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]"
                          )}
                        >
                          {activity.passed ? (
                            <Check size={13} />
                          ) : (
                            <AlertCircle size={13} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#101828] leading-tight line-clamp-1">
                            {activity.passed ? "Lulus" : "Gagal"}
                          </p>
                          <p className="text-xs text-[#475467] font-['DM_Sans'] mt-0.5 line-clamp-1">
                            {activity.testTitle} ·{" "}
                            <span className="font-semibold text-[#101828]">
                              {activity.score}%
                            </span>
                          </p>
                          <p className="text-[11px] text-[#98A2B3] font-['DM_Sans'] mt-0.5">
                            {new Date(activity.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ─── Empty State ──────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8F9FB]">
      <div className="max-w-sm w-full">
        <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden text-center">
          <div className="h-1.5 bg-gradient-to-r from-[#0F1C3F] via-[#243868] to-[#E8A020]" />
          <div className="p-10">
            <div className="w-16 h-16 rounded-2xl bg-[#EFF8FF] flex items-center justify-center mx-auto mb-5">
              <TrendingUp size={28} className="text-[#98A2B3]" />
            </div>
            <h2 className="text-xl font-bold text-[#101828] font-['Lexend_Deca'] mb-2">
              Mulai Perjalanan Anda
            </h2>
            <p className="text-sm text-[#475467] font-['DM_Sans'] leading-relaxed mb-6">
              Anda belum mengambil kursus apapun. Selesaikan modul dan ujian untuk
              melihat performa belajar di sini.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E8A020] hover:bg-[#C4861A] text-white text-sm font-semibold rounded-xl font-['DM_Sans'] transition-all shadow-[0_4px_14px_rgba(232,160,32,0.3)]"
            >
              <BookOpen size={15} />
              Jelajahi Katalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}