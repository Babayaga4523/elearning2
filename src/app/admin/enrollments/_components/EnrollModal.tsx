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
  DialogContent,
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
  const [isPending, startTransition] = useTransition();

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

    startTransition(async () => {
      try {
        if (mode === "individual") {
          if (selectedUsers.length === 0) {
            toast.error("Pilih minimal satu karyawan.");
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
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden gap-0"
        style={{
          borderRadius: "28px",
          border: "1px solid #E2E6F0",
          boxShadow: "0 24px 80px rgba(15,28,63,0.18)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── Header Banner ── */}
        <div
          className="relative overflow-hidden px-7 pt-7 pb-6"
          style={{ background: "linear-gradient(135deg, #0F1C3F 0%, #1A2E5A 100%)" }}
        >
          {/* Glow */}
          <div
            className="absolute -top-12 -right-12 h-40 w-40 rounded-full opacity-20 pointer-events-none"
            style={{ background: "radial-gradient(circle, #E8A020, transparent 70%)" }}
          />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,#fff 0px,transparent 1px,transparent 40px,#fff 41px),repeating-linear-gradient(90deg,#fff 0px,transparent 1px,transparent 40px,#fff 41px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(232,160,32,0.15)",
                  border: "1px solid rgba(232,160,32,0.3)",
                }}
              >
                <UserPlus className="h-6 w-6" style={{ color: "#E8A020" }} />
              </div>
              <div>
                <p
                  className="text-[9px] font-black uppercase tracking-[0.2em] mb-1"
                  style={{ color: "rgba(232,160,32,0.6)" }}
                >
                  Manajemen Peserta
                </p>
                <h2
                  className="text-xl font-black text-white leading-tight"
                  style={{ fontFamily: "'Lexend Deca', sans-serif" }}
                >
                  {isEdit ? "Edit Pendaftaran" : "Daftarkan Karyawan"}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-9 w-9 rounded-xl flex items-center justify-center transition-all hover:brightness-125"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Tabs — inside header */}
          {!isEdit && (
            <div
              className="relative z-10 mt-5 flex items-center gap-1.5 p-1.5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {[
                { key: "individual", label: "Individual", icon: <UserPlus className="h-3.5 w-3.5" /> },
                { key: "department", label: "Departemen", icon: <Building2 className="h-3.5 w-3.5" /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setMode(tab.key as any)}
                  className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  style={{
                    background: mode === tab.key ? "white" : "transparent",
                    color: mode === tab.key ? "#0F1C3F" : "rgba(255,255,255,0.35)",
                    boxShadow: mode === tab.key ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div
          className="overflow-y-auto px-7 py-6 space-y-5"
          style={{ maxHeight: "55vh", background: "#F8FAFC" }}
        >
          {/* Course Selector */}
          <div className="space-y-2">
            <label
              className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
              style={{ color: "#9AAABF" }}
            >
              <BookOpen className="h-3 w-3" />
              Kursus Tujuan <span style={{ color: "#EF4444" }}>*</span>
            </label>

            <div className="relative">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                disabled={isEdit}
                className="w-full h-12 pl-5 pr-12 rounded-2xl text-sm font-bold appearance-none outline-none transition-all cursor-pointer"
                style={{
                  background: "white",
                  border: `2px solid ${selectedCourse ? "#0F1C3F" : "#E2E6F0"}`,
                  color: selectedCourse ? "#0F1C3F" : "#B0BAD0",
                  boxShadow: selectedCourse ? "0 0 0 4px rgba(15,28,63,0.05)" : "none",
                }}
              >
                <option value="">Pilih kursus...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: "#B0BAD0" }}
              />
            </div>

            {/* Course preview badge */}
            {selectedCourseData && (
              <div
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#6366F1" }} />
                <p className="text-xs font-bold truncate" style={{ color: "#3730A3" }}>
                  {selectedCourseData.title}
                </p>
                {selectedCourseData.category && (
                  <span
                    className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ml-auto"
                    style={{ background: "white", color: "#6366F1" }}
                  >
                    {selectedCourseData.category}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── INDIVIDUAL MODE ── */}
          {mode === "individual" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                  style={{ color: "#9AAABF" }}
                >
                  <Users className="h-3 w-3" />
                  Pilih Karyawan
                </label>
                {selectedUsers.length > 0 && !isEdit && (
                  <button
                    onClick={() => setSelectedUsers([])}
                    className="text-[10px] font-black uppercase tracking-wider transition-all hover:opacity-70 flex items-center gap-1"
                    style={{ color: "#EF4444" }}
                  >
                    <X className="h-3 w-3" />
                    Reset ({selectedUsers.length})
                  </button>
                )}
              </div>

              {/* Search */}
              {!isEdit && (
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                    style={{ color: "#C5CEDF" }}
                  />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Cari nama, NIP, atau departemen..."
                    className="w-full h-11 pl-11 pr-4 rounded-2xl text-sm font-medium outline-none transition-all"
                    style={{
                      background: "white",
                      border: "1px solid #E2E6F0",
                      color: "#0F1C3F",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#0F1C3F")}
                    onBlur={(e) => (e.target.style.borderColor = "#E2E6F0")}
                  />
                </div>
              )}

              {/* Selected count pill */}
              {selectedUsers.length > 0 && !isEdit && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#059669" }} />
                  <p className="text-xs font-bold" style={{ color: "#059669" }}>
                    {selectedUsers.length} karyawan dipilih
                  </p>
                </div>
              )}

              {/* User list */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid #E2E6F0", background: "white" }}
              >
                {filteredUsers.length === 0 ? (
                  <div className="py-10 flex flex-col items-center gap-2">
                    <Search className="h-7 w-7" style={{ color: "#D6DBE8" }} />
                    <p className="text-xs font-bold" style={{ color: "#C5CEDF" }}>
                      Tidak ada karyawan ditemukan
                    </p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "#F8FAFC" }}>
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
                            className="w-full text-left flex items-center gap-3.5 px-4 py-3.5 transition-all"
                            style={{
                              background: isSelected
                                ? "rgba(99,102,241,0.04)"
                                : enrolled
                                ? "rgba(0,0,0,0.01)"
                                : "white",
                              opacity: enrolled ? 0.4 : 1,
                              cursor: enrolled ? "not-allowed" : "pointer",
                            }}
                          >
                            {/* Avatar */}
                            <div
                              className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-all"
                              style={{
                                background: isSelected ? "#0F1C3F" : av.bg,
                                color: isSelected ? "#E8A020" : av.color,
                                transform: isSelected ? "scale(1.05)" : "scale(1)",
                              }}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-black truncate leading-snug"
                                style={{ color: "#0F1C3F" }}
                              >
                                {u.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span
                                  className="text-[10px] font-bold"
                                  style={{ color: "#B0BAD0" }}
                                >
                                  {u.nip}
                                </span>
                                <span
                                  className="h-1 w-1 rounded-full"
                                  style={{ background: "#D6DBE8" }}
                                />
                                <span
                                  className="text-[10px] font-medium truncate"
                                  style={{ color: "#B0BAD0" }}
                                >
                                  {u.department}
                                </span>
                              </div>
                            </div>

                            {/* Status */}
                            <div className="shrink-0">
                              {enrolled ? (
                                <span
                                  className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg"
                                  style={{ background: "#F0F2F7", color: "#B0BAD0" }}
                                >
                                  Terdaftar
                                </span>
                              ) : (
                                <div
                                  className="h-6 w-6 rounded-lg flex items-center justify-center transition-all"
                                  style={{
                                    background: isSelected ? "#10B981" : "transparent",
                                    border: `2px solid ${isSelected ? "#10B981" : "#D6DBE8"}`,
                                  }}
                                >
                                  {isSelected && (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DEPARTMENT MODE ── */}
          {mode === "department" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                  style={{ color: "#9AAABF" }}
                >
                  <Building2 className="h-3 w-3" />
                  Pilih Departemen
                </label>
                <div className="relative">
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full h-12 pl-5 pr-12 rounded-2xl text-sm font-bold appearance-none outline-none transition-all cursor-pointer"
                    style={{
                      background: "white",
                      border: `2px solid ${selectedDept ? "#0F1C3F" : "#E2E6F0"}`,
                      color: selectedDept ? "#0F1C3F" : "#B0BAD0",
                    }}
                  >
                    <option value="">Pilih departemen...</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                    style={{ color: "#B0BAD0" }}
                  />
                </div>
              </div>

              {/* Dept preview card */}
              {selectedDept && (
                <div className="space-y-3">
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: "white", border: "1px solid #E2E6F0" }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-11 w-11 rounded-xl flex items-center justify-center"
                          style={{ background: "#EEF2FF", color: "#6366F1" }}
                        >
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p
                            className="font-black text-sm"
                            style={{ color: "#0F1C3F" }}
                          >
                            {selectedDept}
                          </p>
                          <p
                            className="text-[10px] font-bold"
                            style={{ color: "#9AAABF" }}
                          >
                            {deptUsers.length} total karyawan
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dept stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className="rounded-xl p-3 text-center"
                        style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                      >
                        <p
                          className="text-xl font-black leading-none mb-0.5"
                          style={{ color: "#059669" }}
                        >
                          {deptNewCount}
                        </p>
                        <p className="text-[10px] font-bold" style={{ color: "#6EE7B7" }}>
                          Akan Didaftarkan
                        </p>
                      </div>
                      <div
                        className="rounded-xl p-3 text-center"
                        style={{ background: "#F8FAFC", border: "1px solid #E2E6F0" }}
                      >
                        <p
                          className="text-xl font-black leading-none mb-0.5"
                          style={{ color: "#B0BAD0" }}
                        >
                          {deptUsers.length - deptNewCount}
                        </p>
                        <p className="text-[10px] font-bold" style={{ color: "#C5CEDF" }}>
                          Sudah Terdaftar
                        </p>
                      </div>
                    </div>
                  </div>

                  {deptNewCount === 0 && (
                    <div
                      className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
                      style={{ background: "#FFF8E7", border: "1px solid #F6CE72" }}
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "#E8A020" }} />
                      <p className="text-xs font-bold" style={{ color: "#B07D0C" }}>
                        Semua karyawan di departemen ini sudah terdaftar.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-between gap-3 px-7 py-5"
          style={{ background: "white", borderTop: "1px solid #F0F2F7" }}
        >
          {/* Left: selection summary */}
          <div>
            {mode === "individual" && selectedUsers.length > 0 && (
              <p className="text-xs font-bold" style={{ color: "#9AAABF" }}>
                <span style={{ color: "#0F1C3F", fontWeight: 900 }}>{selectedUsers.length}</span> karyawan dipilih
              </p>
            )}
            {mode === "department" && selectedDept && deptNewCount > 0 && (
              <p className="text-xs font-bold" style={{ color: "#9AAABF" }}>
                <span style={{ color: "#0F1C3F", fontWeight: 900 }}>{deptNewCount}</span> pendaftaran baru
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="h-11 px-6 rounded-xl font-black text-xs uppercase tracking-wider transition-all hover:brightness-95"
              style={{
                background: "#F0F2F7",
                border: "1px solid #D6DBE8",
                color: "#7A8599",
              }}
            >
              Batal
            </button>

            <button
              onClick={handleSubmit}
              disabled={isPending || !canSubmit}
              className="h-11 px-7 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: canSubmit
                  ? "linear-gradient(135deg, #0F1C3F, #1A3060)"
                  : "#D6DBE8",
                color: canSubmit ? "white" : "#9AAABF",
                boxShadow: canSubmit ? "0 4px 16px rgba(15,28,63,0.25)" : "none",
              }}
            >
              {isPending ? (
                <>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" style={{ color: canSubmit ? "#E8A020" : "#9AAABF" }} />
                  {isEdit
                    ? "Simpan Perubahan"
                    : mode === "individual" && selectedUsers.length > 1
                    ? `Daftarkan (${selectedUsers.length})`
                    : "Konfirmasi"}
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}