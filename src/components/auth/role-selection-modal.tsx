"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, Shield, Loader2, LogOut, ChevronRight } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
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

  const handleSelectRole = async (role: string) => {
    setLoading(true)
    setSelectedRole(role)

    try {
      // Update active role di database
      const response = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to set role")
      }

      // Force session refresh with updated role
      await update({
        activeRole: role,
        roles: user.roles,
      })

      // Small delay to ensure session is updated
      await new Promise(resolve => setTimeout(resolve, 100))

      // Redirect based on role
      const redirectPath = role === "ADMIN" || role === "SUPER_ADMIN" ? "/admin" : "/dashboard"
      
      toast.success(`Berhasil masuk sebagai ${getRoleLabel(role)}`)
      
      // Use window.location.href to ensure a full page reload with the new session cookie
      window.location.href = redirectPath
    } catch (error) {
      console.error("Error setting role:", error)
      toast.error(error instanceof Error ? error.message : "Gagal mengatur role")
      setLoading(false)
      setSelectedRole(null)
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
      return <Shield className="h-5 w-5" />
    }
    return <User className="h-5 w-5" />
  }

  const getRoleColor = (role: string) => {
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      return "text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200"
    }
    return "text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200"
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[400px] p-0 gap-0 overflow-hidden" 
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby="role-selection-description"
      >
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-[#0F1C3F] to-[#1a2b5a] px-6 py-8 text-white">
          <div className="absolute inset-0 bg-[url('/login-bg.png')] opacity-10 bg-cover bg-center" />
          <div className="relative">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-center text-xl font-bold">
                Pilih Role Anda
              </DialogTitle>
              <DialogDescription id="role-selection-description" className="text-center text-sm text-white/80">
                Pilih role untuk melanjutkan
              </DialogDescription>
            </DialogHeader>

            {/* User Profile - Compact */}
            <div className="flex flex-col items-center mt-6 space-y-2">
              <Avatar className="h-16 w-16 border-2 border-white/20 shadow-lg">
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback className="text-base bg-white/10 text-white font-bold backdrop-blur">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center">
                <h3 className="font-semibold text-base">{user.name}</h3>
                {user.nip && (
                  <p className="text-xs text-white/70 mt-0.5">NIP: {user.nip}</p>
                )}
                <p className="text-xs text-white/60 mt-0.5">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Role Selection - Compact */}
        <div className="p-6 space-y-3">
          {user.roles.map((role) => (
            <Button
              key={role}
              variant="outline"
              className={cn(
                "w-full h-auto py-3 px-4 flex items-center justify-between transition-all",
                "border-2 hover:scale-[1.02] active:scale-[0.98]",
                getRoleColor(role),
                loading && selectedRole !== role && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => handleSelectRole(role)}
              disabled={loading}
            >
              <div className="flex items-center gap-3">
                {loading && selectedRole === role ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  getRoleIcon(role)
                )}
                <div className="text-left">
                  <div className="font-semibold text-sm">{getRoleLabel(role)}</div>
                  <div className="text-xs opacity-70">{getRoleDescription(role)}</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </Button>
          ))}
        </div>

        {/* Footer - Compact */}
        <div className="border-t bg-gray-50 px-6 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
            disabled={loading}
          >
            <LogOut className="h-3 w-3 mr-1.5" />
            Bukan Anda? Logout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
