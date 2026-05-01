"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { enroll } from "@/actions/course";

interface EnrollButtonProps {
  courseId: string;
}

export const EnrollButton = ({
  courseId,
}: EnrollButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onClick = async () => {
    try {
      setIsLoading(true);
      await enroll(courseId);
      toast.success("Successfully enrolled!");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      size="sm"
      className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
    >
      Enroll Now
    </Button>
  );
}
