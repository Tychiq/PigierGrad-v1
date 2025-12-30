"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  Edit2, 
  Trash2, 
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users
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
  date_naissance: string;
  lieu_naissance: string;
  matricule2?: string;
  nom2?: string;
  prenoms2?: string;
  date_naissance2?: string;
  lieu_naissance2?: string;
  theme: string;
  directeur: string;
  grade_directeur: string;
  date_depot: string;
  jury: string;
  salle: string;
  date_soutenance: string;
  heure_soutenance: string;
  president: string;
  grade_president: string;
  examinateur: string;
  grade_examinateur: string;
  rapporteur: string;
  grade_rapporteur: string;
  diploma_type: string;
}

const ITEMS_PER_PAGE = 8;

export function PlanificationView({ diplomaType }: { diplomaType: string }) {
  const [data, setData] = useState<Soutenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Soutenance | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
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
        
        await supabase.from("notifications").insert({
          title: "Soutenance Modifiée",
          message: `Les informations de ${form.nom} ${form.prenoms}${form.nom2 ? ' & ' + form.nom2 : ''} ont été mises à jour.`,
          type: "info"
        });
      } else {
        const { error } = await supabase
          .from("soutenances")
          .insert({ ...form, diploma_type: diplomaType });
        if (error) throw error;
        toast.success("Ajouté avec succès");
        
        await supabase.from("notifications").insert({
          title: "Nouvelle Inscription",
          message: `${form.nom} ${form.prenoms}${form.nom2 ? ' & ' + form.nom2 : ''} a été ajouté(e) au planning ${diplomaType}.`,
          type: "success"
        });
      }
      setIsDialogOpen(false);
      setEditingItem(null);
      setForm({});
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const { error } = await supabase.from("soutenances").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Supprimé");
      await supabase.from("notifications").insert({
        title: "Soutenance Supprimée",
        message: `${name} a été retiré(e) du planning.`,
        type: "warning"
      });
      fetchData();
    }
  };

  const filteredData = data.filter(item => 
    `${item.nom} ${item.prenoms} ${item.theme} ${item.matricule}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const openEditDialog = (item: Soutenance) => {
    setEditingItem(item);
    setForm(item);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Planning Académique</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-blue-900 dark:text-white uppercase">
            Soutenances <span className={diplomaType === "Licence" ? "text-blue-500" : "text-yellow-500"}>{diplomaType}</span>
          </h1>
          <p className="text-blue-600/70 dark:text-blue-400 font-medium">
            {filteredData.length} étudiant(s) enregistré(s)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
            <Input 
              placeholder="Rechercher..." 
              className="pl-10 h-12 w-64 rounded-xl border-none bg-white dark:bg-[#0f1629] shadow-lg focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) { setEditingItem(null); setForm({}); }
          }}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg shadow-blue-600/30">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl rounded-3xl border-none shadow-2xl overflow-hidden p-0 max-h-[90vh]">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <DialogHeader>
                  <DialogTitle className="text-white text-2xl font-black uppercase tracking-tight">
                    {editingItem ? "Modifier la Soutenance" : "Nouvelle Soutenance"}
                  </DialogTitle>
                </DialogHeader>
              </div>
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Étudiant 1</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Matricule</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.matricule || ""} onChange={e => setForm({...form, matricule: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Nom</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.nom || ""} onChange={e => setForm({...form, nom: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Prénoms</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.prenoms || ""} onChange={e => setForm({...form, prenoms: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  {diplomaType === "Licence" && (
                    <div className="space-y-4 pt-4 border-t border-blue-50 dark:border-blue-900/20">
                      <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Étudiant 2 (Optionnel)</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Matricule 2</Label>
                          <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.matricule2 || ""} onChange={e => setForm({...form, matricule2: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Nom 2</Label>
                          <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.nom2 || ""} onChange={e => setForm({...form, nom2: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Prénoms 2</Label>
                          <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.prenoms2 || ""} onChange={e => setForm({...form, prenoms2: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t border-blue-50 dark:border-blue-900/20">
                    <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Soutenance</h3>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Thème</Label>
                      <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.theme || ""} onChange={e => setForm({...form, theme: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Directeur</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.directeur || ""} onChange={e => setForm({...form, directeur: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Grade Directeur</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.grade_directeur || ""} onChange={e => setForm({...form, grade_directeur: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Date Soutenance</Label>
                        <Input type="date" className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.date_soutenance || ""} onChange={e => setForm({...form, date_soutenance: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Heure</Label>
                        <Input type="time" className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.heure_soutenance || ""} onChange={e => setForm({...form, heure_soutenance: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Salle</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.salle || ""} onChange={e => setForm({...form, salle: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-blue-50 dark:border-blue-900/20">
                    <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Jury</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Président</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.president || ""} onChange={e => setForm({...form, president: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Grade Président</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.grade_president || ""} onChange={e => setForm({...form, grade_president: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Examinateur</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.examinateur || ""} onChange={e => setForm({...form, examinateur: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Grade Examinateur</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.grade_examinateur || ""} onChange={e => setForm({...form, grade_examinateur: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Rapporteur</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.rapporteur || ""} onChange={e => setForm({...form, rapporteur: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Grade Rapporteur</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.grade_rapporteur || ""} onChange={e => setForm({...form, grade_rapporteur: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>
              <DialogFooter className="p-6 bg-blue-50 dark:bg-blue-900/20">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-12 px-8 rounded-xl font-bold">Annuler</Button>
                <Button onClick={handleSave} className="h-12 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black uppercase tracking-widest text-xs">
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
              <div key={i} className="h-32 bg-white dark:bg-[#0f1629] rounded-3xl animate-pulse shadow-lg" />
            ))
          ) : paginatedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#0f1629] rounded-3xl shadow-lg">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="w-10 h-10 text-blue-400" />
              </div>
              <p className="text-blue-900 dark:text-white font-bold uppercase tracking-widest text-sm mb-2">Aucune donnée disponible</p>
              <p className="text-blue-400 text-sm">Importez des données ou ajoutez manuellement</p>
            </div>
          ) : (
            paginatedData.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="group relative border-none bg-white dark:bg-[#0f1629] rounded-2xl hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer" onClick={() => openEditDialog(item)}>
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${diplomaType === "Licence" ? "bg-gradient-to-b from-blue-500 to-blue-600" : "bg-gradient-to-b from-yellow-400 to-yellow-500"}`} />
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-stretch">
                      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-2 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                              {item.matricule || "SANS MATRICULE"}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.date_soutenance ? 'bg-green-100 dark:bg-green-900/50 text-green-600' : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600'}`}>
                              {item.date_soutenance ? "Planifié" : "En attente"}
                            </span>
                          </div>
                          <h3 className="text-xl font-black text-blue-900 dark:text-white leading-tight">
                            {item.nom} <span className="text-blue-400">{item.prenoms}</span>
                          </h3>
                          <p className="text-sm text-blue-500 dark:text-blue-400 font-medium italic line-clamp-1">
                            "{item.theme || "Thème non défini"}"
                          </p>
                        </div>

                        <div className="space-y-3 border-l border-blue-100 dark:border-blue-900/50 pl-6 hidden lg:block">
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-blue-400" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-blue-300 uppercase leading-none">Directeur</span>
                              <span className="text-sm font-bold text-blue-900 dark:text-white leading-tight">{item.directeur || "Non défini"}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-blue-300 uppercase leading-none">Date</span>
                              <span className="text-sm font-bold text-blue-900 dark:text-white leading-tight">{item.date_soutenance || "Non définie"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between items-end">
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="rounded-full w-10 h-10 hover:bg-blue-50 dark:hover:bg-blue-900/30" onClick={(e) => { e.stopPropagation(); openEditDialog(item); }}>
                              <Edit2 className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button size="icon" variant="ghost" className="rounded-full w-10 h-10 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(item.id, `${item.nom} ${item.prenoms}`); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-3 mt-4">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                              <Clock className="w-3 h-3 text-blue-500" />
                              <span className="text-xs font-bold text-blue-900 dark:text-white">{item.heure_soutenance || "--:--"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/30 rounded-full">
                              <MapPin className="w-3 h-3 text-yellow-600" />
                              <span className="text-xs font-bold text-blue-900 dark:text-white uppercase">{item.salle || "???"}</span>
                            </div>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-xl border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => setCurrentPage(page)}
              className={`rounded-xl w-10 h-10 ${currentPage === page ? 'bg-blue-600 text-white' : 'border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-xl border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
