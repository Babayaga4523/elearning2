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
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0F1C3F]">Kelola Kategori</h1>
          <p className="text-slate-500 mt-1">
            Kelola kategori untuk mengorganisir kursus
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-[#E8A020] hover:bg-[#E8A020]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kategori
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Kategori</p>
              <p className="text-2xl font-bold text-[#0F1C3F]">{categories.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Kursus</p>
              <p className="text-2xl font-bold text-[#0F1C3F]">
                {categories.reduce((sum, cat) => sum + cat._count.courses, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Rata-rata Kursus</p>
              <p className="text-2xl font-bold text-[#0F1C3F]">
                {categories.length > 0
                  ? Math.round(
                      categories.reduce((sum, cat) => sum + cat._count.courses, 0) /
                        categories.length
                    )
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Nama Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Jumlah Kursus
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Belum ada kategori</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Klik tombol &quot;Tambah Kategori&quot; untuk membuat kategori baru
                    </p>
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-semibold text-[#0F1C3F]">
                          {category.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {category._count.courses} kursus
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(category)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(category)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={category._count.courses > 0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
              className="bg-[#E8A020] hover:bg-[#E8A020]/90"
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
              className="bg-[#E8A020] hover:bg-[#E8A020]/90"
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
