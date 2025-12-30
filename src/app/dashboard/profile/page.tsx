"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Camera, 
  Save, 
  Loader2,
  Shield,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Profile {
  id?: string;
  user_id?: string;
  full_name: string;
  avatar_url: string;
  role: string;
  phone: string;
  department: string;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    avatar_url: "",
    role: "admin",
    phone: "",
    department: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        } else {
          setProfile(prev => ({
            ...prev,
            full_name: user.user_metadata?.full_name || "",
            avatar_url: user.user_metadata?.avatar_url || "",
          }));
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let error;
    if (existingProfile) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ ...profile, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ ...profile, user_id: user.id });
      error = insertError;
    }

    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Profil mis à jour avec succès !");
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error("Erreur lors du téléchargement");
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
    toast.success("Photo de profil mise à jour !");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">
          Mon Profil
        </h1>
        <p className="text-muted-foreground font-medium">
          Gérez vos informations personnelles et préférences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-950 text-white rounded-3xl overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="relative group mb-6">
                <Avatar className="w-32 h-32 border-4 border-white/20 shadow-2xl">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="bg-yellow-500 text-blue-900 text-3xl font-black">
                    {profile.full_name?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-yellow-400 transition-colors group-hover:scale-110">
                  <Camera className="w-5 h-5 text-blue-900" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight mb-1">
                {profile.full_name || "Admin"}
              </h2>
              <p className="text-blue-200 text-sm font-medium mb-4">{user?.email}</p>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
                <Shield className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold uppercase tracking-widest">{profile.role}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="border-none shadow-lg bg-card rounded-3xl overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-xl font-black uppercase tracking-tight">Informations Personnelles</CardTitle>
              <CardDescription>Mettez à jour vos coordonnées et informations</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nom Complet</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-12 h-14 rounded-2xl bg-muted border-none text-base font-semibold"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="Jean Dupont"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-12 h-14 rounded-2xl bg-muted border-none text-base font-semibold"
                      value={user?.email || ""}
                      disabled
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-12 h-14 rounded-2xl bg-muted border-none text-base font-semibold"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+229 97 00 00 00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Département</Label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-12 h-14 rounded-2xl bg-muted border-none text-base font-semibold"
                      value={profile.department}
                      onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                      placeholder="Administration"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:shadow-blue-600/40"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5 mr-2" />
                  )}
                  {saving ? "Enregistrement..." : "Sauvegarder"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
