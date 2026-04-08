"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash, Plus, Check, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { addOption, deleteOption, updateQuestion } from "@/actions/test";
import { cn } from "@/lib/utils";

interface QuestionItemProps {
  question: any;
  testId: string;
  onDelete: (id: string) => void;
}

const questionSchema = z.object({
  text: z.string().min(1),
});

const optionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean().default(false),
});

export const QuestionItem = ({
  question,
  testId,
  onDelete,
}: QuestionItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof questionSchema>>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: question.text,
    },
  });

  const optionForm = useForm<z.infer<typeof optionSchema>>({
    resolver: zodResolver(optionSchema),
    defaultValues: {
      text: "",
      isCorrect: false,
    },
  });

  const onQuestionSubmit = async (values: z.infer<typeof questionSchema>) => {
    try {
      await updateQuestion(question.id, values);
      toast.success("Question updated");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const onOptionSubmit = async (values: z.infer<typeof optionSchema>) => {
    try {
      await addOption(question.id, values);
      toast.success("Option added");
      setIsAddingOption(false);
      optionForm.reset();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const removeOption = async (id: string) => {
    try {
      await deleteOption(id);
      toast.success("Option removed");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onQuestionSubmit)} className="flex items-center gap-x-2 flex-1">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input {...field} className="h-8" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button size="sm" type="submit">Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            </form>
          </Form>
        ) : (
          <h4 className="font-bold text-slate-700">{question.text}</h4>
        )}
        <div className="flex items-center gap-x-2 ml-4">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(question.id)}>
            <Trash className="h-4 w-4 text-rose-500" />
          </Button>
        </div>
      </div>

      <div className="pl-4 space-y-2 border-l-2 border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Options</p>
        {question.options?.map((option: any) => (
          <div key={option.id} className="flex items-center justify-between p-2 rounded-md bg-slate-50 group">
            <div className="flex items-center gap-x-2">
              {option.isCorrect ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <X className="h-4 w-4 text-slate-300" />
              )}
              <span className={cn("text-sm", option.isCorrect && "font-bold text-emerald-600")}>
                {option.text}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeOption(option.id)} className="opacity-0 group-hover:opacity-100 transition">
              <Trash className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {isAddingOption ? (
          <Form {...optionForm}>
            <form onSubmit={optionForm.handleSubmit(onOptionSubmit)} className="flex items-center gap-x-2 pt-2">
              <FormField
                control={optionForm.control}
                name="text"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Option text..." {...field} className="h-8" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={optionForm.control}
                name="isCorrect"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <span className="text-xs font-medium">Correct?</span>
                  </FormItem>
                )}
              />
              <Button size="sm" type="submit">Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAddingOption(false)}>Cancel</Button>
            </form>
          </Form>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setIsAddingOption(true)} className="text-blue-600 hover:text-blue-700 p-0 text-xs h-auto">
            <Plus className="h-3 w-3 mr-1" />
            Add option
          </Button>
        )}
      </div>
    </div>
  );
};
