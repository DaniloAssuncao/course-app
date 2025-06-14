import { Menu } from "lucide-react";

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";



export const MobileSidebar = () => {
  return (
    <Sheet>
      <SheetTrigger className="md:hidden pr-4 hover:opacity-75 transition">
        <Menu className="h-4 w-4" />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-white">
      <SheetTitle className="sr-only">Menu</SheetTitle>
        <Sidebar/>
      </SheetContent>
    </Sheet>
  )
};
