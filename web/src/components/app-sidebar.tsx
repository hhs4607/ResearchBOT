"use client";

import { BookOpen, Home, Settings, Download } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";

const items = [
  { title: "Home & Search", url: "/", icon: Home },
  { title: "Database", url: "/papers", icon: BookOpen },
  { title: "Export", url: "/export", icon: Download },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (url: string) => {
    if (url === "/") return pathname === "/" || pathname.startsWith("/search");
    return pathname.startsWith(url);
  };

  return (
    <Sidebar variant="inset" className="border-r">
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
          <span className="text-xl font-bold">ResearchBot</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive(item.url)}
                  >
                    <Link
                      href={item.url}
                      className="flex items-center gap-2"
                      aria-current={isActive(item.url) ? "page" : undefined}
                    >
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <ModeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
