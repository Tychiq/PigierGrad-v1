"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  GraduationCap
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Soutenance {
  id: string;
  matricule: string;
  nom: string;
  prenoms: string;
  theme: string;
  directeur: string;
  grade_directeur: string;
  jury: string;
  salle: string;
  date_soutenance: string;
  heure_soutenance: string;
  diploma_type: string;
}

export function PlanificationView({ diplomaType }: { diplomaType: string }) {
  const [data, setData] = useState<Soutenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Soutenance | null>(null);

  // Form State
  const [form, setForm] = useState<Partial<Soutenance>>({});

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("soutenances")
      .select("*")
      .eq("diploma_type", diplomaType)
      .order("created_at", { ascending: false });
    
    if (data) setData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [diplomaType]);

  const handleSave = async () => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from("soutenances")
          .update({ ...form })
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Mis à jour avec succès");
      } else {
        const { error } = await supabase
          .from("soutenances")
          .insert({ ...form, diploma_type: diplomaType });
        if (error) throw error;
        toast.success("Ajouté avec succès");
      }
      setIsDialogOpen(false);
      setEditingItem(null);
      setForm({});
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet enregistrement ?")) return;
    const { error } = await supabase.from("soutenances").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Supprimé");
      fetchData();
    }
  };

  const filteredData = data.filter(item => 
    `${item.nom} ${item.prenoms} ${item.theme}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tighter text-black dark:text-white uppercase italic">
            Planification <span className="text-zinc-400 not-italic">{diplomaType}</span>
          </h1>
          <p className="text-zinc-500 font-medium">Gérez et organisez les sessions de soutenance</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input 
              placeholder="Rechercher..." 
              className="pl-10 h-12 w-64 rounded-xl border-none bg-white dark:bg-black shadow-sm focus:ring-1 focus:ring-zinc-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) { setEditingItem(null); setForm({}); }
          }}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-xs hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-3xl border-none shadow-2xl overflow-hidden p-0">
              <div className="bg-black dark:bg-white p-8">
                <DialogHeader>
                  <DialogTitle className="text-white dark:text-black text-2xl font-black uppercase tracking-tight">
                    {editingItem ? "Modifier la Soutenance" : "Nouvelle Soutenance"}
                  </DialogTitle>
                </DialogHeader>
              </div>
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Nom</Label>
                    <Input className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none" value={form.nom || ""} onChange={e => setForm({...form, nom: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Prénoms</Label>
                    <Input className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none" value={form.prenoms || ""} onChange={e => setForm({...form, prenoms: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Thème</Label>
                  <Input className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none" value={form.theme || ""} onChange={e => setForm({...form, theme: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Directeur</Label>
                    <Input className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none" value={form.directeur || ""} onChange={e => setForm({...form, directeur: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Grade Directeur</Label>
                    <Input className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none" value={form.grade_directeur || ""} onChange={e => setForm({...form, grade_directeur: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Date</Label>
                    <Input type="date" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none" value={form.date_soutenance || ""} onChange={e => setForm({...form, date_soutenance: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Heure</Label>
                    <Input type="time" className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none" value={form.heure_soutenance || ""} onChange={e => setForm({...form, heure_soutenance: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Salle</Label>
                    <Input className="h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none" value={form.salle || ""} onChange={e => setForm({...form, salle: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter className="p-8 bg-zinc-50 dark:bg-zinc-900">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-12 px-8 rounded-xl font-bold">Annuler</Button>
                <Button onClick={handleSave} className="h-12 px-8 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-xs">
                  {editingItem ? "Enregistrer" : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-white dark:bg-black rounded-3xl animate-pulse border border-zinc-100 dark:border-zinc-800" />
            ))
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-black rounded-3xl border border-zinc-100 dark:border-zinc-800">
              <GraduationCap className="w-12 h-12 text-zinc-200 mb-4" />
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">Aucune donnée disponible</p>
            </div>
          ) : (
            filteredData.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="group relative border-none bg-white dark:bg-black rounded-3xl hover:shadow-2xl hover:shadow-zinc-200 dark:hover:shadow-black transition-all duration-500 overflow-hidden cursor-pointer" onClick={() => { setEditingItem(item); setForm(item); setIsDialogOpen(true); }}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-stretch">
                      {/* Left Accent */}
                      <div className="w-2 bg-black dark:bg-white" />
                      
                      <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-2 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded uppercase tracking-tighter">
                              {item.matricule || "SANS MATRICULE"}
                            </span>
                          </div>
                          <h3 className="text-2xl font-black text-black dark:text-white leading-tight uppercase tracking-tight">
                            {item.nom} <span className="text-zinc-400">{item.prenoms}</span>
                          </h3>
                          <p className="text-sm text-zinc-500 font-medium italic line-clamp-1">
                            "{item.theme}"
                          </p>
                        </div>

                        <div className="space-y-4 border-l border-zinc-100 dark:border-zinc-800 pl-8 hidden lg:block">
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-zinc-400" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-zinc-300 uppercase leading-none">Directeur</span>
                              <span className="text-sm font-bold text-black dark:text-white leading-tight">{item.directeur}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-zinc-400" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-zinc-300 uppercase leading-none">Date</span>
                              <span className="text-sm font-bold text-black dark:text-white leading-tight">{item.date_soutenance || "Non définie"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between items-end">
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="rounded-full w-10 h-10 hover:bg-zinc-100 dark:hover:bg-zinc-900" onClick={(e) => { e.stopPropagation(); setEditingItem(item); setForm(item); setIsDialogOpen(true); }}>
                              <Edit2 className="w-4 h-4 text-zinc-500" />
                            </Button>
                            <Button size="icon" variant="ghost" className="rounded-full w-10 h-10 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mt-4">
                            <Clock className="w-4 h-4 text-zinc-400" />
                            <span className="text-sm font-black text-black dark:text-white">{item.heure_soutenance || "--:--"}</span>
                            <div className="w-8 h-[1px] bg-zinc-200 mx-2" />
                            <MapPin className="w-4 h-4 text-zinc-400" />
                            <span className="text-sm font-black text-black dark:text-white uppercase">{item.salle || "???"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
