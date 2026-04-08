"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export const LogoutButton = () => {
  return (
    <Button 
      variant="ghost" 
      onClick={() => signOut()}
      className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold transition-all"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  );
};
