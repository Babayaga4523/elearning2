"use client";

import { useState } from "react";
import { 
  Users, 
  Search, 
  GraduationCap, 
  CheckCircle, 
  Clock, 
  Eye,
  Pencil,
  Trash2,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { UserEditModal } from "./UserEditModal";
import { deleteUser } from "../actions";

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  department: string | null;
  nip: string | null;
  lokasi: string | null;
  totalEnrollments: number;
  completedEnrollments: number;
  inProgressEnrollments: number;
}

interface UsersClientProps {
  users: UserRow[];
  stats: {
    totalUsers: number;
    activeUsers: number;
    graduatedUsers: number;
  };
}

export function UsersClient({ users, stats }: UsersClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const filteredUsers = users.filter((u) => {
    const searchLower = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower) ||
      u.nip?.toLowerCase().includes(searchLower) ||
      u.department?.toLowerCase().includes(searchLower) ||
      u.lokasi?.toLowerCase().includes(searchLower)
    );
  });

  const onConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      setIsDeleting(userToDelete);
      const result = await deleteUser(userToDelete);
      
      if (result.success) {
        toast.success("Karyawan berhasil dihapus secara permanen.");
        router.refresh();
      } else {
        toast.error(result.error || "Gagal menghapus karyawan.");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem saat menghapus karyawan.");
    } finally {
      setIsDeleting(null);
      setShowConfirm(false);
      setUserToDelete(null);
    }
  };

  const summaryStats = [
    {
      label: "Total Karyawan",
      value: stats.totalUsers,
      icon: Users,
      bg: "bg-indigo-100",
      text: "text-indigo-600"
    },
    {
      label: "Sedang Belajar",
      value: stats.activeUsers,
      icon: Clock,
      bg: "bg-emerald-100",
      text: "text-emerald-600"
    },
    {
      label: "Pernah Lulus",
      value: stats.graduatedUsers,
      icon: GraduationCap,
      bg: "bg-amber-100",
      text: "text-amber-600"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={onConfirmDelete}
        title="Hapus Karyawan?"
        description="Aksi ini akan menghapus akun karyawan secara permanen beserta seluruh progress belajar dan nilai kursus. Aksi ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus Permanen"
        cancelLabel="Batal"
      />

      <UserEditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUser}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Pengguna</h1>
          <p className="text-slate-500 font-medium mt-1">Kelola dan pantau progress seluruh karyawan BNI Finance.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryStats.map((s) => (
          <Card key={s.label} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", s.bg)}>
                <s.icon className={cn("h-6 w-6", s.text)} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500 font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, NIP, departemen, atau lokasi..."
            className="w-full pl-11 pr-4 h-11 bg-slate-50 border-none rounded-xl text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="text-xs font-bold text-slate-400 shrink-0 px-2">
          {filteredUsers.length} Karyawan
        </div>
      </div>

      {/* Users Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg font-black text-slate-800 tracking-tight">Daftar Karyawan</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="p-16 text-center text-slate-300 italic font-medium">
              Data karyawan tidak ditemukan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="text-left px-6 py-4 font-black text-[11px] text-slate-400 uppercase tracking-wider">Karyawan</th>
                    <th className="text-left px-6 py-4 font-black text-[11px] text-slate-400 uppercase tracking-wider">NIP</th>
                    <th className="text-left px-6 py-4 font-black text-[11px] text-slate-400 uppercase tracking-wider">Departemen</th>
                    <th className="text-left px-6 py-4 font-black text-[11px] text-slate-400 uppercase tracking-wider">Lokasi</th>
                    <th className="text-center px-6 py-4 font-black text-[11px] text-slate-400 uppercase tracking-wider">Diikuti</th>
                    <th className="text-center px-6 py-4 font-black text-[11px] text-slate-400 uppercase tracking-wider">Lulus</th>
                    <th className="text-center px-6 py-4 font-black text-[11px] text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-center px-6 py-4 font-black text-[11px] text-slate-400 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map((user) => {
                    const isActive = user.inProgressEnrollments > 0;
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-all shrink-0">
                              {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 leading-tight">{user.name ?? "-"}</p>
                              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {user.nip ?? <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-semibold text-xs">
                          {user.department ?? <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-semibold text-xs text-nowrap">
                          {user.lokasi ?? <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-black text-slate-700">{user.totalEnrollments}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                             <span className="font-black text-emerald-600">{user.completedEnrollments}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {user.totalEnrollments === 0 ? (
                            <Badge variant="outline" className="text-slate-400 border-slate-100 bg-slate-50 text-[10px] font-bold uppercase">
                              Belum Mulai
                            </Badge>
                          ) : isActive ? (
                            <Badge className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                              Aktif Belajar
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                              Lulus
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => router.push(`/admin/users/${user.id}`)}
                              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                              title="Lihat Detail"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditModalOpen(true);
                              }}
                              className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all shadow-sm"
                              title="Edit Profil"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setUserToDelete(user.id);
                                setShowConfirm(true);
                              }}
                              disabled={isDeleting === user.id}
                              className={cn(
                                "p-2 rounded-xl transition-all shadow-sm",
                                isDeleting === user.id 
                                  ? "opacity-50 cursor-not-allowed" 
                                  : "text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                              )}
                              title="Hapus Karyawan"
                            >
                              <Trash2 className={cn("h-4 w-4", isDeleting === user.id && "animate-pulse")} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
