"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { GraduationCap, Lock } from "lucide-react";
import { FooterSignature } from "@/components/footer-signature";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if we have a session (the reset link should have provided one)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Lien invalide ou expiré");
        router.push("/");
      }
    };
    checkSession();
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Mot de passe mis à jour !");
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-y-auto py-20 bg-gradient-to-br from-blue-50 via-white to-yellow-50/30 dark:from-[#0a0f1c] dark:via-[#0f1629] dark:to-[#0a0f1c] font-sans">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-yellow-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
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
            <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/40">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tighter text-blue-900 dark:text-white">
              PIGIER<span className="text-yellow-500">GRAD</span>
            </h1>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f1629] rounded-3xl shadow-2xl shadow-blue-900/10 p-8">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-black text-blue-900 dark:text-white uppercase tracking-tight">Nouveau mot de passe</h2>
            <p className="text-sm text-blue-600/70 dark:text-blue-400 font-medium">
              Veuillez définir votre nouveau mot de passe
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-blue-400">Nouveau mot de passe</Label>
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

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-blue-400">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                <Input
                  type="password"
                  className="pl-12 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:shadow-blue-600/40"
              disabled={loading}
            >
              {loading ? "Mise à jour..." : "Réinitialiser"}
            </Button>
          </form>
        </div>
      </motion.div>
      <FooterSignature />
    </div>
  );
}
