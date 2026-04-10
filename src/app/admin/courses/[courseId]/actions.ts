"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ModuleSchema } from "@/lib/validations/module.schema";
import { 
  saveFileToDisk, 
  deleteFileFromDisk, 
  generateSafeFilename, 
} from "@/lib/utils/file.utils";
import { MAX_FILE_SIZE } from "@/lib/utils/file-constants";
import { auth } from "@/auth";
import { validateCourse } from "@/lib/course-integrity";

const TestSchema = z.object({
  type:               z.enum(["PRE", "POST"]),
  duration:           z.coerce.number().int().min(1, "Durasi tes minimal 1 menit"),
  passingScore:       z.coerce.number().int().min(0).max(100).default(70),
  maxAttempts:        z.coerce.number().int().min(0).default(0),
  randomizeQuestions: z.boolean().default(false),
  randomizeOptions:   z.boolean().default(false),
  questions: z.array(
    z.object({
      text:    z.string().min(10, "Pertanyaan minimal 10 karakter"),
      options: z.array(z.object({ text: z.string(), isCorrect: z.boolean() })).min(2, "Minimal 2 opsi"),
    })
  ).optional().default([]),
});

// --- Module Actions ---

/**
 * Server Action untuk upload PDF ke disk (private storage)
 */
export async function uploadPdfAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "File tidak ditemukan" };
    }

    if (file.type !== "application/pdf") {
      return { success: false, error: "Hanya file PDF yang diizinkan" };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: "Ukuran file maksimal 20MB" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = await generateSafeFilename(file.name);
    const tempPath = await saveFileToDisk(buffer, filename);

    return { 
      success: true, 
      tempPath, 
      originalFilename: file.name, 
      fileSize: file.size 
    };
  } catch (error) {
    console.error("[UPLOAD_PDF_ACTION]", error);
    return { success: false, error: "Gagal mengunggah file" };
  }
}

export async function upsertModule(
  courseId: string,
  moduleId: string | null,
  raw: unknown
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = ModuleSchema.parse(raw);

    // Persiapkan data untuk Prisma
    const dataToSave: any = {
      title: validatedData.title,
      type: validatedData.type,
      duration: validatedData.duration,
      description: validatedData.description,
      position: validatedData.order,
      isPublished: validatedData.isActive,
    };

    if (validatedData.type === "PDF") {
      dataToSave.url = validatedData.tempPath;
      dataToSave.pdfUrl = validatedData.tempPath;
      dataToSave.originalFilename = validatedData.originalFilename;
      dataToSave.fileSize = BigInt(validatedData.fileSize);
    } else {
      dataToSave.url = validatedData.url;
      dataToSave.videoUrl = validatedData.url;
    }

    if (moduleId) {
      // Jika update, cek apakah tipe berubah dari PDF ke Video (hapus file lama)
      const existing = await db.module.findUnique({ where: { id: moduleId } });
      if (existing && existing.type === "PDF" && (validatedData.type === "VIDEO" || (validatedData.type === "PDF" && existing.url !== (validatedData as any).tempPath))) {
        if (existing.url) await deleteFileFromDisk(existing.url);
      }

      const result = await db.module.update({
        where: { id: moduleId },
        data: dataToSave
      });
      
      revalidatePath(`/admin/courses/${courseId}`);

      // Auto-Draft check
      const course = await db.course.findUnique({ where: { id: courseId } });
      if (course?.isPublished) {
        const integrity = await validateCourse(courseId);
        if (!integrity.isValid) {
          await db.course.update({
            where: { id: courseId },
            data: { isPublished: false }
          });
          return { success: true, module: result, statusReverted: true, errors: integrity.errors };
        }
      }

      return { success: true, module: result };
    }

    // Jika buat baru
    const result = await db.module.create({
      data: {
        ...dataToSave,
        courseId: courseId,
      }
    });

    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true, module: result };
  } catch (error) {
    console.error("[UPSERT_MODULE]", error);
    return { success: false, error: "Gagal menyimpan modul" };
  }
}

export async function deleteModule(courseId: string, moduleId: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const module = await db.module.findUnique({ where: { id: moduleId } });
    
    if (module && module.type === "PDF" && module.url) {
      await deleteFileFromDisk(module.url);
    }

    await db.module.delete({ where: { id: moduleId } });
    revalidatePath(`/admin/courses/${courseId}`);

    // Auto-Draft check
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (course?.isPublished) {
      const integrity = await validateCourse(courseId);
      if (!integrity.isValid) {
        await db.course.update({
          where: { id: courseId },
          data: { isPublished: false }
        });
        return { success: true, statusReverted: true, errors: integrity.errors };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("[DELETE_MODULE]", error);
    return { success: false, error: "Gagal menghapus modul" };
  }
}

export async function reorderModules(courseId: string, orderedIds: string[]) {
  try {
    await db.$transaction(
      orderedIds.map((id, index) =>
        db.module.update({ where: { id }, data: { position: index } })
      )
    );
    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menyusun ulang modul" };
  }
}

// --- Test Actions ---
export async function upsertTest(courseId: string, raw: unknown) {
  try {
    const data = TestSchema.parse(raw);

    // Cek apakah sudah ada test dengan tipe ini untuk kursus ini
    const existing = await db.test.findFirst({
      where: { 
        courseId, 
        type: data.type as any 
      },
      include: { questions: true },
    });

    if (existing) {
      // Hapus questions lama, replace dengan yang baru (simplest strategy untuk prototipe)
      await db.question.deleteMany({ where: { testId: existing.id } });

      const updated = await db.test.update({
        where: { id: existing.id },
        data: {
          duration:           data.duration as any,
          passingScore:       data.passingScore,
          maxAttempts:        data.maxAttempts,
          randomizeQuestions: data.randomizeQuestions,
          randomizeOptions:   data.randomizeOptions,
          questions: {
            create: data.questions.map((q: any) => ({
              text:    q.text,
              options: { 
                create: q.options.map((opt: any) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect
                }))
              },
            })),
          },
        } as any,
      });
      revalidatePath(`/admin/courses/${courseId}`);
      return { success: true, test: updated };
    }

    const created = await db.test.create({
      data: {
        courseId,
        type:               data.type as any,
        duration:           data.duration as any,
        passingScore:       data.passingScore,
        maxAttempts:        data.maxAttempts,
        randomizeQuestions: data.randomizeQuestions,
        randomizeOptions:   data.randomizeOptions,
        title:        data.type === "PRE" ? "Pre-Test" : "Post-Test",
        questions: {
          create: data.questions.map((q: any) => ({
            text:    q.text,
            options: { 
              create: q.options.map((opt: any) => ({
                text: opt.text,
                isCorrect: opt.isCorrect
              }))
            },
          })),
        },
      } as any,
    });
    revalidatePath(`/admin/courses/${courseId}`);

    // Auto-Draft check
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (course?.isPublished) {
      const integrity = await validateCourse(courseId);
      if (!integrity.isValid) {
        await db.course.update({
          where: { id: courseId },
          data: { isPublished: false }
        });
        return { success: true, test: created || existing, statusReverted: true, errors: integrity.errors };
      }
    }

    return { success: true, test: created };
  } catch (error) {
    console.error("[UPSERT_TEST]", error);
    return { success: false, error: "Gagal menyimpan tes" };
  }
}

// --- Course Actions ---
export async function togglePublishCourse(courseId: string, currentStatus: boolean) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    // Only allow publishing if valid
    if (!currentStatus) {
      const integrity = await validateCourse(courseId);
      if (!integrity.isValid) {
        return { 
          success: false, 
          error: "Kursus belum memenuhi syarat publikasi (cek modul & Post-Test).",
          errors: integrity.errors 
        };
      }
    }

    const course = await db.course.update({
      where: { id: courseId },
      data: { isPublished: !currentStatus }
    });

    revalidatePath(`/admin/courses/${courseId}`);
    revalidatePath("/admin/courses");
    revalidatePath("/courses");
    
    return { success: true, isPublished: course.isPublished };
  } catch (error) {
    console.error("[PUBLISH_COURSE]", error);
    return { success: false, error: "Gagal mengubah status publikasi" };
  }
}
