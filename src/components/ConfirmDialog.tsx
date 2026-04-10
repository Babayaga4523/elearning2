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
import { AlertCircle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Apakah Anda Yakin?",
  description = "Semua perubahan yang belum disimpan akan hilang jika Anda keluar dari halaman ini.",
  confirmLabel = "Keluar Tanpa Menyimpan",
  cancelLabel = "Tetap di Halaman Ini"
}: ConfirmDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-white flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner">
            <AlertCircle className="h-10 w-10 text-white" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-white">{title}</DialogTitle>
            <DialogDescription className="sr-only">{description}</DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-8 bg-white text-center">
          <p className="text-slate-600 font-medium text-base mb-8">
            {description}
          </p>
          
          <div className="flex flex-col gap-3">
            <Button 
              variant="destructive" 
              onClick={onConfirm}
              className="w-full h-12 font-black rounded-xl shadow-lg shadow-red-100 hover:shadow-xl transition-all"
            >
              {confirmLabel}
            </Button>
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="w-full h-12 font-bold text-slate-500 border-none hover:bg-slate-50"
            >
              {cancelLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
