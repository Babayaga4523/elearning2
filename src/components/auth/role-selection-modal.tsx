"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, Shield, Loader2, LogOut, ChevronRight, Briefcase } from "lucide-react"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface RoleSelectionModalProps {
  user: {
    name: string
    email: string
    nip?: string | null
    image?: string | null
    roles: string[]
  }
  open: boolean
  onClose: () => void
}

export function RoleSelectionModal({ user, open, onClose }: RoleSelectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleSelectRole = async (role: string) => {
    setLoading(true);
    setSelectedRole(role);

    try {
      // Update active role di database
      const response = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to set role");
      }

      // Small delay to ensure server-side update completes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirect based on role
      const redirectPath = role === "ADMIN" || role === "SUPER_ADMIN" ? "/admin" : "/dashboard";

      toast.success(`Berhasil masuk sebagai ${getRoleLabel(role)}`);

      // Use window.location.href to ensure a full page reload with the new session cookie
      window.location.href = redirectPath;
    } catch (error) {
      console.error("Error setting role:", error);
      toast.error(error instanceof Error ? error.message : "Gagal mengatur role");
      setLoading(false);
      setSelectedRole(null);
    }
  }

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/auth/login" })
    } catch (error) {
      console.error("Error logging out:", error)
      toast.error("Gagal logout")
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin"
      case "SUPER_ADMIN":
        return "Super Admin"
      case "KARYAWAN":
        return "Karyawan"
      default:
        return role
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Kelola sistem dan pengguna"
      case "SUPER_ADMIN":
        return "Akses penuh ke seluruh sistem"
      case "KARYAWAN":
        return "Akses pembelajaran dan kursus"
      default:
        return ""
    }
  }

  const getRoleIcon = (role: string) => {
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      return <Shield className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
    }
    return <User className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
  }

  const getRoleColor = (role: string) => {
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      return "text-[#E8A020] bg-[#FEF3DC] group-hover:bg-[#E8A020] group-hover:text-white"
    }
    return "text-[#0F1C3F] bg-[#F8F9FB] group-hover:bg-[#0F1C3F] group-hover:text-white"
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[440px] p-0 gap-0 overflow-hidden border-0 rounded-[24px] shadow-[0_24px_60px_-12px_rgba(15,28,63,0.25)] bg-white/95 backdrop-blur-xl font-['DM_Sans']" 
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby="role-selection-description"
      >
        <div className="p-7">
          <DialogHeader className="space-y-4 mb-7">
            <div className="flex flex-col items-center text-center space-y-5">
              <Avatar className="h-20 w-20 border-4 border-white shadow-lg ring-4 ring-[#FEF3DC]/60 bg-gradient-to-br from-[#0F1C3F] to-[#1A2D5A]">
                <AvatarImage src={user.image || undefined} alt={user.name} className="object-cover" />
                <AvatarFallback className="text-2xl text-white font-bold bg-transparent">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-center">
                <DialogTitle className="text-2xl font-bold text-[#101828]">
                  Pilih Role Anda
                </DialogTitle>
                <DialogDescription id="role-selection-description" className="text-sm text-[#475467] mt-1.5 font-medium flex flex-col items-center">
                  <span>Masuk sebagai apa hari ini?</span>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F8F9FB] border border-[#E4E7EC] text-[13px] mt-4 shadow-sm">
                    <span className="font-bold text-[#101828]">{user.name.split(" ")[0]}</span>
                    <span className="w-1 h-1 rounded-full bg-[#D0D5DD]" />
                    <span className="text-[#475467] truncate max-w-[150px]">{user.email}</span>
                    {user.nip && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-[#D0D5DD]" />
                        <span className="text-[#475467]">{user.nip}</span>
                      </>
                    )}
                  </div>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Role Selection */}
          <div className="space-y-3">
            {user.roles.map((role) => (
              <button
                key={role}
                onClick={() => handleSelectRole(role)}
                disabled={loading}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ease-out group text-left",
                  "active:scale-[0.98]",
                  "border-[#E4E7EC] bg-white hover:border-[#E8A020]/40 hover:bg-[#FEF3DC]/20 hover:shadow-md hover:shadow-[#E8A020]/5",
                  loading && selectedRole !== role && "opacity-40 cursor-not-allowed scale-[0.99]",
                  loading && selectedRole === role && "border-[#E8A020] bg-[#FEF3DC]/40 shadow-sm"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-12 w-12 rounded-[14px] flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm",
                    getRoleColor(role),
                    loading && selectedRole === role && "bg-[#E8A020] text-white"
                  )}>
                    {loading && selectedRole === role ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      getRoleIcon(role)
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-[15px] text-[#101828] group-hover:text-[#0F1C3F] transition-colors duration-200">
                      {getRoleLabel(role)}
                    </div>
                    <div className="text-[13px] text-[#475467] mt-0.5 font-medium">
                      {getRoleDescription(role)}
                    </div>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-[#F8F9FB] flex items-center justify-center group-hover:bg-[#E8A020] transition-colors duration-300">
                  <ChevronRight className="h-4 w-4 text-[#98A2B3] group-hover:text-white transition-colors duration-300" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#E4E7EC] bg-gradient-to-b from-[#F8F9FB] to-white px-7 py-5">
          <Button
            variant="ghost"
            className={cn(
              "w-full h-12 text-[14px] font-bold rounded-xl transition-all duration-200",
              "text-[#475467] hover:text-[#B42318] hover:bg-[#FEF3F2]",
              "active:scale-[0.98]"
            )}
            onClick={handleLogout}
            disabled={loading}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Bukan Anda? Logout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
