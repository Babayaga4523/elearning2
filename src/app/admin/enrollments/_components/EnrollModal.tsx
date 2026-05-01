"use client";

import { useState, useTransition, useEffect } from "react";
import {
  X,
  UserPlus,
  Search,
  CheckCircle2,
  ChevronDown,
  Building2,
  Users,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { enrollMultipleUsers, enrollDepartment } from "../actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface User {
  id: string;
  name: string;
  nip: string;
  email: string;
  department: string;
}

interface Course {
  id: string;
  title: string;
  category: string;
}

interface EnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  users: User[];
  departments: string[];
  existingEnrollments: string[];
  editData?: any;
}

// Helper: Avatar initials color based on name
const getAvatarTheme = (name: string) => {
  const themes = [
    { bg: "#EEF2FF", color: "#6366F1" },
    { bg: "#F0FDF4", color: "#059669" },
    { bg: "#FFF8E7", color: "#E8A020" },
    { bg: "#FFF0F0", color: "#EF4444" },
    { bg: "#F0F9FF", color: "#0EA5E9" },
  ];
  return themes[name.charCodeAt(0) % themes.length];
};

export function EnrollModal({
  isOpen,
  onClose,
  courses,
  users,
  departments,
  existingEnrollments,
  editData,
}: EnrollModalProps) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [mode, setMode] = useState<"individual" | "department">("individual");
  const [isPending, setIsPending] = useState(false);

  const isEdit = !!editData;

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setSelectedCourse(editData.courseId);
        setSelectedUsers([editData.userId]);
        setMode("individual");
      } else {
        setSelectedCourse("");
        setSelectedUsers([]);
        setSelectedDept("");
        setMode("individual");
        setUserSearch("");
      }
    }
  }, [editData, isOpen]);

  const enrolledPairs = new Set(existingEnrollments);

  const filteredUsers = users.filter((u) => {
    const s = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(s) ||
      u.nip.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.department.toLowerCase().includes(s)
    );
  });

  const deptUsers = users.filter((u) => u.department === selectedDept);
  const deptNewCount = deptUsers.filter(
    (u) => !enrolledPairs.has(`${u.id}_${selectedCourse}`)
  ).length;

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);

  const canSubmit =
    !!selectedCourse &&
    (mode === "individual"
      ? selectedUsers.length > 0
      : !!selectedDept && deptNewCount > 0);

  const handleSubmit = async () => {
    if (!selectedCourse) {
      toast.error("Pilih kursus terlebih dahulu.");
      return;
    }

    setIsPending(true);
    try {
      if (mode === "individual") {
        if (selectedUsers.length === 0) {
          toast.error("Pilih minimal satu karyawan.");
          setIsPending(false);
          return;
        }
        const res = await enrollMultipleUsers(selectedUsers, selectedCourse);
        if (res.success) {
          toast.success(isEdit ? "Pendaftaran diperbarui" : "Pendaftaran berhasil");
          onClose();
        } else {
          toast.error(res.error || "Gagal menyimpan");
        }
      } else {
        if (!selectedDept) {
          toast.error("Pilih departemen terlebih dahulu.");
          setIsPending(false);
          return;
        }
        const res = await enrollDepartment(selectedDept, selectedCourse);
        if (res.success) {
          toast.success(
            `Berhasil mendaftarkan ${res.count} karyawan` +
              (res.skipped ? ` (${res.skipped} sudah terdaftar)` : "")
          );
          onClose();
        } else {
          toast.error(res.error || "Gagal menyimpan");
        }
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-none shadow-2xl [&>button.absolute]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{isEdit ? "Edit Pendaftaran" : "Daftarkan Karyawan"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Edit data pendaftaran karyawan pada kursus" : "Daftarkan karyawan atau departemen ke kursus"}
          </DialogDescription>
        </DialogHeader>

        {/* Compact Header */}
        <div className="bg-[#0F1C3F] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-[#E8A020]/20 flex items-center justify-center">
              <UserPlus className="h-3.5 w-3.5 text-[#E8A020]" />
            </div>
            <span className="text-xs font-bold text-white">
              {isEdit ? "Edit Pendaftaran" : "Daftarkan Karyawan"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isEdit && (
              <div className="flex items-center gap-1 bg-white/10 rounded-md p-0.5">
                <button
                  onClick={() => setMode("individual")}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                    mode === "individual" ? "bg-white text-[#0F1C3F]" : "text-white/60 hover:text-white"
                  }`}
                >
                  Individual
                </button>
                <button
                  onClick={() => setMode("department")}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                    mode === "department" ? "bg-white text-[#0F1C3F]" : "text-white/60 hover:text-white"
                  }`}
                >
                  Departemen
                </button>
              </div>
            )}
            <DialogClose asChild>
              <button
                type="button"
                className="h-7 w-7 rounded-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="sr-only">Tutup</span>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </DialogClose>
          </div>
        </div>

        {/* Compact Body */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto bg-slate-50/50">
          {/* Course Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Kursus Tujuan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                disabled={isEdit}
                className="w-full h-8 pl-3 pr-8 rounded-md text-xs font-semibold appearance-none outline-none bg-white border border-slate-200 focus:border-[#0F1C3F] focus:ring-1 focus:ring-[#0F1C3F]/10 transition-all"
              >
                <option value="">Pilih kursus...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
            {selectedCourseData && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-indigo-50 border border-indigo-100">
                <CheckCircle2 className="h-3 w-3 text-indigo-600" />
                <p className="text-[10px] font-bold text-indigo-700 truncate">
                  {selectedCourseData.title}
                </p>
              </div>
            )}
          </div>

          {/* INDIVIDUAL MODE */}
          {mode === "individual" && (
            <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Pilih Karyawan
                </label>
                {selectedUsers.length > 0 && !isEdit && (
                  <button
                    onClick={() => setSelectedUsers([])}
                    className="text-[10px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Reset
                  </button>
                )}
              </div>

              {!isEdit && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Cari nama, NIP..."
                    className="w-full h-8 pl-8 pr-3 rounded-md text-xs bg-white border border-slate-200 focus:border-[#0F1C3F] focus:ring-1 focus:ring-[#0F1C3F]/10 outline-none transition-all"
                  />
                </div>
              )}

              {selectedUsers.length > 0 && !isEdit && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-green-50 border border-green-200">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <p className="text-[10px] font-bold text-green-700">
                    {selectedUsers.length} dipilih
                  </p>
                </div>
              )}

              <div className="rounded-md overflow-hidden border border-slate-200 bg-white max-h-48 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="py-6 flex flex-col items-center gap-1">
                    <Search className="h-5 w-5 text-slate-300" />
                    <p className="text-[10px] font-bold text-slate-400">Tidak ditemukan</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredUsers
                      .filter((u) => (isEdit ? u.id === selectedUsers[0] : true))
                      .map((u) => {
                        const enrolled = selectedCourse
                          ? enrolledPairs.has(`${u.id}_${selectedCourse}`)
                          : false;
                        const isSelected = selectedUsers.includes(u.id);
                        const av = getAvatarTheme(u.name);

                        return (
                          <button
                            key={u.id}
                            disabled={enrolled || isEdit}
                            onClick={() => {
                              if (enrolled || isEdit) return;
                              setSelectedUsers((prev) =>
                                prev.includes(u.id)
                                  ? prev.filter((id) => id !== u.id)
                                  : [...prev, u.id]
                              );
                            }}
                            className={`w-full text-left flex items-center gap-2 px-3 py-2 transition-all ${
                              isSelected ? "bg-indigo-50" : enrolled ? "bg-slate-50 opacity-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`h-7 w-7 rounded-md flex items-center justify-center font-black text-[10px] shrink-0 ${
                                isSelected ? "bg-[#0F1C3F] text-[#E8A020]" : ""
                              }`}
                              style={!isSelected ? { background: av.bg, color: av.color } : {}}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate">{u.name}</p>
                              <p className="text-[9px] text-slate-400 truncate">{u.nip} · {u.department}</p>
                            </div>
                            {enrolled ? (
                              <span className="text-[9px] font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">
                                Terdaftar
                              </span>
                            ) : (
                              <div
                                className={`h-5 w-5 rounded-md flex items-center justify-center border-2 ${
                                  isSelected ? "bg-green-500 border-green-500" : "border-slate-200"
                                }`}
                              >
                                {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DEPARTMENT MODE */}
          {mode === "department" && (
            <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-100">
              <label className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Pilih Departemen
              </label>
              <div className="relative">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full h-8 pl-3 pr-8 rounded-md text-xs font-semibold appearance-none outline-none bg-white border border-slate-200 focus:border-[#0F1C3F] focus:ring-1 focus:ring-[#0F1C3F]/10 transition-all"
                >
                  <option value="">Pilih departemen...</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
              </div>

              {selectedDept && (
                <div className="space-y-2">
                  <div className="rounded-md p-3 bg-white border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-md bg-indigo-50 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{selectedDept}</p>
                        <p className="text-[9px] text-slate-400">{deptUsers.length} karyawan</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-md p-2 text-center bg-green-50 border border-green-200">
                        <p className="text-sm font-black text-green-600">{deptNewCount}</p>
                        <p className="text-[9px] font-bold text-green-500">Baru</p>
                      </div>
                      <div className="rounded-md p-2 text-center bg-slate-50 border border-slate-200">
                        <p className="text-sm font-black text-slate-400">{deptUsers.length - deptNewCount}</p>
                        <p className="text-[9px] font-bold text-slate-400">Sudah</p>
                      </div>
                    </div>
                  </div>
                  {deptNewCount === 0 && (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-amber-50 border border-amber-200">
                      <AlertCircle className="h-3 w-3 text-amber-600" />
                      <p className="text-[10px] font-bold text-amber-700">
                        Semua sudah terdaftar
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-100">
          <div className="text-[10px] text-slate-400">
            {mode === "individual" && selectedUsers.length > 0 && (
              <span className="font-bold text-slate-700">{selectedUsers.length} dipilih</span>
            )}
            {mode === "department" && selectedDept && deptNewCount > 0 && (
              <span className="font-bold text-slate-700">{deptNewCount} baru</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-7 px-3 rounded-md text-[11px] font-semibold border border-slate-200 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || !canSubmit}
              className="h-7 px-4 rounded-md text-[11px] font-bold bg-[#0F1C3F] hover:bg-[#1A3060] text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isPending ? (
                <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3 text-[#E8A020]" />
              )}
              {isEdit ? "Simpan" : mode === "individual" && selectedUsers.length > 1 ? `Daftar (${selectedUsers.length})` : "Konfirmasi"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}