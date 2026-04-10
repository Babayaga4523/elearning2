import { db } from "@/lib/db";

export interface IntegrityResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates if a course is ready to be published or remains valid while published.
 */
export async function validateCourse(courseId: string): Promise<IntegrityResult> {
  const errors: string[] = [];

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      modules: true,
      tests: {
        include: {
          questions: {
            include: {
              options: true
            }
          }
        }
      }
    }
  });

  if (!course) {
    return { isValid: false, errors: ["Kursus tidak ditemukan"] };
  }

  // 1. Basic Metadata
  if (!course.title || course.title.length < 3) errors.push("Judul kursus minimal 3 karakter");
  if (!course.description) errors.push("Deskripsi kursus wajib diisi");
  if (!course.categoryId) errors.push("Kategori kursus wajib dipilih");

  // 2. Modules Validation
  const publishedModules = course.modules.filter(m => m.isPublished);
  if (publishedModules.length === 0) {
    errors.push("Minimal harus ada satu modul yang dipublikasikan (Active)");
  }

  publishedModules.forEach((mod, idx) => {
    if (mod.type === "VIDEO" && !mod.url) {
      errors.push(`Modul #${idx + 1} (${mod.title}): Link video wajib diisi`);
    }
    if (mod.type === "PDF" && !mod.pdfUrl) {
      errors.push(`Modul #${idx + 1} (${mod.title}): File PDF wajib diunggah`);
    }
  });

  // 3. Post-Test Validation (Mandatory)
  const postTest = course.tests.find(t => t.type === "POST");
  if (!postTest) {
    errors.push("Post-Test wajib ada untuk dipublikasikan (Persyaratan Sertifikasi)");
  } else {
    if (postTest.questions.length < 5) {
      errors.push(`Post-Test minimal berisi 5 pertanyaan (saat ini: ${postTest.questions.length})`);
    }

    postTest.questions.forEach((q, qIdx) => {
      const hasCorrectAnswer = q.options.some(opt => opt.isCorrect);
      if (!hasCorrectAnswer) {
        errors.push(`Post-Test Pertanyaan #${qIdx + 1}: Belum ada jawaban benar yang dipilih`);
      }
      if (q.options.length < 2) {
        errors.push(`Post-Test Pertanyaan #${qIdx + 1}: Minimal harus memiliki 2 opsi jawaban`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
