"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle } from "lucide-react";

interface ConfirmDraftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  warningDetails?: string[];
}

export const ConfirmDraftDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Tarik Kursus dari Publikasi?",
  description = "Aksi ini akan membuat syarat publikasi tidak lagi terpenuhi. Jika dilanjutkan, kursus akan otomatis ditarik ke status Draft dan tidak dapat diakses oleh peserta.",
  warningDetails = []
}: ConfirmDraftDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden max-w-md">
        <div className="bg-amber-500 p-8 flex flex-col items-center text-white">
          <div className="bg-white/20 p-4 rounded-3xl mb-4">
            <AlertTriangle className="h-10 w-10 text-white" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center tracking-tight leading-tight text-white">
              {title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-8 space-y-6 bg-white">
          <p className="text-slate-600 font-medium text-center">
            {description}
          </p>

          {warningDetails.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <AlertCircle className="h-3 w-3" /> Rekomendasi Perbaikan:
               </p>
               <ul className="space-y-2">
                  {warningDetails.map((detail, i) => (
                    <li key={i} className="text-xs font-bold text-slate-700 flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                      {detail}
                    </li>
                  ))}
               </ul>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={onConfirm}
              className="w-full h-12 bg-amber-600 hover:bg-amber-700 font-black rounded-xl shadow-lg shadow-amber-100"
            >
              Ya, Simpan & Tarik ke Draft
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full h-12 border-slate-200 font-bold rounded-xl text-slate-500"
            >
              Batal & Kembalikan Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
