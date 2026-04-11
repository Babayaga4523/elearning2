"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Hash,
  Building,
  MapPin,
  Save,
  Loader2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUser } from "../actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    nip: string | null;
    department: string | null;
    lokasi: string | null;
  } | null;
}

export function UserEditModal({ isOpen, onClose, user }: UserEditModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nip: "",
    department: "",
    lokasi: ""
  });

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        nip: user.nip || "",
        department: user.department || "",
        lokasi: user.lokasi || ""
      });
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    
    try {
      const result = await updateUser(user.id, formData);
      if (result.success) {
        toast.success("Profil karyawan berhasil diperbarui.");
        onClose();
      } else {
        toast.error(result.error || "Gagal memperbarui profil.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5 md:px-8">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, #0F1C3F, #1A3060)",
                boxShadow: "0 2px 8px rgba(15,28,63,0.2)",
              }}
            >
              <Pencil className="h-5 w-5" style={{ color: "#E8A020" }} />
            </div>
            <div>
              <h2
                className="text-lg font-black tracking-tight text-slate-900 md:text-xl"
                style={{ fontFamily: "'Lexend Deca', sans-serif" }}
              >
                Edit profil karyawan
              </h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Perbarui informasi dasar akun karyawan.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6 md:p-8"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nama */}
            <div className="space-y-2 col-span-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="pl-10 h-11 bg-slate-50 border-slate-100 rounded-xl font-semibold text-slate-700 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2 col-span-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Karyawan</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="pl-10 h-11 bg-slate-50 border-slate-100 rounded-xl font-semibold text-slate-700 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            {/* NIP */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">NIP</Label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input 
                  value={formData.nip}
                  onChange={(e) => setFormData({...formData, nip: e.target.value})}
                  className="pl-10 h-11 bg-slate-50 border-slate-100 rounded-xl font-semibold text-slate-700 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Lokasi */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Lokasi Kerja</Label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input 
                  value={formData.lokasi}
                  onChange={(e) => setFormData({...formData, lokasi: e.target.value})}
                  className="pl-10 h-11 bg-slate-50 border-slate-100 rounded-xl font-semibold text-slate-700 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Departemen */}
            <div className="space-y-2 col-span-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Departemen</Label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="pl-10 h-11 bg-slate-50 border-slate-100 rounded-xl font-semibold text-slate-700 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
              className="h-10 rounded-lg px-5 font-semibold text-slate-600"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-10 gap-2 rounded-lg px-6 font-black text-white shadow-md"
              style={{
                background: "linear-gradient(135deg, #0F1C3F, #1A3060)",
                boxShadow: "0 4px 14px rgba(15,28,63,0.25)",
              }}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Save className="h-4 w-4 text-[#E8A020]" />
              )}
              Simpan perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

