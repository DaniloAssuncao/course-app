import { UserButton } from "@clerk/nextjs";
import { Video } from "lucide-react";
import { IconBadge } from "@/components/icon-badge";

export default function Home() {
  return (
    <div className=" flex items-center gap-x-2 py-2 pl-2">
      <IconBadge icon={Video}/>
      <h2 className="text-2xl">Mux</h2>
    </div>
  );
}
