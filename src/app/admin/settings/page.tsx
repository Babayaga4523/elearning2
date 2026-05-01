import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Settings, User, Bell, Shield, Database, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Pengaturan Sistem | Admin BNI Finance E-Learning",
};

export default async function AdminSettingsPage() {
  const session = await auth();

  const [userCount, courseCount, moduleCount, enrollmentCount] = await Promise.all([
    db.user.count(),
    db.course.count(),
    db.module.count(),
    db.enrollment.count(),
  ]);

  return (
    <div className="w-full min-w-0 space-y-5 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem</h1>
        <p className="text-slate-500 text-sm font-medium mt-0.5">Informasi sistem dan konfigurasi platform BNI Finance E-Learning.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Admin Profile */}
        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="border-b border-slate-100 py-3 px-5">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-sm font-bold text-slate-800">Profil Administrator</CardTitle>
            </div>
            <CardDescription className="text-[11px]">Informasi akun yang sedang aktif.</CardDescription>
          </CardHeader>
          <CardContent className="py-4 px-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xl text-primary">
                {session?.user?.name?.charAt(0)?.toUpperCase() ?? "A"}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-base">{session?.user?.name}</p>
                <p className="text-slate-500 text-xs">{session?.user?.email}</p>
                <Badge className="mt-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-50 text-[10px] font-bold h-5 px-2">
                  ADMINISTRATOR
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Stats */}
        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="border-b border-slate-100 py-3 px-5">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-sm font-bold text-slate-800">Statistik Database</CardTitle>
            </div>
            <CardDescription className="text-[11px]">Ringkasan data yang tersimpan di sistem.</CardDescription>
          </CardHeader>
          <CardContent className="py-4 px-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Total Pengguna", value: userCount, color: "text-indigo-600" },
                { label: "Total Kursus", value: courseCount, color: "text-blue-600" },
                { label: "Total Modul", value: moduleCount, color: "text-amber-600" },
                { label: "Total Enrollment", value: enrollmentCount, color: "text-emerald-600" },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-50 rounded-lg p-3">
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Info */}
        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="border-b border-slate-100 py-3 px-5">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-sm font-bold text-slate-800">Informasi Platform</CardTitle>
            </div>
            <CardDescription className="text-[11px]">Versi dan konfigurasi teknis sistem.</CardDescription>
          </CardHeader>
          <CardContent className="py-4 px-5">
            <div className="space-y-3">
              {[
                { label: "Framework", value: "Next.js 14 (App Router)" },
                { label: "Database", value: "PostgreSQL + Prisma ORM" },
                { label: "Authentication", value: "NextAuth.js v5 Beta" },
                { label: "Environment", value: process.env.NODE_ENV === "production" ? "Production" : "Development" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-500 font-medium">{item.label}</span>
                  <Badge variant="outline" className="text-xs font-semibold text-slate-700 border-slate-200">
                    {item.value}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="border-b border-slate-100 py-3 px-5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-sm font-bold text-slate-800">Keamanan</CardTitle>
            </div>
            <CardDescription className="text-[11px]">Status konfigurasi keamanan platform.</CardDescription>
          </CardHeader>
          <CardContent className="py-4 px-5">
            <div className="space-y-3">
              {[
                { label: "JWT Session Strategy", status: "Aktif" },
                { label: "Role-Based Access Control", status: "Aktif" },
                { label: "Password Hashing (bcrypt)", status: "Aktif" },
                { label: "Middleware Auth Guard", status: "Aktif" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-500 font-medium">{item.label}</span>
                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[10px] font-bold h-5 px-2">
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
