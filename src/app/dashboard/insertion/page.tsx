"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileUp, 
  FileSpreadsheet, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  Plus,
  Sparkles
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
import Link from "next/link";

export default function InsertionPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [diplomaType, setDiplomaType] = useState<string>("Licence");
  const [fileName, setFileName] = useState<string | null>(null);
  const [importCount, setImportCount] = useState(0);


    function excelDateToISO(value: any): string | null {
        if (typeof value === "number") {
            const utcDays = value - 25569;
            const utcValue = utcDays * 86400; // seconds
            const date = new Date(utcValue * 1000);

            if (isNaN(date.getTime())) return null;

            return date.toISOString().split("T")[0]; // YYYY-MM-DD
        }

        if (typeof value === "string" && value.trim()) {
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
                return d.toISOString().split("T")[0];
            }
        }

        return null;
    }


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
            date_naissance: excelDateToISO(row["DateNaiss"]),
          lieu_naissance: row["LieuNaiss"] || "",
          matricule2: row["Matricule2"] || "",
          nom2: row["Nom2"] || "",
          prenoms2: row["Prenoms2"] || "",
            date_naissance2: excelDateToISO(row["DateNaiss2"]),
          lieu_naissance2: row["LieuNaiss2"] || "",
          theme: row["Theme"] || "",
          directeur: row["Directeur"] || "",
          grade_directeur: row["GradeDirecteur"] || "",
            date_depot: excelDateToISO(row["DateDepot"]),
          jury: row["Jury"] || "",
          salle: row["Salle"] || "",
            date_soutenance: excelDateToISO(row["Date"]),
          heure_soutenance: row["Heure"] || "",
          president: row["Président"] || row["President"] || "",
          grade_president: row["GradePrésident"] || row["GradePresident"] || "",
          examinateur: row["Examinateur"] || "",
          grade_examinateur: row["GradeExaminateur"] || "",
          rapporteur: row["Rapporteur"] || "",
          grade_rapporteur: row["GradeRapporteur"] || "",
          speciality: row["Specialite"] || row["Spécialité"] || row["Speciality"] || "",
          diploma_type: diplomaType,
        }));

        const validData = formattedData.filter(d => d.nom);

        // Batch insertion to avoid payload limits and timeouts (especially for 100+ rows)
        const BATCH_SIZE = 50;
        for (let i = 0; i < validData.length; i += BATCH_SIZE) {
          const batch = validData.slice(i, i + BATCH_SIZE);
          const { error } = await supabase.from("soutenances").insert(batch);
          if (error) throw error;
        }

        await supabase.from("notifications").insert({
          title: "Importation Réussie",
          message: `${validData.length} étudiant(s) ${diplomaType} ont été importés avec succès.`,
          type: "success"
        });

        setImportCount(validData.length);
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
    setImportCount(0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Gestion des Données</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-blue-900 dark:text-white uppercase">
          Importation Excel
        </h1>
        <p className="text-blue-600/70 dark:text-blue-400 font-medium">
          Téléchargez vos fichiers pour alimenter la plateforme
        </p>
      </div>

      <Card className="border-none shadow-lg bg-white dark:bg-[#0f1629] rounded-3xl overflow-hidden">
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
                    <label className="text-xs font-black uppercase tracking-widest text-blue-400">Type de Diplôme</label>
                    <Select value={diplomaType} onValueChange={setDiplomaType}>
                      <SelectTrigger className="h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border-none text-lg font-bold">
                        <SelectValue placeholder="Choisir le diplôme" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        <SelectItem value="Licence" className="py-3 font-bold">Licence</SelectItem>
                        <SelectItem value="Master" className="py-3 font-bold">Master</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                    <div className="p-3 bg-white dark:bg-[#0f1629] rounded-xl shadow-sm">
                      <FileSpreadsheet className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-900 dark:text-white uppercase tracking-tight">Format Requis</p>
                      <p className="text-[10px] text-blue-500 font-medium">Fichier Excel (.xlsx) avec colonnes standard</p>
                    </div>
                  </div>
                </div>

                <div
                  {...getRootProps()}
                  className={`
                    relative group cursor-pointer border-2 border-dashed rounded-[2rem] p-16 transition-all duration-500
                    ${isDragActive 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[0.98]" 
                      : "border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600"}
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center text-center space-y-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
                      <div className="relative w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/30 rotate-6 group-hover:rotate-0 transition-transform duration-500">
                        {loading ? (
                          <Loader2 className="w-12 h-12 text-white animate-spin" />
                        ) : (
                          <FileUp className="w-12 h-12 text-white" />
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-blue-900 dark:text-white uppercase tracking-tight">
                        {loading ? "Traitement en cours..." : isDragActive ? "Déposez ici" : "Glissez votre fichier"}
                      </h3>
                      <p className="text-blue-500 font-medium max-w-xs mx-auto">
                        Sélectionnez un fichier Excel contenant la liste des étudiants.
                      </p>
                    </div>

                    {!loading && (
                      <Button className="h-12 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg shadow-blue-600/30">
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
                <div className="w-28 h-28 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30">
                  <CheckCircle2 className="w-14 h-14 text-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-blue-900 dark:text-white uppercase tracking-tighter">Importation Réussie !</h2>
                  <p className="text-blue-500 font-medium text-lg">
                    <span className="text-blue-900 dark:text-white font-bold">{importCount}</span> étudiants de <span className="text-blue-900 dark:text-white font-bold">{fileName}</span> ont été ajoutés.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    className="h-14 px-8 rounded-2xl font-bold border-blue-200 dark:border-blue-800 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    onClick={reset}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un autre fichier
                  </Button>
                  <Link href={diplomaType === "Licence" ? "/dashboard/licence" : "/dashboard/master"}>
                    <Button className="h-14 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg shadow-blue-600/30">
                      Aller à la planification
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Validation Auto", desc: "Le système vérifie automatiquement les doublons et les formats.", icon: AlertCircle, color: "blue" },
          { title: "Traitement Rapide", desc: "Les données sont extraites et organisées instantanément.", icon: Loader2, color: "yellow" },
          { title: "Organisation", desc: "Les étudiants sont classés par diplôme pour la planification.", icon: CheckCircle2, color: "green" },
        ].map((info, i) => (
          <div key={i} className={`p-6 rounded-3xl border-2 border-dashed space-y-3 ${info.color === 'blue' ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10' : info.color === 'yellow' ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10' : 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'}`}>
            <info.icon className={`w-6 h-6 ${info.color === 'blue' ? 'text-blue-500' : info.color === 'yellow' ? 'text-yellow-500' : 'text-green-500'}`} />
            <h4 className="font-bold text-blue-900 dark:text-white uppercase tracking-tight">{info.title}</h4>
            <p className="text-xs text-blue-500 leading-relaxed font-medium">{info.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
