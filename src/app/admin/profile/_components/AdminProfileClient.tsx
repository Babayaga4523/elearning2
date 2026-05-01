"use client";

import { useState } from "react";
import { Award, BookOpen, Clock, XCircle, Lock, Eye, EyeOff, Shield, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils/date-formatter";
import { toast } from "sonner";

interface AdminProfileClientProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    createdAt: Date;
  };
  stats: {
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    completedEnrollments: number;
  };
}

export function AdminProfileClient({ user, stats }: AdminProfileClientProps) {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completionRate = stats.totalEnrollments > 0 
    ? Math.round((stats.completedEnrollments / stats.totalEnrollments) * 100) 
    : 0;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Password baru dan konfirmasi password tidak cocok");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement admin password change API
      toast.info("Fitur ubah password admin akan segera tersedia");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Profil Admin</h1>
          <p className="text-slate-600 mt-1">Kelola informasi profil dan keamanan akun administrator</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4 ring-4 ring-slate-100">
                    <AvatarImage 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || '?')}&background=0f1c3f&color=E8A020&bold=true&size=256`}
                      alt={user.name || "Admin avatar"}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-[#0F1C3F] to-[#1A3060] text-[#E8A020] text-2xl font-bold">
                      {user.name?.charAt(0)?.toUpperCase() ?? "A"}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold text-slate-900">{user.name || "Admin"}</h2>
                  <p className="text-sm text-slate-600 mt-1">{user.email}</p>
                  <Badge className="mt-3 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role === "ADMIN" ? "Administrator" : user.role === "SUPER_ADMIN" ? "Super Administrator" : user.role}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statistik Sistem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm text-slate-600">Total Karyawan</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">{stats.totalUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-slate-600">Total Kursus</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{stats.totalCourses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-slate-600">Total Enrollment</span>
                  </div>
                  <span className="text-lg font-bold text-amber-600">{stats.totalEnrollments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-slate-600">Selesai</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">{stats.completedEnrollments}</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Tingkat Penyelesaian</span>
                    <span className="text-sm font-bold text-primary">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details & Password */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informasi Akun</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wider">Nama Lengkap</Label>
                    <p className="text-sm font-medium text-slate-900 mt-1">{user.name || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wider">Email</Label>
                    <p className="text-sm font-medium text-slate-900 mt-1">{user.email || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wider">Role</Label>
                    <p className="text-sm font-medium text-slate-900 mt-1">{user.role}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wider">User ID</Label>
                    <p className="text-xs font-mono text-slate-600 mt-1 truncate">{user.id}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-slate-500 uppercase tracking-wider">Bergabung Sejak</Label>
                    <p className="text-sm font-medium text-slate-900 mt-1">{formatDate(user.createdAt, 'long')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Keamanan Akun</CardTitle>
                  {!isChangingPassword && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsChangingPassword(true)}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Ubah Password
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!isChangingPassword ? (
                  <div className="text-sm text-slate-600">
                    <p>Password terakhir diubah: <span className="font-medium">—</span></p>
                    <p className="mt-2 text-xs text-slate-500">
                      Untuk keamanan akun Anda, disarankan untuk mengubah password secara berkala.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Password Saat Ini</Label>
                      <div className="relative mt-1">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="newPassword">Password Baru</Label>
                      <div className="relative mt-1">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={8}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Minimal 8 karakter</p>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={8}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Menyimpan..." : "Simpan Password"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                        disabled={isSubmitting}
                      >
                        Batal
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Info Note */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-800">
                  <strong>💡 Info:</strong> Untuk mengubah informasi akun administrator, 
                  silakan hubungi super administrator atau tim IT.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
