"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
}

export const LogoutButton = ({ className }: LogoutButtonProps) => {
  return (
    <Button 
      variant="ghost" 
      onClick={() => signOut()}
      className={cn("text-red-600 hover:text-red-700 hover:bg-red-50 font-bold transition-all", className)}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  );
};
