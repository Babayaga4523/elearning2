"use client";

// ─── Role & Permission Management Page ──────────────────────────
// Allows SUPER_ADMIN to toggle ADMIN permissions via checklist UI.

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
  Lock,
  Unlock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Permission {
  id: string;
  key: string;
  label: string;
  description: string | null;
  group: string | null;
  isAssigned: boolean;
}

export default function RolesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if user is SUPER_ADMIN
  const activeRole = session?.user?.activeRole || session?.user?.role;
  const isSuperAdmin = activeRole === "SUPER_ADMIN";

  // Fetch permissions on mount
  const fetchPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/admin/role-permissions");
      if (!res.ok) {
        throw new Error(res.status === 403 ? "Anda tidak memiliki akses" : "Gagal memuat data");
      }
      const data = await res.json();
      setPermissions(data.permissions);
      setOriginalPermissions(data.permissions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      if (!isSuperAdmin) {
        router.push("/admin?error=unauthorized");
        return;
      }
      fetchPermissions();
    }
  }, [status, isSuperAdmin, router, fetchPermissions]);

  // Toggle permission
  const togglePermission = (permId: string) => {
    setPermissions((prev) =>
      prev.map((perm) =>
        perm.id === permId ? { ...perm, isAssigned: !perm.isAssigned } : perm
      )
    );
    setSuccessMessage(null);
  };

  // Check if there are unsaved changes
  const hasChanges = permissions.some((perm) => {
    const original = originalPermissions.find((op) => op.id === perm.id);
    return original && original.isAssigned !== perm.isAssigned;
  });

  // Save permissions
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const assignedIds = permissions
        .filter((perm) => perm.isAssigned)
        .map((perm) => perm.id);

      const res = await fetch("/api/admin/role-permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds: assignedIds }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan");
      }

      setOriginalPermissions([...permissions]);
      setSuccessMessage("Permission ADMIN berhasil diperbarui!");

      // Auto-hide success message
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Group permissions by group
  const groupedPermissions = permissions.reduce<Record<string, Permission[]>>(
    (groups, perm) => {
      const group = perm.group || "Lainnya";
      if (!groups[group]) groups[group] = [];
      groups[group].push(perm);
      return groups;
    },
    {}
  );

  const assignedCount = permissions.filter((p) => p.isAssigned).length;

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#0F1C3F]" />
          <p className="text-sm text-[#475467] font-medium font-['DM_Sans']">Memuat data permission...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <ShieldAlert className="h-16 w-16 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-[#101828] font-['Lexend_Deca']">Akses Ditolak</h2>
          <p className="text-[#475467] font-['DM_Sans']">Hanya Super Admin yang dapat mengakses halaman ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-[#0F1C3F] flex items-center justify-center">
            <Shield className="h-6 w-6 text-[#E8A020]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-['Lexend_Deca']">Kelola Permission</h1>
            <p className="text-sm text-[#475467] mt-1 font-['DM_Sans']">
              Atur akses fitur untuk role <span className="font-semibold text-[#0F1C3F]">ADMIN</span>
            </p>
          </div>
        </div>

        {/* Stats Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E4E7EC] shadow-sm">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-semibold text-[#101828] font-['DM_Sans']">
            {assignedCount}/{permissions.length}
          </span>
          <span className="text-xs text-[#475467] font-['DM_Sans']">aktif</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200/50">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-900 font-['Lexend_Deca']">
            Tentang Permission System
          </p>
          <p className="text-sm text-blue-800 leading-relaxed font-['DM_Sans']">
            Permission yang dicentang akan diberikan kepada semua user dengan role ADMIN. 
            Perubahan akan langsung berlaku pada sesi berikutnya. 
            <span className="font-semibold"> SUPER_ADMIN selalu memiliki akses penuh</span> dan tidak dapat diubah.
          </p>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <XCircle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm font-medium text-red-800 font-['DM_Sans']">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-800 font-['DM_Sans']">{successMessage}</p>
        </div>
      )}

      {/* Permission Groups */}
      <div className="space-y-6">
        {Object.entries(groupedPermissions).map(([group, perms]) => (
          <div
            key={group}
            className="bg-white rounded-xl border border-[#E4E7EC] overflow-hidden"
          >
            {/* Group Header */}
            <div className="px-5 py-4 bg-[#F8F9FB] border-b border-[#E4E7EC]">
              <h3 className="text-sm font-semibold text-[#101828] uppercase tracking-wider font-['DM_Sans']">
                {group}
              </h3>
            </div>

            {/* Permission Items */}
            <div className="divide-y divide-[#E4E7EC]">
              {perms.map((perm) => (
                <label
                  key={perm.id}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 cursor-pointer transition-all duration-200 group",
                    perm.isAssigned
                      ? "bg-emerald-50/30 hover:bg-emerald-50/50"
                      : "hover:bg-slate-50"
                  )}
                >
                  {/* Custom Toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={perm.isAssigned}
                    onClick={() => togglePermission(perm.id)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2",
                      perm.isAssigned
                        ? "bg-emerald-500 focus:ring-emerald-500"
                        : "bg-slate-300 focus:ring-slate-400"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out",
                        perm.isAssigned ? "translate-x-5" : "translate-x-0"
                      )}
                    >
                      {perm.isAssigned ? (
                        <Unlock className="absolute inset-0 m-auto h-3 w-3 text-emerald-500" />
                      ) : (
                        <Lock className="absolute inset-0 m-auto h-3 w-3 text-slate-400" />
                      )}
                    </span>
                  </button>

                  {/* Permission Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-semibold transition-colors duration-200 font-['DM_Sans']",
                          perm.isAssigned ? "text-[#101828]" : "text-[#475467]"
                        )}
                      >
                        {perm.label}
                      </span>
                      <code className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-[#475467] font-mono">
                        {perm.key}
                      </code>
                    </div>
                    {perm.description && (
                      <p className="text-sm text-[#475467] mt-0.5 leading-relaxed font-['DM_Sans']">
                        {perm.description}
                      </p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div
                    className={cn(
                      "shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent flex items-center gap-1.5 transition-all duration-200",
                      perm.isAssigned
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", perm.isAssigned ? "bg-emerald-500" : "bg-slate-400")} />
                    {perm.isAssigned ? "Aktif" : "Nonaktif"}
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="sticky bottom-6 mt-8">
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-md">
          <div className="flex items-center gap-2 text-sm text-[#475467] font-['DM_Sans']">
            {hasChanges ? (
              <>
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-medium text-amber-700">Ada perubahan yang belum disimpan</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Semua perubahan tersimpan</span>
              </>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 font-['DM_Sans']",
              hasChanges && !isSaving
                ? "bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
