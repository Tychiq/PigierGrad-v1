import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Profile {
  id?: string;
  user_id?: string;
  full_name: string;
  avatar_url: string;
  role: string;
  phone: string;
  department: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (mounted) {
        if (profileData) {
          setProfile(profileData);
        } else {
          // Default profile if not found
          setProfile({
            full_name: user.user_metadata?.full_name || "Admin",
            avatar_url: user.user_metadata?.avatar_url || "",
            role: "admin",
            phone: "",
            department: "Pigier University",
          });
        }
        setLoading(false);
      }
    };

    fetchProfile();

    // Subscribe to profile changes
    const channel = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { profile, loading };
}
