/**
 * Admin Course Tests List Page
 * Shows all tests (PRE and POST) for a specific course
 */

import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Course Tests - Admin Dashboard",
  description: "Manage course tests",
};

interface PageProps {
  params: {
    courseId: string;
  };
}

export default async function CourseTestsPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Admin layout already handles authorization, but double-check
  const activeRole = session.user.activeRole;
  if (activeRole !== "ADMIN" && activeRole !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const { courseId } = params;

  // Fetch course with tests
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      tests: {
        orderBy: { type: "asc" },
        include: {
          questions: true,
          _count: {
            select: {
              attempts: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const preTest = course.tests.find((t) => t.type === "PRE");
  const postTest = course.tests.find((t) => t.type === "POST");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/admin/courses/${courseId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Course Tests</h1>
          <p className="text-muted-foreground">{course.title}</p>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pre-Test */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <CardTitle>Pre-Test</CardTitle>
              </div>
              {preTest ? (
                <Button size="sm" asChild>
                  <Link href={`/admin/courses/${courseId}/tests/${preTest.id}`}>
                    View
                  </Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              )}
            </div>
            <CardDescription>
              Test sebelum memulai course untuk mengukur pengetahuan awal
            </CardDescription>
          </CardHeader>
          <CardContent>
            {preTest ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-medium">{preTest.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{preTest.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passing Score:</span>
                  <span className="font-medium">{preTest.passingScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Attempts:</span>
                  <span className="font-medium">
                    {preTest.maxAttempts === 0 ? "Unlimited" : preTest.maxAttempts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Attempts:</span>
                  <span className="font-medium">{preTest._count.attempts}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No pre-test created yet. Pre-test helps measure initial knowledge.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Post-Test */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600" />
                <CardTitle>Post-Test</CardTitle>
              </div>
              {postTest ? (
                <Button size="sm" asChild>
                  <Link href={`/admin/courses/${courseId}/tests/${postTest.id}`}>
                    View
                  </Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              )}
            </div>
            <CardDescription>
              Test setelah menyelesaikan course untuk mengukur pemahaman
            </CardDescription>
          </CardHeader>
          <CardContent>
            {postTest ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-medium">{postTest.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{postTest.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passing Score:</span>
                  <span className="font-medium">{postTest.passingScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Attempts:</span>
                  <span className="font-medium">
                    {postTest.maxAttempts === 0 ? "Unlimited" : postTest.maxAttempts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Attempts:</span>
                  <span className="font-medium">{postTest._count.attempts}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No post-test created yet. Post-test is required to complete the course.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Test Management</CardTitle>
          <CardDescription>
            How to manage tests for this course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Creating Tests</h4>
              <p className="text-muted-foreground">
                Tests are automatically created when you create a course. You can add questions
                using the "Import Questions" feature or manually through the test detail page.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Test Types</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Pre-Test:</strong> Optional test to measure initial knowledge</li>
                <li><strong>Post-Test:</strong> Required test to complete the course</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Quick Actions</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/import/questions">
                    Import Questions
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/courses/${courseId}`}>
                    Edit Course
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/courses/${courseId}/report`}>
                    View Reports
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
