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
  Loader2 
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
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <PencilIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Edit Profil Karyawan</h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Perbarui informasi dasar akun karyawan.</p>
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
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
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

          <div className="pt-6 flex items-center justify-end gap-3">
            <Button 
              type="button"
              variant="ghost" 
              onClick={onClose}
              disabled={isPending}
              className="font-bold text-slate-500 h-11 rounded-xl px-6"
            >
              Batal
            </Button>
            <Button 
              type="submit"
              disabled={isPending}
              className="font-black h-11 rounded-xl px-8 shadow-lg shadow-primary/20 gap-2"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}
