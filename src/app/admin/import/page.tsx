/**
 * Admin Import Dashboard
 * Central hub for all bulk import operations
 */

import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileSpreadsheet, 
  Users, 
  BookOpen, 
  UserPlus,
  Download,
  Upload
} from "lucide-react";

export const metadata: Metadata = {
  title: "Import Data - Admin Dashboard",
  description: "Bulk import questions, users, and enrollments from Excel files",
};

export default function ImportPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Data</h1>
        <p className="text-muted-foreground">
          Bulk import questions, users, and enrollments from Excel files
        </p>
      </div>

      {/* Import Options Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Questions Import */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <CardTitle>Import Questions</CardTitle>
            </div>
            <CardDescription>
              Upload Excel file with questions and answers for tests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              • Support for multiple choice questions
              • Automatic validation
              • Preview before import
            </div>
            <div className="flex space-x-2">
              <Button asChild className="flex-1">
                <Link href="/admin/import/questions">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/api/admin/import/templates/questions">
                  <Download className="mr-2 h-4 w-4" />
                  Template
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Import */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <CardTitle>Import Users</CardTitle>
            </div>
            <CardDescription>
              Upload Excel file with user data and credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              • Auto-generate passwords
              • Email welcome messages
              • Duplicate detection
            </div>
            <div className="flex space-x-2">
              <Button asChild className="flex-1">
                <Link href="/admin/import/users">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/api/admin/import/templates/users">
                  <Download className="mr-2 h-4 w-4" />
                  Template
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enrollments Import */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-purple-600" />
              <CardTitle>Import Enrollments</CardTitle>
            </div>
            <CardDescription>
              Upload Excel file to enroll users in courses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              • Auto-match users and courses
              • Set custom deadlines
              • Send notifications
            </div>
            <div className="flex space-x-2">
              <Button asChild className="flex-1">
                <Link href="/admin/import/enrollments">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/api/admin/import/templates/enrollments">
                  <Download className="mr-2 h-4 w-4" />
                  Template
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guidelines */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5 text-orange-600" />
            <CardTitle>Import Guidelines</CardTitle>
          </div>
          <CardDescription>
            Important information before importing data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">File Requirements</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Excel format (.xlsx) only</li>
                <li>• Maximum file size: 5MB</li>
                <li>• Maximum 1000 rows per import</li>
                <li>• Use provided templates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Best Practices</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Download template first</li>
                <li>• Preview data before importing</li>
                <li>• Check for duplicates</li>
                <li>• Backup data before large imports</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}