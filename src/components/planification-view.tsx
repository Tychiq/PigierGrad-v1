"use client";

  import { useState, useEffect, useMemo } from "react";
  import { useRouter, useSearchParams } from "next/navigation";
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
  Filter,
  X,
  Users,
  Info,
  BadgeCheck
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate, formatTime } from "@/lib/utils";
import { LICENCE_SPECIALITIES, MASTER_SPECIALITIES } from "@/lib/constants";

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
  speciality?: string;
  session_month?: string;
  session_year?: string;
}

const ITEMS_PER_PAGE = 8;

  export function PlanificationView({ diplomaType }: { diplomaType: string }) {
    const [data, setData] = useState<Soutenance[]>([]);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get("search") || "";
    const [search, setSearch] = useState(initialSearch);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
      const urlSearch = searchParams.get("search");
      if (urlSearch !== null) {
        setSearch(urlSearch);
        setCurrentPage(1);
      }
    }, [searchParams]);
  const [editingItem, setEditingItem] = useState<Soutenance | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<Partial<Soutenance>>({});
  const [selectedSpeciality, setSelectedSpeciality] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDirector, setSelectedDirector] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sessionMonth, setSessionMonth] = useState("");
  const [sessionYear, setSessionYear] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("soutenances")
      .select("*")
      .eq("diploma_type", diplomaType)
      .order("created_at", { ascending: false });
    
    if (data && data.length > 0) {
      setData(data);
      if (data[0].session_month) setSessionMonth(data[0].session_month);
      if (data[0].session_year) setSessionYear(data[0].session_year);
    } else if (data) {
      setData(data);
    }
    setLoading(false);
  };

  const updateSessionForAll = async () => {
    try {
      const { error } = await supabase
        .from("soutenances")
        .update({ session_month: sessionMonth, session_year: sessionYear })
        .eq("diploma_type", diplomaType);
      
      if (error) throw error;
      toast.success("Session mise à jour pour tous les étudiants");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [diplomaType]);

  const uniqueSpecialities = useMemo(() => {
    const specs = new Set(data.map(item => item.speciality).filter(Boolean));
    return Array.from(specs);
  }, [data]);

  const uniqueDirectors = useMemo(() => {
    const dirs = new Set(data.map(item => item.directeur).filter(Boolean));
    return Array.from(dirs);
  }, [data]);

  const handleSave = async () => {
    try {
      const finalForm = {
        ...form,
        session_month: form.session_month || sessionMonth,
        session_year: form.session_year || sessionYear
      };

      if (editingItem) {
        const { error } = await supabase
          .from("soutenances")
          .update(finalForm)
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
          .insert({ ...finalForm, diploma_type: diplomaType });
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

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = `${item.nom} ${item.prenoms} ${item.theme} ${item.matricule} ${item.nom2 || ""} ${item.prenoms2 || ""}`.toLowerCase().includes(search.toLowerCase());
      const matchesSpeciality = selectedSpeciality === "all" || item.speciality === selectedSpeciality;
      const matchesStatus = selectedStatus === "all" || 
        (selectedStatus === "planned" && item.date_soutenance) ||
        (selectedStatus === "pending" && !item.date_soutenance);
      const matchesDirector = selectedDirector === "all" || item.directeur === selectedDirector;
      
      return matchesSearch && matchesSpeciality && matchesStatus && matchesDirector;
    });
  }, [data, search, selectedSpeciality, selectedStatus, selectedDirector]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeFiltersCount = [selectedSpeciality, selectedStatus, selectedDirector].filter(f => f !== "all").length;

  const clearFilters = () => {
    setSelectedSpeciality("all");
    setSelectedStatus("all");
    setSelectedDirector("all");
    setCurrentPage(1);
  };

  const openEditDialog = (item: Soutenance) => {
    setEditingItem(item);
    setForm(item);
    setIsDialogOpen(true);
  };

    const activeSpecialities = diplomaType === "Licence" ? LICENCE_SPECIALITIES : MASTER_SPECIALITIES;
    const { ResetEverythingButton } = require("./reset-everything-button");

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
          {sessionMonth && sessionYear && (
            <h2 className="text-lg font-bold text-blue-600/80 dark:text-blue-400/80 uppercase tracking-tight">
              Session de {sessionMonth} {sessionYear}
            </h2>
          )}
          <p className="text-blue-600/70 dark:text-blue-400 font-medium">
            {filteredData.length} étudiant(s) {activeFiltersCount > 0 && `(filtré de ${data.length})`}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="grid grid-cols-2 gap-2">
              <Input 
                placeholder="Mois (ex: Décembre)" 
                value={sessionMonth} 
                onChange={(e) => setSessionMonth(e.target.value)}
                className="h-9 text-xs rounded-lg border-blue-200"
              />
              <Input 
                placeholder="Année (ex: 2024)" 
                value={sessionYear} 
                onChange={(e) => setSessionYear(e.target.value)}
                className="h-9 text-xs rounded-lg border-blue-200"
              />
            </div>
            <Button size="sm" onClick={updateSessionForAll} className="h-9 px-3 text-[10px] font-bold uppercase">
              Appliquer Session
            </Button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
              <Input 
                placeholder="Rechercher..." 
                className="pl-10 h-12 w-64 rounded-xl border-none bg-white dark:bg-[#0f1629] shadow-lg focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className={`h-12 px-4 rounded-xl font-bold relative ${showFilters ? 'bg-blue-600 text-white' : 'border-blue-200 dark:border-blue-800'}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 rounded-full text-[10px] font-black text-blue-900 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            
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
              <DialogContent className="max-w-4xl rounded-3xl border-none shadow-2xl overflow-hidden p-0 max-h-[90vh]">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                  <DialogHeader>
                    <DialogTitle className="text-white text-2xl font-black uppercase tracking-tight">
                      {editingItem ? "Modifier la Soutenance" : "Nouvelle Soutenance"}
                    </DialogTitle>
                  </DialogHeader>
                </div>
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Informations Générales</h3>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Spécialité</Label>
                        <Select value={form.speciality || ""} onValueChange={(val) => setForm({...form, speciality: val})}>
                          <SelectTrigger className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none">
                            <SelectValue placeholder="Sélectionner une spécialité..." />
                          </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {activeSpecialities.map(spec => (
                                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                              ))}
                            </SelectContent>

                        </Select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Session</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Mois</Label>
                          <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.session_month || sessionMonth} onChange={e => setForm({...form, session_month: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Année</Label>
                          <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.session_year || sessionYear} onChange={e => setForm({...form, session_year: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-blue-50 dark:border-blue-900/20">
                    <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Étudiant 1</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Date Naissance</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.date_naissance || ""} onChange={e => setForm({...form, date_naissance: e.target.value})} />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Lieu Naissance</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.lieu_naissance || ""} onChange={e => setForm({...form, lieu_naissance: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  {diplomaType === "Licence" && (
                    <div className="space-y-4 pt-4 border-t border-blue-50 dark:border-blue-900/20">
                      <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Étudiant 2 (Optionnel)</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Date Naissance 2</Label>
                          <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.date_naissance2 || ""} onChange={e => setForm({...form, date_naissance2: e.target.value})} />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Lieu Naissance 2</Label>
                          <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.lieu_naissance2 || ""} onChange={e => setForm({...form, lieu_naissance2: e.target.value})} />
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
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-none shadow-lg bg-white dark:bg-[#0f1629] rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-blue-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-500" />
                    Filtres Avancés
                  </h3>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                      <X className="w-4 h-4 mr-1" />
                      Réinitialiser
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Spécialité</Label>
                    <Select value={selectedSpeciality} onValueChange={(val) => { setSelectedSpeciality(val); setCurrentPage(1); }}>
                      <SelectTrigger className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none">
                        <SelectValue placeholder="Toutes les spécialités" />
                      </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="all">Toutes les spécialités</SelectItem>
                          {activeSpecialities.map(spec => (
                            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                          ))}
                          {uniqueSpecialities.filter(s => !activeSpecialities.includes(s as string)).map(spec => (
                            <SelectItem key={spec} value={spec as string}>{spec}</SelectItem>
                          ))}
                        </SelectContent>

                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Statut</Label>
                    <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}>
                      <SelectTrigger className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none">
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="planned">Planifié</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Directeur</Label>
                    <Select value={selectedDirector} onValueChange={(val) => { setSelectedDirector(val); setCurrentPage(1); }}>
                      <SelectTrigger className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none">
                        <SelectValue placeholder="Tous les directeurs" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-60">
                        <SelectItem value="all">Tous les directeurs</SelectItem>
                        {uniqueDirectors.map(dir => (
                          <SelectItem key={dir} value={dir as string}>{dir}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
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
              <p className="text-blue-900 dark:text-white font-bold uppercase tracking-widest text-sm mb-2">
                {activeFiltersCount > 0 ? "Aucun résultat pour ces filtres" : "Aucune donnée disponible"}
              </p>
              <p className="text-blue-400 text-sm">
                {activeFiltersCount > 0 ? "Essayez de modifier vos critères de recherche" : "Importez des données ou ajoutez manuellement"}
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="outline" onClick={clearFilters} className="mt-4 rounded-xl">
                  Réinitialiser les filtres
                </Button>
              )}
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
                <Card className="group relative border-none bg-white dark:bg-[#0f1629] rounded-3xl hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer border border-blue-50 dark:border-blue-900/20" onClick={() => openEditDialog(item)}>
                  <div className={`absolute top-0 left-0 w-2 h-full ${diplomaType === "Licence" ? "bg-gradient-to-b from-blue-500 to-blue-700" : "bg-gradient-to-b from-yellow-400 to-yellow-600"}`} />
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Section Étudiant */}
                      <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            {item.matricule || "SANS MATRICULE"}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.date_soutenance ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>
                            {item.date_soutenance ? "Planifié" : "En attente"}
                          </span>
                        </div>
                            <div className="space-y-1">
                            <h3 className="text-2xl font-black text-blue-900 dark:text-white leading-tight uppercase">
                              {item.nom} {item.prenoms}
                            </h3>
                              <div className="flex items-center gap-2 text-xs text-blue-400 font-bold">
                                <Calendar className="w-3 h-3" />
                                <span>Né(e) le {formatDate(item.date_naissance)} à {item.lieu_naissance || "???"}</span>
                              </div>
                            </div>
                            {item.nom2 && (
                              <div className="pt-2 border-t border-blue-50 dark:border-blue-900/10">
                                <h4 className="text-xs font-black text-blue-300 uppercase tracking-widest mb-1">Binôme</h4>
                                <p className="text-sm font-bold text-blue-800 dark:text-blue-100 uppercase">
                                  {item.nom2} {item.prenoms2} ({item.matricule2})
                                </p>
                                <p className="text-[10px] text-blue-400">Né(e) le {formatDate(item.date_naissance2)} à {item.lieu_naissance2}</p>
                              </div>
                            )}

                      </div>

                      {/* Section Projet & Directeur */}
                      <div className="lg:col-span-5 space-y-4 lg:border-l lg:border-r border-blue-50 dark:border-blue-900/20 lg:px-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <BadgeCheck className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Thème du mémoire</span>
                          </div>
                          <p className="text-sm font-bold text-blue-900 dark:text-white leading-relaxed italic">
                            "{item.theme || "Thème non défini"}"
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-blue-300 uppercase">Directeur</span>
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-blue-400" />
                              <span className="text-xs font-bold text-blue-900 dark:text-white">{item.directeur}</span>
                            </div>
                            <span className="text-[9px] text-blue-400 uppercase font-black">{item.grade_directeur}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-blue-300 uppercase">Spécialité</span>
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-3 h-3 text-purple-400" />
                              <span className="text-xs font-bold text-purple-600">{item.speciality}</span>
                            </div>
                          </div>
                        </div>
                          <div className="pt-3 border-t border-blue-50 dark:border-blue-900/10 grid grid-cols-2 gap-y-3">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-blue-300 uppercase">Président</span>
                              <span className="text-xs font-bold text-blue-900 dark:text-white">{item.president || "???"}</span>
                              <span className="text-[9px] text-blue-400 uppercase">{item.grade_president}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-blue-300 uppercase">Examinateur</span>
                              <span className="text-xs font-bold text-blue-900 dark:text-white">{item.examinateur || "???"}</span>
                              <span className="text-[9px] text-blue-400 uppercase">{item.grade_examinateur}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-blue-300 uppercase">Rapporteur</span>
                              <span className="text-xs font-bold text-blue-900 dark:text-white">{item.rapporteur || "???"}</span>
                              <span className="text-[9px] text-blue-400 uppercase">{item.grade_rapporteur}</span>
                            </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-blue-300 uppercase">Dépôt</span>
                                  <span className="text-xs font-bold text-blue-900 dark:text-white">{formatDate(item.date_depot)}</span>
                                </div>

                            </div>

                      </div>

                      {/* Section Planning & Actions */}
                      <div className="lg:col-span-3 flex flex-col justify-between items-end">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="rounded-full w-10 h-10 hover:bg-blue-50 dark:hover:bg-blue-900/30" onClick={(e) => { e.stopPropagation(); openEditDialog(item); }}>
                            <Edit2 className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button size="icon" variant="ghost" className="rounded-full w-10 h-10 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(item.id, `${item.nom} ${item.prenoms}`); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2 w-full">
                          <div className="flex items-center justify-end gap-3">
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black text-blue-300 uppercase">Date</span>
                                <span className="text-sm font-black text-blue-900 dark:text-white">{item.date_soutenance ? formatDate(item.date_soutenance) : "À définir"}</span>

                            </div>
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                              <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-3">
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-blue-300 uppercase">Heure & Salle</span>
                                <span className="text-sm font-black text-blue-900 dark:text-white">{formatTime(item.heure_soutenance)} | {item.salle || "???"}</span>
                              </div>

                            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl">
                              <Clock className="w-5 h-5 text-yellow-600" />
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
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let page;
            if (totalPages <= 5) {
              page = i + 1;
            } else if (currentPage <= 3) {
              page = i + 1;
            } else if (currentPage >= totalPages - 2) {
              page = totalPages - 4 + i;
            } else {
              page = currentPage - 2 + i;
            }
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
                className={`rounded-xl w-10 h-10 ${currentPage === page ? 'bg-blue-600 text-white' : 'border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
              >
                {page}
              </Button>
            );
          })}
          
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
