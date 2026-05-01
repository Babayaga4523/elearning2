"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Hash,
  Building,
  MapPin,
  Save,
  Loader2,
  Pencil,
  Lock,
  Eye,
  EyeOff,
  Shield,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateUser } from "../actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UserRole } from "@/generated/client";

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
    role?: UserRole;
    roles?: UserRole[];
  } | null;
}

export function UserEditModal({ isOpen, onClose, user }: UserEditModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nip: "",
    department: "",
    lokasi: "",
    password: "",
    roles: [] as UserRole[]
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        nip: user.nip || "",
        department: user.department || "",
        lokasi: user.lokasi || "",
        password: "",
        roles: user.roles || (user.role ? [user.role as UserRole] : [UserRole.KARYAWAN])
      });
    }
  }, [user, isOpen]);

  if (!user) return null;

  const handleRoleToggle = (role: UserRole) => {
    setFormData(prev => {
      const currentRoles = prev.roles;
      if (currentRoles.includes(role)) {
        // Don't allow removing all roles
        if (currentRoles.length === 1) {
          toast.error("User harus memiliki minimal 1 role");
          return prev;
        }
        return {
          ...prev,
          roles: currentRoles.filter(r => r !== role)
        };
      } else {
        return {
          ...prev,
          roles: [...currentRoles, role]
        };
      }
    });
  };

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-none shadow-2xl [&>button.absolute]:hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Edit Profil Karyawan</DialogTitle>
          <DialogDescription>Perbarui informasi dasar akun karyawan</DialogDescription>
        </DialogHeader>
        
        {/* Compact Card Header */}
        <div className="bg-[#0F1C3F] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-[#E8A020]/20 flex items-center justify-center">
              <Pencil className="h-3.5 w-3.5 text-[#E8A020]" />
            </div>
            <span className="text-xs font-bold text-white">Edit Karyawan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/50 truncate max-w-[120px]">
              {user.name || user.email}
            </span>
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

        {/* Compact Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-2 gap-2">
            {/* Nama - Full width */}
            <div className="col-span-2">
              <Label className="text-[10px] font-medium text-slate-400 mb-1 block">Nama</Label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="pl-8 h-8 text-xs bg-white border-slate-200 rounded-md"
                  required
                />
              </div>
            </div>

            {/* Email - Full width */}
            <div className="col-span-2">
              <Label className="text-[10px] font-medium text-slate-400 mb-1 block">Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="pl-8 h-8 text-xs bg-white border-slate-200 rounded-md"
                  required
                />
              </div>
            </div>

            {/* 3 columns: NIP, Lokasi, Dept */}
            <div>
              <Label className="text-[10px] font-medium text-slate-400 mb-1 block">NIP</Label>
              <div className="relative">
                <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <Input 
                  value={formData.nip}
                  onChange={(e) => setFormData({...formData, nip: e.target.value})}
                  className="pl-8 h-8 text-xs bg-white border-slate-200 rounded-md"
                />
              </div>
            </div>

            <div>
              <Label className="text-[10px] font-medium text-slate-400 mb-1 block">Lokasi</Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <Input 
                  value={formData.lokasi}
                  onChange={(e) => setFormData({...formData, lokasi: e.target.value})}
                  className="pl-8 h-8 text-xs bg-white border-slate-200 rounded-md"
                />
              </div>
            </div>

            {/* Departemen */}
            <div className="col-span-2">
              <Label className="text-[10px] font-medium text-slate-400 mb-1 block">Departemen</Label>
              <div className="relative">
                <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <Input 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="pl-8 h-8 text-xs bg-white border-slate-200 rounded-md"
                />
              </div>
            </div>

            {/* Password - Compact */}
            <div className="col-span-2">
              <Label className="text-[10px] font-medium text-slate-400 mb-1 block">Password Baru</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <Input 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  type={showPassword ? "text" : "password"}
                  placeholder="Opsional"
                  className="pl-8 pr-8 h-8 text-xs bg-white border-slate-200 rounded-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {/* Roles - Multi-select */}
            <div className="col-span-2 pt-2 border-t">
              <Label className="text-[10px] font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                <UserCog className="h-3 w-3" />
                Role Akses
              </Label>
              <div className="space-y-2">
                {/* Karyawan Role */}
                <div className="flex items-center space-x-2 p-2 rounded-md border border-slate-200 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                  <Checkbox
                    id="role-karyawan"
                    checked={formData.roles.includes(UserRole.KARYAWAN)}
                    onCheckedChange={() => handleRoleToggle(UserRole.KARYAWAN)}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor="role-karyawan"
                    className="flex-1 flex items-center gap-2 text-xs font-medium cursor-pointer"
                  >
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    <div>
                      <div className="text-blue-900">Karyawan</div>
                      <div className="text-[10px] text-blue-600/70">Akses pembelajaran dan kursus</div>
                    </div>
                  </label>
                </div>

                {/* Admin Role */}
                <div className="flex items-center space-x-2 p-2 rounded-md border border-slate-200 bg-amber-50/50 hover:bg-amber-50 transition-colors">
                  <Checkbox
                    id="role-admin"
                    checked={formData.roles.includes(UserRole.ADMIN)}
                    onCheckedChange={() => handleRoleToggle(UserRole.ADMIN)}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor="role-admin"
                    className="flex-1 flex items-center gap-2 text-xs font-medium cursor-pointer"
                  >
                    <Shield className="h-3.5 w-3.5 text-amber-600" />
                    <div>
                      <div className="text-amber-900">Admin</div>
                      <div className="text-[10px] text-amber-600/70">Kelola sistem dan pengguna</div>
                    </div>
                  </label>
                </div>

                {/* Super Admin Role */}
                <div className="flex items-center space-x-2 p-2 rounded-md border border-slate-200 bg-purple-50/50 hover:bg-purple-50 transition-colors">
                  <Checkbox
                    id="role-super-admin"
                    checked={formData.roles.includes(UserRole.SUPER_ADMIN)}
                    onCheckedChange={() => handleRoleToggle(UserRole.SUPER_ADMIN)}
                    className="h-4 w-4"
                  />
                  <label
                    htmlFor="role-super-admin"
                    className="flex-1 flex items-center gap-2 text-xs font-medium cursor-pointer"
                  >
                    <Shield className="h-3.5 w-3.5 text-purple-600" />
                    <div>
                      <div className="text-purple-900">Super Admin</div>
                      <div className="text-[10px] text-purple-600/70">Akses penuh ke seluruh sistem</div>
                    </div>
                  </label>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                * User harus memiliki minimal 1 role
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="h-7 text-[11px] font-medium px-3"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-7 gap-1 text-[11px] font-bold bg-[#0F1C3F] hover:bg-[#1A3060] text-white px-4"
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              Simpan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

