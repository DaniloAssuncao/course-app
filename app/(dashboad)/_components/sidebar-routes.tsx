"use client";

import { Cloud, Layout, Rabbit } from "lucide-react";
import { SidebarItem } from "./sidebar-item";

const guestRoutes = [
  {
    icon: Layout,
    label: "Dashboard",
    href: "/",
  },
  {
    icon: Cloud,
    label: "Browse",
    href: "/search",
  },
  {
    icon: Rabbit,
    label: "Browse",
    href: "/rabbit",
  },
];

export const SidebarRoutes = () => {
  const routes = guestRoutes;
  return <div className="flex flex-col w-full">
    {routes.map((route) => (
      <SidebarItem
        key={route.href}
        icon={route.icon}
        label={route.label}
        href={route.href}
      />
    ))}
  </div>
}