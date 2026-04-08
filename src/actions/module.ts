"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function completeModule(moduleId: string, isCompleted: boolean) {
  const session = await auth();

  if (!session || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  const progress = await db.userProgress.upsert({
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

  const module = await db.module.findUnique({
    where: { id: moduleId },
  });

  if (module) {
    revalidatePath(`/courses/${module.courseId}/modules/${moduleId}`);
    revalidatePath(`/courses/${module.courseId}`);
  }

  return progress;
}

export async function createModule(courseId: string, data: { title: string; position: number }) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const module = await db.module.create({
    data: {
      courseId,
      title: data.title,
      position: data.position,
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  return module;
}

export async function updateModule(id: string, values: any) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const module = await db.module.update({
    where: { id },
    data: { ...values },
  });

  revalidatePath(`/admin/courses/${module.courseId}`);
  return module;
}

export async function deleteModule(id: string) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const existingModule = await db.module.findUnique({
    where: { id },
  });

  if (!existingModule) throw new Error("Module not found");

  const module = await db.module.delete({
    where: { id },
  });

  revalidatePath(`/admin/courses/${module.courseId}`);
  return module;
}
