"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Users,
  Search,
  GraduationCap,
  Clock,
  Eye,
  Pencil,
  Trash2,
  Mail,
  Building2,
  MapPin,
  Fingerprint,
  BookOpen,
  Trophy,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { UserEditModal } from "./UserEditModal";
import { deleteUser } from "../actions";
import { Pagination } from "@/components/admin/Pagination";
import { UserRole } from "@/generated/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/ui/page-header";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { EmptyState } from "@/components/admin/ui/empty-state";

const ITEMS_PER_PAGE = 15;

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  department: string | null;
  nip: string | null;
  lokasi: string | null;
  role?: UserRole;
  roles?: UserRole[];
  totalEnrollments: number;
  completedEnrollments: number;
  inProgressEnrollments: number;
  lockedAt?: Date | null;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);
  const [optimisticUsers, setOptimisticUsers] = useState<UserRow[]>(users);

  // Sync optimistic state with server state
  useEffect(() => {
    setOptimisticUsers(users);
  }, [users]);

  const filteredUsers = optimisticUsers.filter((u) => {
    const searchLower = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower) ||
      u.nip?.toLowerCase().includes(searchLower) ||
      u.department?.toLowerCase().includes(searchLower) ||
      u.lokasi?.toLowerCase().includes(searchLower)
    );
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const onConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(userToDelete);
      
      // Optimistic update: Remove user from UI immediately
      const previousUsers = optimisticUsers;
      setOptimisticUsers(prev => prev.filter(u => u.id !== userToDelete));

      const result = await deleteUser(userToDelete);

      if (result.success) {
        toast.success("Karyawan berhasil dihapus secara permanen.");
        router.refresh();
      } else {
        // Rollback on error
        setOptimisticUsers(previousUsers);
        toast.error(result.error || "Gagal menghapus karyawan.");
      }
    } catch {
      // Rollback on exception
      setOptimisticUsers(users);
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
      bg: "bg-blue-50 text-blue-600",
    },
    {
      label: "Sedang Belajar",
      value: stats.activeUsers,
      icon: Clock,
      bg: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Pernah Lulus",
      value: stats.graduatedUsers,
      icon: GraduationCap,
      bg: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-700">
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={onConfirmDelete}
        title="Hapus Karyawan?"
        description="Aksi ini akan menghapus akun karyawan secara permanen beserta seluruh progress belajar."
        confirmLabel="Ya, Hapus Permanen"
        cancelLabel="Batal"
      />

      <UserEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUser}
      />

      <PageHeader 
        title="Manajemen Karyawan"
        description="Pantau dan kelola seluruh akun karyawan BNI Finance."
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {summaryStats.map((s) => (
          <div key={s.label} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", s.bg)}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-base font-black text-[#0F1C3F] leading-none">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Cari nama, NIP, atau departemen..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-9 rounded-lg bg-slate-50 border-none text-sm focus-visible:ring-[#0F1C3F]/10"
          />
        </div>
        <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-500 whitespace-nowrap self-center">
          {filteredUsers.length} karyawan
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <Table className="w-full">
          <TableHeader className="bg-slate-50/70">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-4">Karyawan</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Identitas</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Unit Kerja</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Enrolled</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Lulus</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Status</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400 pr-4">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                   <EmptyState 
                    title="Karyawan Tidak Ditemukan"
                    description="Gunakan kata kunci pencarian yang berbeda untuk menemukan profil karyawan."
                    action={<Button variant="outline" onClick={() => setSearch("")}>Reset Pencarian</Button>}
                   />
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => {
                const isActive = user.inProgressEnrollments > 0;
                return (
                  <TableRow key={user.id} className="group transition-all hover:bg-slate-50/50 cursor-pointer h-16" onClick={() => setDetailUser(user)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-100">
                          <AvatarImage 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || '?')}&background=6366f1&color=fff&bold=true`} 
                            alt={user.name || "User avatar"}
                            loading="lazy"
                          />
                          <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-xs">
                             {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-[#0F1C3F] truncate">{user.name ?? "-"}</span>
                            {user.lockedAt && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-100 text-red-700">TERKUNCI</span>
                            )}
                          </div>
                          <span className="text-[10px] font-medium text-slate-400 truncate">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[11px] font-bold text-slate-700">
                       <div className="flex flex-col">
                          <span>{user.nip ?? "—"}</span>
                          <span className="text-[9px] text-slate-400 font-medium">NIP</span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col">
                         <span className="text-[11px] font-bold text-slate-700 truncate max-w-[150px]">{user.department ?? "—"}</span>
                         <span className="text-[10px] text-slate-400 font-medium">{user.lokasi ?? "—"}</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-center text-xs font-bold text-slate-900">{user.totalEnrollments}</TableCell>
                    <TableCell className="text-center text-xs font-bold text-emerald-600">{user.completedEnrollments}</TableCell>
                    <TableCell className="text-center">
                       {user.totalEnrollments === 0 ? (
                         <StatusBadge status="PENDING" />
                       ) : isActive ? (
                         <StatusBadge status="IN_PROGRESS" />
                       ) : (
                         <StatusBadge status="COMPLETED" />
                       )}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                       <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md bg-slate-50 hover:bg-indigo-100 hover:text-indigo-600 text-slate-500" onClick={() => router.push(`/admin/users/${user.id}`)}>
                             <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md bg-slate-50 hover:bg-amber-100 hover:text-amber-600 text-slate-500" onClick={() => { setSelectedUser(user); setIsEditModalOpen(true); }}>
                             <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md bg-slate-50 hover:bg-rose-100 hover:text-rose-600 text-slate-500" onClick={() => { setUserToDelete(user.id); setShowConfirm(true); }}>
                             <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredUsers.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="karyawan"
      />

      {/* User Detail Sheet */}
      <Sheet open={!!detailUser} onOpenChange={(open) => !open && setDetailUser(null)}>
        <SheetContent className="w-full sm:max-w-lg p-0 overflow-hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Detail Karyawan</SheetTitle>
            <SheetDescription>Informasi detail profil karyawan</SheetDescription>
          </SheetHeader>
          {detailUser && (
            <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-white">
               {/* Header with Avatar */}
               <div className="relative bg-gradient-to-br from-[#0F1C3F] via-[#1A3060] to-[#0F1C3F] px-6 pt-8 pb-20">
                  {/* Close Button */}
                  <button
                    onClick={() => setDetailUser(null)}
                    className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                      detailUser.inProgressEnrollments > 0 
                        ? "bg-amber-500/20 text-amber-300 border border-amber-400/30" 
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                    )}>
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full animate-pulse",
                        detailUser.inProgressEnrollments > 0 ? "bg-amber-300" : "bg-emerald-300"
                      )} />
                      {detailUser.inProgressEnrollments > 0 ? "Aktif Belajar" : "Selesai"}
                    </div>
                  </div>

                  {/* Avatar - Positioned to overlap */}
                  <div className="absolute -bottom-12 left-6">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-2xl ring-4 ring-slate-100">
                      <AvatarImage 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(detailUser.name || '?')}&background=E8A020&color=0F1C3F&bold=true&size=128`} 
                        alt={detailUser.name || "User avatar"}
                        loading="lazy"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-[#E8A020] to-[#F2A925] text-[#0F1C3F] font-black text-3xl">
                        {detailUser.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
               </div>
               
               {/* Content */}
               <div className="flex-1 overflow-y-auto px-6 pt-16 pb-6 space-y-6">
                 {/* User Info */}
                 <div>
                    <h2 className="text-2xl font-black text-[#0F1C3F] tracking-tight">{detailUser.name}</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      {detailUser.email}
                    </p>
                 </div>

                 {/* Stats Cards */}
                 <div className="grid grid-cols-2 gap-3">
                   <Card className="border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-black text-[#0F1C3F]">{detailUser.totalEnrollments}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kursus</p>
                          </div>
                        </div>
                      </CardContent>
                   </Card>
                   
                   <Card className="border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-black text-emerald-600">{detailUser.completedEnrollments}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lulus</p>
                          </div>
                        </div>
                      </CardContent>
                   </Card>
                 </div>

                 {/* Employee Information */}
                 <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Informasi Karyawan</h3>
                    
                    <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                            <Fingerprint className="h-5 w-5 text-slate-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">NIP</p>
                            <p className="text-sm font-bold text-[#0F1C3F] mt-0.5">{detailUser.nip || "—"}</p>
                          </div>
                        </div>

                        <Separator className="bg-slate-100" />

                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5 text-slate-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Departemen</p>
                            <p className="text-sm font-bold text-[#0F1C3F] mt-0.5">{detailUser.department || "—"}</p>
                          </div>
                        </div>

                        <Separator className="bg-slate-100" />

                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                            <MapPin className="h-5 w-5 text-slate-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lokasi Tugas</p>
                            <p className="text-sm font-bold text-[#0F1C3F] mt-0.5">{detailUser.lokasi || "—"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                 </div>

                 {/* Action Buttons */}
                 <div className="flex gap-3 pt-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-[#0F1C3F] to-[#1A3060] hover:from-[#1A3060] hover:to-[#0F1C3F] text-white font-bold rounded-xl h-12 shadow-lg shadow-[#0F1C3F]/20" 
                      onClick={() => router.push(`/admin/users/${detailUser.id}`)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Lihat Profil Lengkap
                    </Button>
                 </div>
               </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
