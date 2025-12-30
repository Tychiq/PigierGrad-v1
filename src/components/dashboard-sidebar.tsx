"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  FileUp,
  GraduationCap,
  Users,
  FileText,
  LogOut,
  ChevronRight,
  User
} from "lucide-react";
import { motion } from "framer-motion";

const sidebarItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Insertion", href: "/dashboard/insertion", icon: FileUp },
  { name: "Planning Licence", href: "/dashboard/licence", icon: GraduationCap },
  { name: "Planning Master", href: "/dashboard/master", icon: GraduationCap },
  { name: "Directeurs Licence", href: "/dashboard/directeurs-licence", icon: Users },
  { name: "Directeurs Master", href: "/dashboard/directeurs-master", icon: Users },
  { name: "Génération PV", href: "/dashboard/pv", icon: FileText },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex flex-col h-full w-64 bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      <div className="p-6">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white dark:text-black" />
          </div>
          <span className="font-black tracking-tighter text-xl text-black dark:text-white uppercase">
            Pigier<span className="text-zinc-400">Grad</span>
          </span>
        </div>

        <nav className="space-y-1.5">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300",
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white"
                    : "text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-black dark:text-white" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300")} />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="w-1 h-4 bg-black dark:bg-white rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
              <User className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-black dark:text-white uppercase tracking-tight">Admin</span>
              <span className="text-[10px] text-zinc-400 font-medium">Pigier University</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11 px-3 rounded-xl text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all group"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 text-zinc-400 group-hover:text-red-500 transition-colors" />
          <span className="text-sm font-medium">Déconnexion</span>
        </Button>
      </div>
    </div>
  );
}
