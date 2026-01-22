"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CallbackClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleAuth = async () => {
            const code = searchParams.get("code");

            if (code) {
                await supabase.auth.exchangeCodeForSession(code);
                router.push("/dashboard");
            } else {
                router.push("/");
            }
        };

        handleAuth();
    }, [searchParams, router]);

    return null;
}
