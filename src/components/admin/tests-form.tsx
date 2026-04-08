"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PlusCircle, BookOpen } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Test, Course } from "@prisma/client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTest } from "@/actions/course";
import { deleteTest } from "@/actions/test";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Trash } from "lucide-react";

interface TestsFormProps {
  initialData: Course & { tests: Test[] };
  courseId: string;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["PRE", "POST"]),
});

export const TestsForm = ({
  initialData,
  courseId
}: TestsFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const toggleCreating = () => setIsCreating((current) => !current);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "POST",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createTest(courseId, values);
      toast.success("Test created");
      toggleCreating();
      form.reset();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  const onDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteTest(id);
      toast.success("Test deleted");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Course Tests
        <Button onClick={toggleCreating} variant="ghost">
          {isCreating ? (
            <>Cancel</>
          ) : (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add a test
            </>
          )}
        </Button>
      </div>
      {isCreating && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Title</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g. 'Final Assessment'"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Type</FormLabel>
                  <FormControl>
                    <select
                      disabled={isSubmitting}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="POST">Post-test</option>
                      <option value="PRE">Pre-test</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              disabled={!isValid || isSubmitting}
              type="submit"
            >
              Create
            </Button>
          </form>
        </Form>
      )}
      {!isCreating && (
        <div className={cn(
          "text-sm mt-2",
          !initialData.tests.length && "text-slate-500 italic"
        )}>
          {!initialData.tests.length && "No tests created."}
          <div className="space-y-2">
            {initialData.tests.map((test) => (
              <Link
                key={test.id}
                href={`/admin/courses/${courseId}/tests/${test.id}`}
                className="flex items-center justify-between bg-white border rounded-md p-3 text-sm hover:border-sky-500 transition group"
              >
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-slate-500" />
                  <span className="font-medium mr-2">[{test.type}]</span>
                  {test.title}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => onDelete(test.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash className="h-4 w-4 text-slate-500 hover:text-red-500" />
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}
      {!isCreating && (
        <p className="text-xs text-muted-foreground mt-4">
          Click on a test to manage questions.
        </p>
      )}
    </div>
  );
};
