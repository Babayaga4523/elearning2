"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function toggleModuleProgress(
  courseId: string,
  moduleId: string,
  isCompleted: boolean
) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    const userProgress = await db.userProgress.upsert({
      where: {
        userId_moduleId: {
          userId,
          moduleId,
        },
      },
      update: {
        isCompleted,
      },
      create: {
        userId,
        moduleId,
        isCompleted,
      },
    });

    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/modules/${moduleId}`);
    revalidatePath("/dashboard");

    return userProgress;
  } catch (error) {
    console.log("[MODULE_PROGRESS_ERROR]", error);
    throw new Error("Internal Error");
  }
}
