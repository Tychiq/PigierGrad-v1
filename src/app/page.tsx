"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Mail, Lock, User, Github, Chrome } from "lucide-react";

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkUser();
  }, [router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Inscription réussie ! Veuillez vérifier votre e-mail.");
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Connexion réussie !");
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-yellow-50/30 dark:from-[#0a0f1c] dark:via-[#0f1629] dark:to-[#0a0f1c] font-sans">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-yellow-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="flex flex-col items-center mb-10 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-xl opacity-30" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/40 rotate-3 hover:rotate-0 transition-transform duration-500">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tighter text-blue-900 dark:text-white">
              PIGIER<span className="text-yellow-500">GRAD</span>
            </h1>
            <p className="text-blue-600/70 dark:text-blue-400 font-medium text-sm mt-1">
              Plateforme de Gestion des Soutenances
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f1629] rounded-3xl shadow-2xl shadow-blue-900/10 p-8">
            <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-1 h-12">
              <TabsTrigger value="login" className="rounded-lg py-2 font-bold text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-[#0a0f1c] data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                Connexion
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg py-2 font-bold text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-[#0a0f1c] data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                Inscription
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="login" key="login">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={handleSignIn} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-blue-400">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <Input
                          type="email"
                          placeholder="admin@pigier.com"
                          className="pl-12 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none focus:ring-2 focus:ring-blue-500 font-medium"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-black uppercase tracking-widest text-blue-400">Mot de passe</Label>
                        <Button variant="link" className="p-0 h-auto text-xs text-blue-500 font-semibold">
                          Oublié ?
                        </Button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <Input
                          type="password"
                          className="pl-12 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none focus:ring-2 focus:ring-blue-500 font-medium"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:shadow-blue-600/40"
                      disabled={loading}
                    >
                      {loading ? "Connexion..." : "Se connecter"}
                    </Button>
                  </form>

                  <div className="relative py-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-blue-100 dark:border-blue-900" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-[#0f1629] px-4 text-blue-400 font-bold tracking-widest">Ou continuer avec</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-14 rounded-xl border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-bold"
                      onClick={() => handleOAuthSignIn('google')}
                    >
                      <Chrome className="w-5 h-5 mr-2 text-blue-500" />
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      className="h-14 rounded-xl border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-bold"
                      onClick={() => handleOAuthSignIn('github')}
                    >
                      <Github className="w-5 h-5 mr-2" />
                      GitHub
                    </Button>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="signup" key="signup">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={handleSignUp} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-blue-400">Nom complet</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <Input
                          placeholder="Jean Dupont"
                          className="pl-12 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none focus:ring-2 focus:ring-blue-500 font-medium"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-blue-400">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <Input
                          type="email"
                          placeholder="admin@pigier.com"
                          className="pl-12 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none focus:ring-2 focus:ring-blue-500 font-medium"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-blue-400">Mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <Input
                          type="password"
                          className="pl-12 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none focus:ring-2 focus:ring-blue-500 font-medium"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:shadow-blue-600/40"
                      disabled={loading}
                    >
                      {loading ? "Création..." : "Créer un compte"}
                    </Button>
                  </form>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>

        <footer className="mt-10 text-center">
          <p className="text-xs text-blue-400 dark:text-blue-500 font-bold uppercase tracking-widest">
            &copy; 2024 PigierGrad | Excellence Académique
          </p>
        </footer>
      </motion.div>
    </div>
  );
}
