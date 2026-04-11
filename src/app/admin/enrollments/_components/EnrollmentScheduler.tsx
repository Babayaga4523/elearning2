"use client";

import { useState, useTransition } from "react";
import { 
  Plus, 
  Trash2, 
  Building2, 
  BookOpen, 
  CheckCircle2, 
  Mail, 
  Download, 
  AlertCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { createAutoEnrollRule, deleteAutoEnrollRule, upsertDepartmentConfig, deleteDepartmentConfig } from "../actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Rule {
  id: string;
  courseId: string;
  department: string;
  bypassDeadline: boolean;
  course: { title: string };
}

interface DeptConfig {
  id: string;
  departmentName: string;
  headEmail: string;
  headName: string;
}

interface Props {
  courses: { id: string; title: string }[];
  departments: string[];
  autoEnrollRules: Rule[];
  deptConfigs: DeptConfig[];
}

export function EnrollmentScheduler({ courses, departments, autoEnrollRules, deptConfigs }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State for new Rule
  const [newRuleCourse, setNewRuleCourse] = useState("");
  const [newRuleDept, setNewRuleDept] = useState("");
  const [newRuleBypass, setNewRuleBypass] = useState(true);

  // State for new Dept Config
  const [newDeptName, setNewDeptName] = useState("");
  const [newHeadName, setNewHeadName] = useState("");
  const [newHeadEmail, setNewHeadEmail] = useState("");

  const handleCreateRule = () => {
    if (!newRuleCourse || !newRuleDept) return toast.error("Pilih kursus dan departemen.");
    startTransition(async () => {
      const res = await createAutoEnrollRule(newRuleCourse, newRuleDept, newRuleBypass);
      if (res.success) {
        toast.success("Aturan auto-enroll berhasil ditambahkan.");
        setNewRuleCourse("");
        setNewRuleDept("");
        router.refresh();
      } else toast.error(res.error);
    });
  };

  const handleDeleteRule = (id: string) => {
    if (!confirm("Hapus aturan ini?")) return;
    startTransition(async () => {
      const res = await deleteAutoEnrollRule(id);
      if (res.success) {
        toast.success("Aturan dihapus.");
        router.refresh();
      } else toast.error(res.error);
    });
  };

  const handleUpsertConfig = () => {
    if (!newDeptName || !newHeadName || !newHeadEmail) return toast.error("Lengkapi semua data.");
    startTransition(async () => {
      const res = await upsertDepartmentConfig(newDeptName, newHeadName, newHeadEmail);
      if (res.success) {
        toast.success("Konfigurasi laporan disimpan.");
        setNewDeptName("");
        setNewHeadName("");
        setNewHeadEmail("");
        router.refresh();
      } else toast.error(res.error);
    });
  };

  const handleDeleteConfig = (id: string) => {
    if (!confirm("Hapus konfigurasi ini?")) return;
    startTransition(async () => {
      const res = await deleteDepartmentConfig(id);
      if (res.success) {
        toast.success("Konfigurasi dihapus.");
        router.refresh();
      } else toast.error(res.error);
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* ── SECTION: AUTO ENROLL RULES ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black" style={{ color: "#0F1C3F" }}>Aturan Auto-Enrollment</h3>
            <p className="text-xs text-slate-500">Daftarkan karyawan baru secara otomatis ke kursus berdasarkan departemen.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Create */}
          <div className="rounded-2xl p-6 h-fit" style={{ background: "white", border: "1px solid #F0F2F7" }}>
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: "#B0BAD0" }}>Tambah Aturan Baru</h4>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider ml-1" style={{ color: "#7A8599" }}>Kursus</label>
                <select 
                  value={newRuleCourse}
                  onChange={(e) => setNewRuleCourse(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-navy transition-all"
                >
                  <option value="">Pilih Kursus...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider ml-1" style={{ color: "#7A8599" }}>Departemen</label>
                <select 
                  value={newRuleDept}
                  onChange={(e) => setNewRuleDept(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-navy transition-all"
                >
                  <option value="">Pilih Departemen...</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 px-1">
                <input 
                  type="checkbox" 
                  id="bypass" 
                  checked={newRuleBypass} 
                  onChange={(e) => setNewRuleBypass(e.target.checked)}
                  className="rounded border-slate-300 accent-navy"
                />
                <label htmlFor="bypass" className="text-xs font-bold text-slate-600 cursor-pointer">Bypass Deadline</label>
              </div>
              <button
                onClick={handleCreateRule}
                disabled={isPending}
                className="w-full h-11 rounded-xl bg-[#0F1C3F] text-white font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {isPending ? "MEMPROSES..." : "TAMBAH ATURAN"}
              </button>
            </div>
          </div>

          {/* List Rules */}
          <div className="lg:col-span-2 space-y-3">
            {autoEnrollRules.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                <p className="text-sm font-bold text-slate-400">Belum ada aturan aktif.</p>
              </div>
            ) : (
              autoEnrollRules.map(rule => (
                <div 
                  key={rule.id}
                  className="flex items-center justify-between p-4 rounded-2xl transition-all hover:bg-slate-50"
                  style={{ background: "white", border: "1px solid #F0F2F7" }}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-black text-sm" style={{ color: "#0F1C3F" }}>{rule.course.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase tracking-wider">{rule.department}</span>
                        {rule.bypassDeadline && (
                          <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase">Bypass</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteRule(rule.id)}
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION: DEPARTMENT REPORTS ── */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div>
          <h3 className="text-lg font-black" style={{ color: "#0F1C3F" }}>Konfigurasi Laporan Departemen</h3>
          <p className="text-xs text-slate-500">Kelola daftar Department Head yang akan menerima laporan progress bulanan.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Config */}
          <div className="rounded-2xl p-6 h-fit" style={{ background: "white", border: "1px solid #F0F2F7" }}>
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: "#B0BAD0" }}>Daftarkan Department Head</h4>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider ml-1" style={{ color: "#7A8599" }}>Nama Departemen</label>
                <select 
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-navy transition-all"
                >
                  <option value="">Pilih Departemen...</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider ml-1" style={{ color: "#7A8599" }}>Nama Lengkap Head</label>
                <input 
                  value={newHeadName}
                  onChange={(e) => setNewHeadName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-navy transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider ml-1" style={{ color: "#7A8599" }}>Email Head</label>
                <input 
                  type="email"
                  value={newHeadEmail}
                  onChange={(e) => setNewHeadEmail(e.target.value)}
                  placeholder="budi.s@bnifinance.co.id"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-navy transition-all"
                />
              </div>
              <button
                onClick={handleUpsertConfig}
                disabled={isPending}
                className="w-full h-11 rounded-xl bg-[#E8A020] text-[#0F1C3F] font-black text-xs uppercase tracking-widest hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-orange-100"
              >
                {isPending ? "MENYIMPAN..." : "SIMPAN KONFIGURASI"}
              </button>
            </div>
          </div>

          {/* List Configs */}
          <div className="lg:col-span-2 space-y-4">
            {deptConfigs.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                <p className="text-sm font-bold text-slate-400">Belum ada konfigurasi laporan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {deptConfigs.map(config => (
                  <div 
                    key={config.id}
                    className="p-5 rounded-2xl space-y-4"
                    style={{ background: "white", border: "1px solid #F0F2F7" }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
                        <Mail className="h-5 w-5" style={{ color: "#E8A020" }} />
                      </div>
                      <button 
                        onClick={() => handleDeleteConfig(config.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] mb-1" style={{ color: "#B0BAD0" }}>{config.departmentName}</p>
                      <p className="text-sm font-black" style={{ color: "#0F1C3F" }}>{config.headName}</p>
                      <p className="text-xs text-slate-400 font-medium truncate">{config.headEmail}</p>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                       <a 
                         href={`/api/admin/reports/download?department=${encodeURIComponent(config.departmentName)}`}
                         className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:bg-slate-50 border border-slate-100 text-slate-600"
                       >
                         <Download className="h-3.5 w-3.5" />
                         Test Report
                       </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Quick Note */}
            <div className="p-4 rounded-2xl flex gap-3 items-start bg-blue-50/50 border border-blue-100">
               <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
               <p className="text-[11px] leading-relaxed text-blue-600 font-medium">
                 Laporan Excel akan dibuat per Departemen (berupa satu file dengan banyak sheet per kursus). Gunakan <strong>Test Report</strong> untuk mengunduh contoh file Excel secara langsung.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
