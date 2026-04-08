"use client";

import { useState, useTransition } from "react";
import { X, UserPlus, Users, Search, CheckCircle2, AlertCircle, Loader2, ChevronDown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { enrollUser, enrollDepartment, updateEnrollmentDeadline } from "../actions";
import { useEffect } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  nip: string;
}

interface Course {
  id: string;
  title: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  users: User[];
  departments: string[];
  existingEnrollments: { userId: string; courseId: string }[];
  editData?: {
    id: string;
    userId: string;
    courseId: string;
    deadline: string | null;
  } | null;
}

export function EnrollModal({ isOpen, onClose, courses, users, departments, existingEnrollments, editData }: Props) {
  const isEdit = !!editData;
  const [mode, setMode] = useState<"individual" | "department">("individual");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDeadline, setSelectedDeadline] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Pre-fill if edit mode
  useEffect(() => {
    if (editData && isOpen) {
      setSelectedCourse(editData.courseId);
      setSelectedUser(editData.userId);
      setSelectedDeadline(editData.deadline ? editData.deadline.substring(0, 10) : "");
      setMode("individual");
    } else if (isOpen) {
      // Reset if not edit mode
      setSelectedCourse("");
      setSelectedUser("");
      setSelectedDept("");
      setSelectedDeadline("");
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const enrolledPairs = new Set(existingEnrollments.map((e) => `${e.userId}_${e.courseId}`));

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.nip.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.department.toLowerCase().includes(userSearch.toLowerCase());
    return matchSearch;
  });

  const isAlreadyEnrolled = selectedCourse && selectedUser
    ? enrolledPairs.has(`${selectedUser}_${selectedCourse}`)
    : false;

  const handleSubmit = () => {
    if (!selectedCourse) {
      toast.error("Pilih kursus terlebih dahulu.");
      return;
    }

    const deadlineDate = selectedDeadline ? new Date(selectedDeadline) : null;

    startTransition(async () => {
      if (isEdit) {
        // Mode Edit: Hanya update deadline
        const result = await updateEnrollmentDeadline(editData!.id, deadlineDate);
        if (result.success) {
          toast.success("Deadline enrollment berhasil diperbarui.");
          handleClose();
        } else {
          toast.error(result.error);
        }
        return;
      }

      if (mode === "individual") {
        if (!selectedUser) {
          toast.error("Pilih karyawan terlebih dahulu.");
          return;
        }
        const result = await enrollUser(selectedUser, selectedCourse, deadlineDate);
        if (result.success) {
          toast.success("Karyawan berhasil didaftarkan ke kursus.");
          handleClose();
        } else {
          toast.error(result.error);
        }
      } else {
        if (!selectedDept) {
          toast.error("Pilih departemen terlebih dahulu.");
          return;
        }
        const result = await enrollDepartment(selectedDept, selectedCourse, deadlineDate);
        if (result.success) {
          toast.success(
            `${result.count} karyawan berhasil didaftarkan` +
            (result.skipped ? ` (${result.skipped} sudah terdaftar, dilewati)` : "")
          );
          handleClose();
        } else {
          toast.error(result.error);
        }
      }
    });
  };

  const handleClose = () => {
    setSelectedCourse("");
    setSelectedUser("");
    setSelectedDept("");
    setSelectedDeadline("");
    setUserSearch("");
    onClose();
  };

  // Hitung preview berapa user yang akan didaftarkan di dept tersebut
  const deptUsers = selectedDept ? users.filter((u) => u.department === selectedDept) : [];
  const deptNewEnrollments = selectedCourse
    ? deptUsers.filter((u) => !enrolledPairs.has(`${u.id}_${selectedCourse}`))
    : deptUsers;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {isEdit ? "Edit Deadline Enrollment" : "Daftarkan ke Kursus"}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {isEdit 
                  ? "Sesuaikan target deadline untuk pendaftaran ini." 
                  : "Pilih karyawan atau departemen yang ingin didaftarkan."}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Mode Tabs - Hidden in edit mode */}
            {!isEdit && (
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setMode("individual")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-black transition-all",
                    mode === "individual"
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <UserPlus className="h-4 w-4" />
                  Karyawan Individual
                </button>
                <button
                  onClick={() => setMode("department")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-black transition-all",
                    mode === "department"
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Building2 className="h-4 w-4" />
                  Per Departemen
                </button>
              </div>
            )}

            {/* Pilih Kursus */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Kursus Tujuan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    disabled={isEdit}
                    className={cn(
                      "w-full h-11 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none",
                      isEdit && "opacity-60 bg-slate-100 cursor-not-allowed"
                    )}
                  >
                    {!isEdit && <option value="">-- Pilih Kursus --</option>}
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Target Deadline (Optional)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDeadline}
                    onChange={(e) => setSelectedDeadline(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Mode: Individual */}
            {mode === "individual" && (
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Karyawan {isEdit ? "" : <span className="text-rose-500">*</span>}
                </label>
                {/* Search user - hidden in edit mode */}
                {!isEdit && (
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Cari nama, email, NIP, departemen..."
                      className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}
                {/* User list / Selected user only in edit mode */}
                <div className={cn(
                  "border border-slate-100 rounded-xl overflow-hidden",
                  !isEdit && "max-h-52 overflow-y-auto"
                )}>
                  {filteredUsers
                    .filter(u => isEdit ? u.id === selectedUser : true)
                    .map((u) => {
                      const alreadyEnrolled = selectedCourse
                        ? enrolledPairs.has(`${u.id}_${selectedCourse}`)
                        : false;
                      const isSelected = selectedUser === u.id;
                      return (
                        <button
                          key={u.id}
                          disabled={alreadyEnrolled || isEdit}
                          onClick={() => setSelectedUser(isSelected ? "" : u.id)}
                          className={cn(
                            "w-full text-left px-4 py-3 flex items-center gap-3 border-b border-slate-50 last:border-0 transition-colors",
                            isSelected
                              ? "bg-primary/5 border-primary/10"
                              : alreadyEnrolled
                              ? "opacity-40 cursor-not-allowed bg-slate-50"
                              : isEdit
                              ? "bg-slate-50"
                              : "hover:bg-slate-50"
                          )}
                        >
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center font-black text-sm shrink-0",
                            isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                          )}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-sm leading-tight">{u.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-400 truncate">{u.email}</span>
                              {u.nip && (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                                  {u.nip}
                                </span>
                              )}
                            </div>
                            {u.department && (
                              <span className="text-[10px] text-slate-400">{u.department}</span>
                            )}
                          </div>
                          <div className="shrink-0">
                            {alreadyEnrolled ? (
                              <Badge className="bg-slate-100 text-slate-400 text-[10px] border-none">
                                Sudah Terdaftar
                              </Badge>
                            ) : isSelected ? (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            ) : null}
                          </div>
                        </button>
                      );
                    })
                  }
                </div>
                {!isEdit && isAlreadyEnrolled && (
                  <div className="flex items-center gap-2 text-amber-600 text-xs font-bold bg-amber-50 px-3 py-2 rounded-lg">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Karyawan ini sudah terdaftar di kursus tersebut.
                  </div>
                )}
              </div>
            )}

            {/* Mode: Department */}
            {mode === "department" && (
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Pilih Departemen <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full h-11 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                  >
                    <option value="">-- Pilih Departemen --</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Preview  */}
                {selectedDept && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-slate-700 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        {selectedDept}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-700 border-none text-xs">
                          {deptUsers.length} karyawan
                        </Badge>
                        {selectedCourse && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-none text-xs">
                            {deptNewEnrollments.length} akan didaftarkan
                          </Badge>
                        )}
                      </div>
                    </div>
                    {selectedCourse && deptUsers.length !== deptNewEnrollments.length && (
                      <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {deptUsers.length - deptNewEnrollments.length} karyawan sudah terdaftar dan akan dilewati.
                      </p>
                    )}
                    {/* List preview all dept users */}
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {deptUsers.map((u) => {
                        const enrolled = selectedCourse
                          ? enrolledPairs.has(`${u.id}_${selectedCourse}`)
                          : false;
                        return (
                          <div
                            key={u.id}
                            className={cn(
                              "flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg",
                              enrolled ? "opacity-50" : "text-slate-700"
                            )}
                          >
                            <div className={cn(
                              "h-5 w-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0",
                              enrolled ? "bg-slate-200 text-slate-400" : "bg-primary/10 text-primary"
                            )}>
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-semibold flex-1 truncate">{u.name}</span>
                            {enrolled && (
                              <span className="text-[10px] text-slate-400 shrink-0">Sudah terdaftar</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={handleClose} className="font-bold">
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isPending ||
                !selectedCourse ||
                (mode === "individual" && (!selectedUser || (!isEdit && isAlreadyEnrolled))) ||
                (mode === "department" && (!selectedDept || deptNewEnrollments.length === 0))
              }
              className="font-black gap-2 min-w-32"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : isEdit ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Simpan Perubahan
                </>
              ) : mode === "department" ? (
                <>
                  <Users className="h-4 w-4" />
                  Daftarkan {selectedDept && selectedCourse ? `(${deptNewEnrollments.length})` : ""}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Daftarkan
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
