"use client";

import { LogIn } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export const NavbarRoutes = () => {
  return (
    <div className="flex gap-x-2 ml-auto">
      <UserButton />
    </div>
  );
};
