"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory, updateCategory, deleteCategory } from "../actions";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataCard } from "@/components/analytics/data-card";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  _count: {
    courses: number;
  };
}

interface CategoriesClientProps {
  categories: Category[];
}

export function CategoriesClient({ categories }: CategoriesClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!categoryName.trim()) {
      toast.error("Nama kategori tidak boleh kosong");
      return;
    }

    setIsLoading(true);
    const result = await createCategory(categoryName.trim());
    setIsLoading(false);

    if (result.success) {
      toast.success("Kategori berhasil dibuat");
      setIsCreateOpen(false);
      setCategoryName("");
    } else {
      toast.error(result.error || "Gagal membuat kategori");
    }
  };

  const handleEdit = async () => {
    if (!selectedCategory || !categoryName.trim()) {
      toast.error("Nama kategori tidak boleh kosong");
      return;
    }

    setIsLoading(true);
    const result = await updateCategory(selectedCategory.id, categoryName.trim());
    setIsLoading(false);

    if (result.success) {
      toast.success("Kategori berhasil diupdate");
      setIsEditOpen(false);
      setSelectedCategory(null);
      setCategoryName("");
    } else {
      toast.error(result.error || "Gagal mengupdate kategori");
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    setIsLoading(true);
    const result = await deleteCategory(selectedCategory.id);
    setIsLoading(false);

    if (result.success) {
      toast.success("Kategori berhasil dihapus");
      setIsDeleteOpen(false);
      setSelectedCategory(null);
    } else {
      toast.error(result.error || "Gagal menghapus kategori");
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setCategoryName(category.name);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      <PageHeader
        title="Kelola Kategori"
        description="Organisasikan kursus dan materi pelatihan ke dalam kategori yang terstruktur."
        actions={
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white gap-2 h-10 px-5 rounded-lg shadow-sm font-bold transition-all active:scale-95 font-['DM_Sans']"
          >
            <Plus className="w-4 h-4 text-white" />
            Tambah Kategori
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DataCard 
          label="Total Kategori" 
          value={categories.length} 
          icon={BookOpen} 
          color="blue" 
          description="Kategori aktif di sistem" 
        />
        <DataCard 
          label="Total Kursus" 
          value={categories.reduce((sum, cat) => sum + cat._count.courses, 0)} 
          icon={BookOpen} 
          color="emerald" 
          description="Kursus dalam seluruh kategori" 
        />
        <DataCard 
          label="Rata-rata Kursus/Kategori" 
          value={categories.length > 0 ? Math.round(categories.reduce((sum, cat) => sum + cat._count.courses, 0) / categories.length) : 0} 
          icon={BookOpen} 
          color="amber" 
          description="Persebaran materi kursus" 
        />
      </div>

      {/* Categories List */}
      <div className="font-['DM_Sans']">
        <Card className="rounded-xl border border-[#E4E7EC] bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-[#F8F9FB] border-b border-[#E4E7EC]">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[500px] text-[11px] font-bold uppercase tracking-wider text-[#475467] pl-6 py-3 font-['Lexend_Deca']">
                  Nama Kategori
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#475467] py-3 font-['Lexend_Deca']">
                  Jumlah Kursus
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#475467] text-right pr-6 py-3 font-['Lexend_Deca']">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[#E4E7EC]">
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-64">
                    <EmptyState 
                      title="Belum ada kategori"
                      description="Klik tombol 'Tambah Kategori' untuk membuat kategori baru."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id} className="group hover:bg-[#F8F9FB] transition-colors border-none">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-[#E4E7EC] bg-[#EFF8FF] text-[#175CD3]">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold text-[#101828] font-['Lexend_Deca'] truncate group-hover:text-[#0F1C3F] transition-colors">
                          {category.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="text-[11px] font-bold bg-[#F8F9FB] text-[#475467] border-[#E4E7EC] shadow-none">
                        {category._count.courses} Kursus
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(category)}
                          className="h-8 w-8 rounded-lg hover:bg-[#F8F9FB] hover:text-[#0F1C3F] text-[#475467]"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(category)}
                          className="h-8 w-8 rounded-lg hover:bg-[#FEF3F2] hover:text-[#B42318] text-[#475467]"
                          disabled={category._count.courses > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kategori Baru</DialogTitle>
            <DialogDescription>
              Buat kategori baru untuk mengorganisir kursus
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Kategori</Label>
              <Input
                id="name"
                placeholder="Contoh: Technical Skills"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    handleCreate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setCategoryName("");
              }}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isLoading}
              className="bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white"
            >
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kategori</DialogTitle>
            <DialogDescription>
              Ubah nama kategori
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Kategori</Label>
              <Input
                id="edit-name"
                placeholder="Contoh: Technical Skills"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    handleEdit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setSelectedCategory(null);
                setCategoryName("");
              }}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isLoading}
              className="bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white"
            >
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Kategori</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kategori ini?
            </DialogDescription>
          </DialogHeader>
          {selectedCategory && selectedCategory._count.courses > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  Tidak dapat menghapus kategori
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Kategori ini memiliki {selectedCategory._count.courses} kursus.
                  Hapus atau pindahkan kursus terlebih dahulu.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false);
                setSelectedCategory(null);
              }}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isLoading || (selectedCategory?._count.courses ?? 0) > 0}
              variant="destructive"
            >
              {isLoading ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
