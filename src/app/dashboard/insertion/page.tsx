"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  FileUp, 
  FileSpreadsheet, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function InsertionPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [diplomaType, setDiplomaType] = useState<string>("Licence");
  const [fileName, setFileName] = useState<string | null>(null);

  const processExcel = async (file: File) => {
    setLoading(true);
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

        const formattedData = jsonData.map((row) => ({
          matricule: row["Matricule"] || "",
          nom: row["Nom"] || "",
          prenoms: row["Prenoms"] || "",
          date_naissance: row["DateNaiss"] || "",
          lieu_naissance: row["LieuNaiss"] || "",
          theme: row["Theme"] || "",
          directeur: row["Directeur"] || "",
          grade_directeur: row["GradeDirecteur"] || "",
          date_depot: row["DateDepot"] || "",
          jury: row["Jury"] || "",
          salle: row["Salle"] || "",
          date_soutenance: row["Date"] || "",
          heure_soutenance: row["Heure"] || "",
          president: row["Président"] || "",
          grade_president: row["GradePrésident"] || "",
          examinateur: row["Examinateur"] || "",
          grade_examinateur: row["GradeExaminateur"] || "",
          rapporteur: row["Rapporteur"] || "",
          grade_rapporteur: row["GradeRapporteur"] || "",
          diploma_type: diplomaType,
        }));

        // Filter out empty rows (where name is missing)
        const validData = formattedData.filter(d => d.nom);

        const { error } = await supabase.from("soutenances").insert(validData);

        if (error) throw error;

        setSuccess(true);
        toast.success(`${validData.length} étudiants importés avec succès !`);
      } catch (err: any) {
        toast.error("Erreur lors de l'importation : " + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processExcel(acceptedFiles[0]);
    }
  }, [diplomaType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
  });

  const reset = () => {
    setSuccess(false);
    setFileName(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-black dark:text-white uppercase">
          Importation de Données
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">
          Téléchargez vos fichiers Excel pour alimenter la plateforme
        </p>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-black rounded-3xl overflow-hidden">
        <CardContent className="p-10">
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Type de Diplôme</label>
                    <Select value={diplomaType} onValueChange={setDiplomaType}>
                      <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none text-lg font-bold">
                        <SelectValue placeholder="Choisir le diplôme" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        <SelectItem value="Licence" className="py-3 font-bold">Licence</SelectItem>
                        <SelectItem value="Master" className="py-3 font-bold">Master</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="p-3 bg-white dark:bg-black rounded-xl shadow-sm">
                      <FileSpreadsheet className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-black dark:text-white uppercase tracking-tight">Format Requis</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Utilisez le template standard (.xlsx)</p>
                    </div>
                  </div>
                </div>

                <div
                  {...getRootProps()}
                  className={`
                    relative group cursor-pointer border-2 border-dashed rounded-[2.5rem] p-16 transition-all duration-500
                    ${isDragActive ? "border-black dark:border-white bg-zinc-50 dark:bg-zinc-900 scale-[0.98]" : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center text-center space-y-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-black dark:bg-white rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                      <div className="relative w-20 h-20 bg-black dark:bg-white rounded-3xl flex items-center justify-center shadow-2xl rotate-6 group-hover:rotate-0 transition-transform duration-500">
                        {loading ? (
                          <Loader2 className="w-10 h-10 text-white dark:text-black animate-spin" />
                        ) : (
                          <FileUp className="w-10 h-10 text-white dark:text-black" />
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-black dark:text-white uppercase tracking-tight">
                        {loading ? "Traitement en cours..." : isDragActive ? "Déposez ici" : "Glissez votre fichier"}
                      </h3>
                      <p className="text-zinc-500 font-medium max-w-xs mx-auto">
                        Sélectionnez un fichier Excel contenant la liste des étudiants et leurs thèmes.
                      </p>
                    </div>

                    {!loading && (
                      <Button variant="outline" className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-xs border-zinc-200 dark:border-zinc-800 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all">
                        Parcourir les fichiers
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center space-y-8 py-10"
              >
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/20">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-black dark:text-white uppercase tracking-tighter">Importation Réussie !</h2>
                  <p className="text-zinc-500 font-medium text-lg">
                    Les données de <span className="text-black dark:text-white font-bold">{fileName}</span> ont été traitées avec succès.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs border-zinc-200 dark:border-zinc-800"
                    onClick={reset}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un autre fichier
                  </Button>
                  <Button 
                    className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs bg-black dark:bg-white text-white dark:text-black"
                    onClick={() => window.location.href = diplomaType === "Licence" ? "/dashboard/licence" : "/dashboard/master"}
                  >
                    Aller à la planification
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Validation", desc: "Le système vérifie automatiquement les doublons et les formats.", icon: AlertCircle },
          { title: "Traitement", desc: "Les noms, thèmes et directeurs sont extraits instantanément.", icon: Loader2 },
          { title: "Organisation", desc: "Les étudiants sont classés par diplôme pour une planification aisée.", icon: CheckCircle2 },
        ].map((info, i) => (
          <div key={i} className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 space-y-3">
            <info.icon className="w-6 h-6 text-zinc-400" />
            <h4 className="font-bold text-black dark:text-white uppercase tracking-tight">{info.title}</h4>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">{info.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
