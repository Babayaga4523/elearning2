"use client";

import { useState } from "react";
import { Lock, ShieldAlert, Mail, Unlock, Globe, AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { unlockEmail, unlockIp } from "./actions";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LockedAccountsClientProps {
  lockedEmails: { email: string; attempts: number; lastAttemptAt: Date | null }[];
  lockedIps: { ipAddress: string; attempts: number; lastAttemptAt: Date | null }[];
}

export function LockedAccountsClient({ lockedEmails, lockedIps }: LockedAccountsClientProps) {
  const [activeTab, setActiveTab] = useState<"email" | "ip">("email");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleUnlockEmail = async (email: string) => {
    setIsProcessing(email);
    try {
      const result = await unlockEmail(email);
      if (result.success) toast.success(`Kunci ${email} berhasil dibuka.`);
      else toast.error(result.error || "Gagal membuka kunci.");
    } catch {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleUnlockIp = async (ip: string) => {
    setIsProcessing(ip);
    try {
      const result = await unlockIp(ip);
      if (result.success) toast.success(`Blokir IP ${ip} berhasil dicabut.`);
      else toast.error(result.error || "Gagal membuka blokir IP.");
    } catch {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsProcessing(null);
    }
  };

  const totalLocked = lockedEmails.length + lockedIps.length;

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-700">
      <PageHeader
        title="Akun Terkunci"
        description="Kelola akun dan IP yang terkena sistem penalti brute-force."
        actions={
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border",
              totalLocked > 0
                ? "bg-rose-50 border-rose-100 text-rose-700"
                : "bg-emerald-50 border-emerald-100 text-emerald-700"
            )}>
              {totalLocked > 0
                ? <><Lock className="h-3 w-3" /> {totalLocked} Terkunci</>
                : <><ShieldCheck className="h-3 w-3" /> Aman</>
              }
            </div>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className={cn(
          "flex items-center gap-3 border rounded-xl px-4 py-3 shadow-sm",
          lockedEmails.length > 0 ? "bg-rose-50 border-rose-100" : "bg-white border-slate-100"
        )}>
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
            lockedEmails.length > 0 ? "bg-rose-100" : "bg-slate-100"
          )}>
            <Mail className={cn("h-4 w-4", lockedEmails.length > 0 ? "text-rose-600" : "text-slate-400")} />
          </div>
          <div>
            <p className={cn("text-base font-black leading-none", lockedEmails.length > 0 ? "text-rose-700" : "text-[#0F1C3F]")}>
              {lockedEmails.length}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Email Terkunci</p>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-3 border rounded-xl px-4 py-3 shadow-sm",
          lockedIps.length > 0 ? "bg-amber-50 border-amber-100" : "bg-white border-slate-100"
        )}>
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
            lockedIps.length > 0 ? "bg-amber-100" : "bg-slate-100"
          )}>
            <Globe className={cn("h-4 w-4", lockedIps.length > 0 ? "text-amber-600" : "text-slate-400")} />
          </div>
          <div>
            <p className={cn("text-base font-black leading-none", lockedIps.length > 0 ? "text-amber-700" : "text-[#0F1C3F]")}>
              {lockedIps.length}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">IP Diblokir</p>
          </div>
        </div>
      </div>

      {/* Security banner */}
      {totalLocked > 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <Lock className="h-4 w-4 text-rose-500 shrink-0" />
          <p className="text-xs font-semibold text-rose-700">
            Terdeteksi {lockedEmails.length} akun email dan {lockedIps.length} IP yang diblokir akibat percobaan login berulang.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <ShieldAlert className="h-4 w-4 text-emerald-500 shrink-0" />
          <p className="text-xs font-semibold text-emerald-700">
            Tidak ada akun atau IP yang diblokir saat ini. Sistem berjalan normal.
          </p>
        </div>
      )}

      {/* Tab nav */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {([
          { key: "email", label: "Email", icon: Mail, count: lockedEmails.length },
          { key: "ip",    label: "IP Address", icon: Globe, count: lockedIps.length },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeTab === tab.key
                ? "bg-white text-[#0F1C3F] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.count > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <Card className="rounded-xl border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          <div className="h-7 w-7 rounded-lg bg-[#0F1C3F] flex items-center justify-center">
            {activeTab === "email"
              ? <Lock className="h-3.5 w-3.5 text-[#E8A020]" />
              : <AlertTriangle className="h-3.5 w-3.5 text-[#E8A020]" />
            }
          </div>
          <div>
            <p className="text-xs font-bold text-[#0F1C3F]">
              {activeTab === "email" ? "Daftar Akun Email" : "Daftar IP Address"}
            </p>
            <p className="text-[10px] font-semibold text-slate-400">
              {activeTab === "email" ? "Sanksi berlaku 15 menit otomatis" : "Spray Protection — 20+ gagal / 15 menit"}
            </p>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-slate-50/70">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-4">
                {activeTab === "email" ? "Alamat Email" : "IP Address"}
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-center">Percobaan Gagal</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Terakhir Coba</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-right pr-4">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeTab === "email" && (
              lockedEmails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldAlert className="h-8 w-8 text-slate-200" />
                      <p className="text-xs font-semibold text-slate-400">Tidak ada email terkunci</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                lockedEmails.map((item) => (
                  <TableRow key={item.email} className="group border-slate-50 hover:bg-rose-50/30 transition-colors">
                    <TableCell className="py-2.5 pl-4">
                      <span className="text-sm font-bold text-[#0F1C3F]">{item.email}</span>
                    </TableCell>
                    <TableCell className="py-2.5 text-center">
                      <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-100 text-[10px] font-black">
                        {item.attempts}× Gagal
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="text-[11px] font-medium text-slate-400">
                        {item.lastAttemptAt ? formatDistanceToNow(new Date(item.lastAttemptAt), { addSuffix: true, locale: id }) : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right pr-4">
                      <Button
                        size="sm"
                        disabled={isProcessing === item.email}
                        onClick={() => handleUnlockEmail(item.email)}
                        className="h-7 gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                      >
                        {isProcessing === item.email
                          ? <><div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Membuka</>
                          : <><Unlock className="h-3 w-3" /> Buka Kunci</>
                        }
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )
            )}
            {activeTab === "ip" && (
              lockedIps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldAlert className="h-8 w-8 text-slate-200" />
                      <p className="text-xs font-semibold text-slate-400">Tidak ada IP yang diblokir</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                lockedIps.map((item) => (
                  <TableRow key={item.ipAddress} className="group border-slate-50 hover:bg-amber-50/30 transition-colors">
                    <TableCell className="py-2.5 pl-4">
                      <span className="text-sm font-mono font-bold text-[#0F1C3F]">{item.ipAddress}</span>
                    </TableCell>
                    <TableCell className="py-2.5 text-center">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 text-[10px] font-black">
                        {item.attempts}× Gagal
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="text-[11px] font-medium text-slate-400">
                        {item.lastAttemptAt ? formatDistanceToNow(new Date(item.lastAttemptAt), { addSuffix: true, locale: id }) : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right pr-4">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isProcessing === item.ipAddress}
                        onClick={() => handleUnlockIp(item.ipAddress)}
                        className="h-7 gap-1.5 rounded-lg border-slate-200 text-slate-600 text-xs font-bold hover:border-[#0F1C3F] hover:text-[#0F1C3F]"
                      >
                        {isProcessing === item.ipAddress
                          ? <><div className="h-3 w-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /> Membuka</>
                          : <><Globe className="h-3 w-3" /> Bebaskan IP</>
                        }
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
