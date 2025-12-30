"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const next = searchParams.get("next") || "/dashboard";

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("Error exchanging code for session:", error.message);
          router.push("/?error=auth_callback");
        } else {
          router.push(next);
        }
      } else {
        // If no code, maybe we're already logged in or it's a direct visit
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push(next);
        } else {
          router.push("/");
        }
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-[#0a0f1c]">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
      <p className="text-blue-600 font-medium animate-pulse">
        Finalisation de la connexion...
      </p>
    </div>
  );
}
