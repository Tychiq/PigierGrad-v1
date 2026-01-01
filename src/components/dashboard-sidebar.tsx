"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/use-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  FileUp,
  GraduationCap,
  Users,
  FileText,
  LogOut,
  User,
  Settings,
  X
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

export function DashboardSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useProfile();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex flex-col h-full w-64 bg-white dark:bg-[#0f1629] border-r border-blue-100 dark:border-blue-900/30 transition-colors duration-300 relative">
      {onClose && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden text-blue-400 hover:text-blue-600"
        >
          <X className="w-5 h-5" />
        </Button>
      )}
      <div className="p-6">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black tracking-tighter text-xl text-blue-900 dark:text-white uppercase leading-none">
              Pigier<span className="text-yellow-500">Grad</span>
            </span>
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Soutenances</span>
          </div>
        </div>

        <nav className="space-y-1.5">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-300",
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30"
                    : "text-blue-900/70 dark:text-blue-100/70 hover:text-blue-900 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300")} />
                  <span className="text-sm font-semibold">{item.name}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="w-1.5 h-5 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-blue-100 dark:border-blue-900/30 space-y-4">
        <Link
          href="/dashboard/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
            pathname === "/dashboard/profile"
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-white"
              : "text-blue-900/70 dark:text-blue-100/70 hover:bg-blue-50 dark:hover:bg-blue-900/30"
          )}
        >
          <Settings className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-semibold">Mon Profil</span>
        </Link>
        
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Avatar className="w-9 h-9 border-2 border-white dark:border-blue-900 shadow-lg">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-blue-900 text-[10px] font-black">
                  {profile?.full_name?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-blue-900 dark:text-white uppercase tracking-tight truncate max-w-[100px]">
                  {profile?.full_name || "Admin"}
                </span>
                <span className="text-[10px] text-blue-400 font-medium truncate max-w-[100px]">
                  {profile?.department || "Université Pigier "}
                </span>
              </div>
            </div>
            <ThemeToggle />
          </div>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11 px-3 rounded-xl text-blue-900/70 dark:text-blue-100/70 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all group"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 text-blue-400 group-hover:text-red-500 transition-colors" />
          <span className="text-sm font-semibold">Déconnexion</span>
        </Button>
      </div>
    </div>
  );
}
