"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createCourse(data: { title: string; categoryId?: string }) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const course = await db.course.create({
    data: {
      userId: session.user.id!,
      title: data.title,
      categoryId: data.categoryId,
    },
  });

  revalidatePath("/admin/courses");
  return course;
}

export async function updateCourse(id: string, values: any) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const course = await db.course.update({
    where: { id },
    data: { ...values },
  });

  revalidatePath(`/admin/courses/${id}`);
  revalidatePath("/admin/courses");
  return course;
}

export async function deleteCourse(id: string) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const course = await db.course.delete({
    where: { id },
  });

  revalidatePath("/admin/courses");
  return course;
}

export async function publishCourse(id: string, isPublished: boolean) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const course = await db.course.update({
    where: { id },
    data: { isPublished },
  });

  revalidatePath(`/admin/courses/${id}`);
  revalidatePath("/dashboard");
  return course;
}

export async function createModule(courseId: string, data: { title: string }) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const lastModule = await db.module.findFirst({
    where: { courseId },
    orderBy: { position: "desc" },
  });

  const newPosition = lastModule ? lastModule.position + 1 : 1;

  const module = await db.module.create({
    data: {
      title: data.title,
      courseId,
      position: newPosition,
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  return module;
}

export async function reorderModules(courseId: string, updateData: { id: string; position: number }[]) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  for (let item of updateData) {
    await db.module.update({
      where: { id: item.id },
      data: { position: item.position }
    });
  }

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function createTest(courseId: string, data: { title: string; type: "PRE" | "POST" }) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const test = await db.test.create({
    data: {
      title: data.title,
      type: data.type,
      courseId,
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  return test;
}

export async function enroll(courseId: string) {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { deadlineDuration: true } as any
  });

  let deadline = null;
  if ((course as any)?.deadlineDuration) {
    deadline = new Date();
    deadline.setDate(deadline.getDate() + (course as any).deadlineDuration);
  }

  const enrollment = await db.enrollment.create({
    data: {
      courseId,
      userId: session.user.id!,
      deadline,
    },
  });

  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/dashboard");
  return enrollment;
}
