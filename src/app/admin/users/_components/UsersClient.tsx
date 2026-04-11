"use client";

import { useState } from "react";
import {
  Users,
  Search,
  GraduationCap,
  Clock,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
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

const surface = {
  card: {
    background: "white",
    border: "1px solid #E2E6F0",
    boxShadow: "0 1px 4px rgba(15,28,63,0.06)",
  },
  toolbar: {
    background: "white",
    border: "1px solid #E2E6F0",
    boxShadow: "0 1px 4px rgba(15,28,63,0.04)",
  },
  input: {
    background: "#F8FAFC",
    border: "1px solid #E8ECF5",
    color: "#0F1C3F",
  },
};

export function UsersClient({ users, stats }: UsersClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
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
    } catch {
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
      icon: <Users className="h-5 w-5" />,
      iconBg: "#EEF2FF",
      iconColor: "#0F1C3F",
    },
    {
      label: "Sedang Belajar",
      value: stats.activeUsers,
      icon: <Clock className="h-5 w-5" />,
      iconBg: "#EFF6FF",
      iconColor: "#2563EB",
    },
    {
      label: "Pernah Lulus",
      value: stats.graduatedUsers,
      icon: <GraduationCap className="h-5 w-5" />,
      iconBg: "#FFF8E7",
      iconColor: "#E8A020",
    },
  ];

  return (
    <div
      className="w-full min-w-0 space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 md:space-y-8 md:pb-10"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
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

      {/* Header — selaras Katalog / Enrollment */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p
            className="mb-1 text-[10px] font-black uppercase tracking-[0.2em]"
            style={{ color: "#9AAABF" }}
          >
            Manajemen Sumber Daya
          </p>
          <h1
            className="text-2xl font-black tracking-tight md:text-3xl"
            style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
          >
            Manajemen Pengguna
          </h1>
          <p className="mt-0.5 text-sm font-medium" style={{ color: "#7A8599" }}>
            Kelola dan pantau progress seluruh karyawan BNI Finance.
          </p>
        </div>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaryStats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-4 rounded-2xl p-5 transition-all hover:-translate-y-0.5"
            style={surface.card}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: s.iconBg, color: s.iconColor }}
            >
              {s.icon}
            </div>
            <div>
              <p className="mb-1 text-2xl font-black leading-none" style={{ color: "#0F1C3F" }}>
                {s.value}
              </p>
              <p
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: "#9AAABF" }}
              >
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div
        className="flex flex-col items-stretch gap-3 rounded-2xl p-3 sm:flex-row sm:items-center"
        style={surface.toolbar}
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "#B0BAD0" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, NIP, departemen, atau lokasi..."
            className="h-10 w-full rounded-xl pl-10 pr-4 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-[#0F1C3F]/15"
            style={surface.input}
          />
        </div>
        <div
          className="shrink-0 rounded-xl px-3 py-2 text-center text-[11px] font-black uppercase tracking-wider sm:text-left"
          style={{ background: "#F0F2F7", color: "#9AAABF" }}
        >
          {filteredUsers.length} karyawan
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-2xl" style={surface.card}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: "linear-gradient(135deg, #0F1C3F, #1A3060)",
              boxShadow: "0 2px 8px rgba(15,28,63,0.2)",
            }}
          >
            <Users className="h-4 w-4" style={{ color: "#E8A020" }} />
          </div>
          <div>
            <h2
              className="text-base font-black tracking-tight"
              style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
            >
              Daftar Karyawan
            </h2>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Ringkasan enrollment & status belajar
            </p>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="rounded-full p-5" style={{ background: "#F0F2F7" }}>
              <Users className="h-8 w-8" style={{ color: "#C5CEDF" }} />
            </div>
            <div>
              <p className="font-bold text-slate-600">Tidak ada karyawan yang cocok.</p>
              <p className="mt-1 text-sm text-slate-400">Ubah kata kunci pencarian atau kosongkan filter.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3.5 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                    Karyawan
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                    NIP
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                    Departemen
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                    Lokasi
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                    Diikuti
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                    Lulus
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const isActive = user.inProgressEnrollments > 0;
                  return (
                    <tr key={user.id} className="group transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black transition-colors"
                            style={{
                              background: "#F0F2F7",
                              color: "#7A8599",
                            }}
                          >
                            {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold leading-tight text-slate-800">{user.name ?? "-"}</p>
                            <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-700">
                        {user.nip ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-slate-600">
                        {user.department ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="text-nowrap px-4 py-4 text-xs font-semibold text-slate-600">
                        {user.lokasi ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-black text-slate-800">{user.totalEnrollments}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-black text-emerald-600">{user.completedEnrollments}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {user.totalEnrollments === 0 ? (
                          <Badge
                            variant="outline"
                            className="border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-500"
                          >
                            Belum mulai
                          </Badge>
                        ) : isActive ? (
                          <Badge className="border-0 bg-blue-50 text-[10px] font-black uppercase tracking-wide text-blue-700">
                            Aktif belajar
                          </Badge>
                        ) : (
                          <Badge className="border-0 bg-emerald-50 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                            Lulus
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-slate-400 hover:bg-[#EEF2FF] hover:text-[#0F1C3F]"
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            title="Lihat detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-slate-400 hover:bg-[#FFF8E7] hover:text-[#C28700]"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditModalOpen(true);
                            }}
                            title="Edit profil"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isDeleting === user.id}
                            className={cn(
                              "h-9 w-9 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600",
                              isDeleting === user.id && "opacity-50"
                            )}
                            onClick={() => {
                              setUserToDelete(user.id);
                              setShowConfirm(true);
                            }}
                            title="Hapus karyawan"
                          >
                            <Trash2 className={cn("h-4 w-4", isDeleting === user.id && "animate-pulse")} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
