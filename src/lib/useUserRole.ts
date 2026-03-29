"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useUserRole() {
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const fetchRole = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                setRole(user.user_metadata?.role || "collaborator");
            }
        };

        fetchRole();
    }, []);

    return role;
}