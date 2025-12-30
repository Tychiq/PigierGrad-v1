"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Input } from "@/components/ui/input";
import { LogOut, Menu, X, Bell, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/hooks/use-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileUp,
  GraduationCap,
  Users,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight
} from "lucide-react";

import { FooterSignature } from "@/components/footer-signature";

const sidebarItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Insertion", href: "/dashboard/insertion", icon: FileUp },
  { name: "Planning Licence", href: "/dashboard/licence", icon: GraduationCap },
  { name: "Planning Master", href: "/dashboard/master", icon: GraduationCap },
  { name: "Directeurs Licence", href: "/dashboard/directeurs-licence", icon: Users },
  { name: "Directeurs Master", href: "/dashboard/directeurs-master", icon: Users },
  { name: "Génération PV", href: "/dashboard/pv", icon: FileText },
];

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

  export default function DashboardLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [globalSearch, setGlobalSearch] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { profile } = useProfile();
    const router = useRouter();

    useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
        if (globalSearch.length > 2) {
          handleGlobalSearch();
        } else {
          setSearchResults([]);
        }
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }, [globalSearch]);

      const handleGlobalSearch = async () => {
        setIsSearching(true);
        const { data, error } = await supabase
          .from("soutenances")
          .select("id, nom, prenoms, diploma_type, speciality, theme")
          .or(`nom.ilike.%${globalSearch}%,prenoms.ilike.%${globalSearch}%,matricule.ilike.%${globalSearch}%,theme.ilike.%${globalSearch}%`)
          .limit(5);
        
        if (data) setSearchResults(data);
        setIsSearching(false);
      };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
      } else {
        setLoading(false);
        fetchNotifications();
      }
    };
    checkUser();

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

    const pathname = usePathname();

    if (loading) {

    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-[#0a0f1c] dark:to-[#0f1629]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50/50 via-white to-yellow-50/30 dark:from-[#0a0f1c] dark:via-[#0f1629] dark:to-[#0a0f1c] transition-colors duration-300 overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="fixed inset-y-0 left-0 z-50 md:relative md:flex"
          >
            <DashboardSidebar onClose={() => setSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <header className="h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-[#0f1629]/80 backdrop-blur-xl border-b border-blue-100 dark:border-blue-900/30 transition-colors duration-300 z-40">
              <div className="flex items-center gap-4 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 flex"
                >
                  {sidebarOpen ? <X className="w-5 h-5 text-blue-600" /> : <Menu className="w-5 h-5 text-blue-600" />}
                </Button>

                {/* Mobile Navigation Dropdown - Keep as backup for ease */}
                <div className="md:hidden">

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 rounded-xl bg-blue-50/50 border-blue-100 text-blue-900 font-bold flex items-center gap-2">
                      <Menu className="w-4 h-4" />
                      Menu
                      <ChevronDown className="w-4 h-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 rounded-2xl border-none shadow-2xl p-2">
                    {sidebarItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link
                            href={item.href}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white' : 'text-blue-900 hover:bg-blue-50'}`}
                          >
                            <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                            <span className="text-sm font-bold">{item.name}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

                <div className="relative max-w-md w-full hidden sm:block">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearching ? 'text-blue-600 animate-pulse' : 'text-blue-400'}`} />
                <Input
                  placeholder="Rechercher un étudiant, un thème..."
                  className="pl-10 bg-blue-50/50 dark:bg-blue-900/20 border-none rounded-xl h-10 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                />

                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0f1629] rounded-2xl shadow-2xl border border-blue-50 dark:border-blue-900/30 overflow-hidden z-50"
                    >
                      <div className="p-2">
                        {searchResults.map((result) => (
                          <button
                            key={result.id}
                            onClick={() => {
                              router.push(`/dashboard/${result.diploma_type.toLowerCase()}?search=${result.nom}`);
                              setSearchResults([]);
                              setGlobalSearch("");
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-left group"
                          >
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 font-black text-xs uppercase group-hover:bg-blue-600 group-hover:text-white transition-all">
                              {result.nom.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-blue-900 dark:text-white truncate uppercase">
                                {result.nom} {result.prenoms}
                              </p>
                              <p className="text-[10px] text-blue-400 font-medium uppercase tracking-tighter">
                                {result.diploma_type} • {result.speciality}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-blue-200 group-hover:text-blue-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 text-center">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                          {searchResults.length} résultats trouvés
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </div>

          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  <Bell className="w-5 h-5 text-blue-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full text-[10px] font-black text-blue-900 flex items-center justify-center shadow-lg">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-2xl border-none shadow-2xl overflow-hidden" align="end">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between">
                  <h3 className="font-black text-white uppercase tracking-tight">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-white/80 hover:text-white hover:bg-white/10 text-xs h-8"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Tout lire
                    </Button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-10 h-10 text-blue-200 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Aucune notification</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={`p-4 border-b border-blue-50 dark:border-blue-900/30 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors ${!notif.read ? 'bg-blue-50/80 dark:bg-blue-900/30' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${!notif.read ? 'bg-yellow-500' : 'bg-blue-200'}`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-foreground truncate">{notif.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                            <span className="text-[10px] text-blue-400 mt-1 block">
                              {new Date(notif.created_at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            
            <div className="h-8 w-[1px] bg-blue-100 dark:bg-blue-900/30 mx-2" />
            
            <Link href="/dashboard/profile" className="flex items-center gap-2 px-1 hover:opacity-80 transition-opacity">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-blue-900 dark:text-white leading-none">
                  {profile?.full_name || "Admin"}
                </span>
                <span className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">Connecté</span>
              </div>
                <Avatar className="w-10 h-10 rounded-full shadow-lg shadow-blue-600/30 overflow-hidden">
                  <AvatarImage src={profile?.avatar_url} className="object-cover w-full h-full" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white font-black text-xs">
                    {profile?.full_name?.charAt(0) || "AD"}
                  </AvatarFallback>
                </Avatar>
            </Link>

              <div className="h-8 w-[1px] bg-blue-100 dark:bg-blue-900/30 mx-1" />

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-blue-400 hover:text-red-500 transition-all"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative bg-transparent">
            <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
            </div>
            
              <div className="relative z-10 max-w-7xl mx-auto">
                {children}
              </div>
              <FooterSignature />
            </main>
        </div>
      </div>
    );
  }

