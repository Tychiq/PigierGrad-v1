"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Download, 
  Loader2, 
  CheckCircle2, 
  Search,
  Users,
  GraduationCap,
  Sparkles,
  FileDown
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate, formatTime } from "@/lib/utils";
import { triggerDownload } from "@/lib/download-helper";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import JSZip from "jszip";
import { LICENCE_SPECIALITIES, MASTER_SPECIALITIES } from "@/lib/constants";
import { sortStudentsByName } from "@/lib/utils";
import { normalizeSpeciality } from "@/lib/utils";
import { useMemo } from "react";

interface Student {
  id: string;
  nom: string;
  prenoms: string;
  matricule: string;
  date_naissance: string;
  lieu_naissance: string;
  nom2?: string;
  prenoms2?: string;
  matricule2?: string;
  date_naissance2?: string;
  lieu_naissance2?: string;
  theme: string;
  directeur: string;
  grade_directeur: string;
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
  date_depot?: string;
  session_month?: string;
  session_year?: string;
}

interface FlatStudent extends Student {
  uniqueId: string;
  isSecond: boolean;
  currentNom: string;
  currentPrenoms: string;
  currentMatricule: string;
  currentDateNaissance: string;
  currentLieuNaissance: string;
}

export default function PVGenerationPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedUniqueId, setSelectedUniqueId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
    const [numeroArrete, setNumeroArrete] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("numeroArrete") || "";
        }
        return "";
    });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [downloadFilename, setDownloadFilename] = useState("");

    const [bulkDiplomaType, setBulkDiplomaType] = useState("");
    const [bulkSpeciality, setBulkSpeciality] = useState("");
    const [bulkGenerating, setBulkGenerating] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from("soutenances")
        .select("*")
        .order("nom", { ascending: true });
      if (data) setStudents(data);
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const flattenedStudents: FlatStudent[] = sortStudentsByName(students).flatMap(s => {
    const list: FlatStudent[] = [{
      ...s,
      uniqueId: `${s.id}-1`,
      isSecond: false,
      currentNom: s.nom,
      currentPrenoms: s.prenoms,
      currentMatricule: s.matricule,
      currentDateNaissance: s.date_naissance,
      currentLieuNaissance: s.lieu_naissance
    }];
    if (s.nom2 && s.nom2.trim() !== "") {
      list.push({
        ...s,
        uniqueId: `${s.id}-2`,
        isSecond: true,
        currentNom: s.nom2,
        currentPrenoms: s.prenoms2 || "",
        currentMatricule: s.matricule2 || "",
        currentDateNaissance: s.date_naissance2 || "",
        currentLieuNaissance: s.lieu_naissance2 || ""
      });
    }
    return list;
  });

  const filteredStudents = flattenedStudents.filter(s => 
    `${s.currentNom} ${s.currentPrenoms} ${s.currentMatricule}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const selectedStudent = flattenedStudents.find(s => s.uniqueId === selectedUniqueId);

    const generatePV = async () => {
      if (!selectedStudent) {
        toast.error("Veuillez sélectionner un étudiant");
        return;
      }

      setGenerating(true);

      try {
        // Fetch the template - trying both potential names
        let response = await fetch("/templates/Essai-PV-SoutenanceRGL.docx");
        if (!response.ok) {
          response = await fetch("/templates/Essai PV-SoutenanceRGL - Final.docx");
        }
        
        if (!response.ok) throw new Error("Impossible de charger le modèle de PV");
        
        const arrayBuffer = await response.arrayBuffer();
        const zip = new PizZip(arrayBuffer);
        
        const data = {
          Jury: selectedStudent.jury || "....................",
          Salle: selectedStudent.salle || "....................",
          Matricule: selectedStudent.currentMatricule || "....................",
          Nom: (selectedStudent.currentNom || "....................").toUpperCase(),
          Prenoms: selectedStudent.currentPrenoms || "....................",
          DateNaiss: formatDate(selectedStudent.currentDateNaissance) || "....................",
          LieuNaiss: selectedStudent.currentLieuNaissance || "....................",
          Examinateur: selectedStudent.examinateur || "....................",
          GradeExaminateur: selectedStudent.grade_examinateur || "..........",
          Rapporteur: selectedStudent.rapporteur || "....................",
          GradeRapporteur: selectedStudent.grade_rapporteur || "..........",
          Président: selectedStudent.president || "....................",
          GradePrésident: selectedStudent.grade_president || "..........",
          Theme: selectedStudent.theme || "....................",
          Directeur: selectedStudent.directeur || "....................",
          GradeDirecteur: selectedStudent.grade_directeur || "..........",
          Date: formatDate(selectedStudent.date_soutenance) || "....................",
          Heure: formatTime(selectedStudent.heure_soutenance) || "....................",
          DateSoutenance: formatDate(selectedStudent.date_soutenance) || "....................",
          HeureSoutenance: formatTime(selectedStudent.heure_soutenance) || "....................",
          Diplome: selectedStudent.diploma_type?.toUpperCase() || "LICENCE",
          Specialite: selectedStudent.speciality?.toUpperCase() || "....................",
          Session: `${selectedStudent.session_month?.toUpperCase() || "...................."} ${selectedStudent.session_year || "202..."}`,
          Diploma: selectedStudent.diploma_type?.toUpperCase() || "LICENCE",
          Speciality: selectedStudent.speciality?.toUpperCase() || "....................",
          session_month: selectedStudent.session_month?.toUpperCase() || "....................",
          session_year: selectedStudent.session_year || "202...",
          Session_Month: selectedStudent.session_month?.toUpperCase() || "....................",
            Session_Year: selectedStudent.session_year || "202...",
            NumeroArrete: numeroArrete || "................................"
        };

        // Pass 1: Handle « » delimiters
        const doc1 = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          delimiters: { start: "«", end: "»" },
        });

        try {
          doc1.render(data);
        } catch (error) {
          console.error("Error in pass 1:", error);
        }

        // Pass 2: Handle << >> delimiters (standard angle brackets)
        const zip2 = new PizZip(doc1.getZip().generate({ type: "arraybuffer" }));
        const doc2 = new Docxtemplater(zip2, {
          paragraphLoop: true,
          linebreaks: true,
          delimiters: { start: "<<", end: ">>" },
        });

        try {
          doc2.render(data);
        } catch (error) {
          console.error("Error in pass 2:", error);
        }

        const out = doc2.getZip().generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        console.log("Blob generated", { size: out.size, type: out.type });

        const filename = `PV_Soutenance_${selectedStudent.currentNom.replace(/\s+/g, '_')}.docx`;
        
        setGeneratedBlob(out);
        setDownloadFilename(filename);
        setShowSuccessDialog(true);
        
        console.log("Success dialog opened and blob set", { filename });
        toast.success("Procès-Verbal généré avec succès !");

    } catch (err: any) {
      console.error("PV Generation Error:", err);
      if (err.message === "Failed to fetch") {
        toast.error("Erreur réseau : Impossible de charger le modèle de PV.");
      } else {
        toast.error("Erreur lors de la génération : " + err.message);
      }
    } finally {
      setGenerating(false);
    }
  };


    const generateAllPVs = async () => {

        if (!bulkDiplomaType || !bulkSpeciality) {
            toast.error(
                "Veuillez sélectionner le diplôme et la spécialité"
            );
            return;
        }

        setBulkGenerating(true);

        try {



            const normalizedSelectedDiploma =
                normalizeSpeciality(bulkDiplomaType);

            const normalizedSelectedSpeciality =
                normalizeSpeciality(bulkSpeciality);

            // ===== FETCH FROM DB =====
            const { data, error } = await supabase
                .from("soutenances")
                .select("*");

            if (error) {
                throw error;
            }

            // ===== SAFE FILTER =====
            const studentsToGenerate = (data || []).filter(
                (student) => {

                    const studentDiploma =
                        normalizeSpeciality(student.diploma_type);

                    const studentSpeciality =
                        normalizeSpeciality(student.speciality);

                    return (
                        studentDiploma === normalizedSelectedDiploma &&
                        studentSpeciality === normalizedSelectedSpeciality
                    );
                }
            );

            // ===== SORT ALPHABETICALLY =====
            studentsToGenerate.sort((a, b) =>
                (a.nom || "").localeCompare(
                    b.nom || "",
                    "fr",
                    { sensitivity: "base" }
                )
            );

            if (studentsToGenerate.length === 0) {

                console.log("Selected speciality:",
                    normalizedSelectedSpeciality
                );

                console.log(
                    "Available specialities:",
                    (data || []).map(s => s.speciality)
                );

                toast.error("Aucun étudiant trouvé");

                return;
            }

            toast.info(
                `Génération de ${studentsToGenerate.length} PV en cours...`
            );

            const zipFile = new JSZip();

            // ===== LOAD TEMPLATE =====
            let response = await fetch(
                "/templates/Essai-PV-SoutenanceRGL.docx"
            );

            if (!response.ok) {
                response = await fetch(
                    "/templates/Essai PV-SoutenanceRGL - Final.docx"
                );
            }

            if (!response.ok) {
                throw new Error(
                    "Impossible de charger le modèle"
                );
            }

            const templateBuffer =
                await response.arrayBuffer();

            // ======================================================
// BUILD FINAL STUDENT LIST (INCLUDING BINOMES)
// ======================================================

            const finalStudents: any[] = [];

            studentsToGenerate.forEach((student) => {

                // =========================================
                // MAIN STUDENT
                // =========================================

                finalStudents.push({

                    ...student,

                    current_nom:
                        student.nom || "",

                    current_prenoms:
                        student.prenoms || "",

                    current_matricule:
                        student.matricule || "",

                    current_date_naissance:
                        student.date_naissance || "",

                    current_lieu_naissance:
                        student.lieu_naissance || ""
                });

                // =========================================
                // BINOME STUDENT
                // =========================================

                if (
                    student.nom2 &&
                    student.prenoms2
                ) {

                    finalStudents.push({

                        ...student,

                        current_nom:
                            student.nom2 || "",

                        current_prenoms:
                            student.prenoms2 || "",

                        current_matricule:
                            student.matricule2 || "",

                        current_date_naissance:
                            student.date_naissance2 || "",

                        current_lieu_naissance:
                            student.lieu_naissance2 || ""
                    });
                }
            });

// ======================================================
// SORT FINAL LIST
// ======================================================

            finalStudents.sort((a, b) =>
                (a.current_nom || "").localeCompare(
                    b.current_nom || "",
                    "fr",
                    { sensitivity: "base" }
                )
            );

            toast.info(
                `Génération de ${finalStudents.length} PV en cours...`
            );

// ======================================================
// GENERATE DOCS
// ======================================================

            for (const student of finalStudents) {

                const zip = new PizZip(templateBuffer);

                const currentNom =
                    student.current_nom || "";

                const currentPrenoms =
                    student.current_prenoms || "";

                const speciality =
                    student.speciality || "";

                const diploma =
                    student.diploma_type || "LICENCE";

                const sessionMonth =
                    student.session_month || "";

                const sessionYear =
                    student.session_year || "";

                const dataToInject = {

                    Jury:
                        student.jury || "....................",

                    Salle:
                        student.salle || "....................",

                    Matricule:
                        student.current_matricule || "....................",

                    Nom:
                        currentNom.toUpperCase(),

                    Prenoms:
                    currentPrenoms,

                    DateNaiss:
                        formatDate(
                            student.current_date_naissance
                        ),

                    LieuNaiss:
                        student.current_lieu_naissance || "",

                    Examinateur:
                        student.examinateur || "",

                    GradeExaminateur:
                        student.grade_examinateur || "",

                    Rapporteur:
                        student.rapporteur || "",

                    GradeRapporteur:
                        student.grade_rapporteur || "",

                    Président:
                        student.president || "",

                    GradePrésident:
                        student.grade_president || "",

                    Theme:
                        student.theme || "",

                    Directeur:
                        student.directeur || "",

                    GradeDirecteur:
                        student.grade_directeur || "",

                    Codirecteur:
                        student.codirecteur || "",

                    GradeCodirecteur:
                        student.grade_codirecteur || "",

                    Date:
                        formatDate(
                            student.date_soutenance
                        ),

                    Heure:
                        formatTime(
                            student.heure_soutenance
                        ),

                    DateSoutenance:
                        formatDate(
                            student.date_soutenance
                        ),

                    HeureSoutenance:
                        formatTime(
                            student.heure_soutenance
                        ),

                    Diplome:
                        diploma.toUpperCase(),

                    Diploma:
                        diploma.toUpperCase(),

                    Specialite:
                        speciality.toUpperCase(),

                    Speciality:
                        speciality.toUpperCase(),

                    session_month:
                        sessionMonth.toUpperCase(),

                    session_year:
                    sessionYear,

                    Session_Month:
                        sessionMonth.toUpperCase(),

                    Session_Year:
                    sessionYear,

                    Session:
                        `${sessionMonth.toUpperCase()} ${sessionYear}`,

                    NumeroArrete:
                        localStorage.getItem("numeroArrete") ||
                        "................................"
                };

                // =========================================
                // PASS 1
                // =========================================

                const doc1 = new Docxtemplater(zip, {

                    paragraphLoop: false,

                    linebreaks: false,

                    delimiters: {
                        start: "«",
                        end: "»"
                    },
                });

                doc1.render(dataToInject);

                // =========================================
                // PASS 2
                // =========================================

                const zip2 = new PizZip(
                    doc1.getZip().generate({
                        type: "arraybuffer"
                    })
                );

                const doc2 = new Docxtemplater(zip2, {

                    paragraphLoop: false,

                    linebreaks: false,

                    delimiters: {
                        start: "<<",
                        end: ">>"
                    },
                });

                doc2.render(dataToInject);

                const out = doc2.getZip().generate({

                    type: "blob",

                    mimeType:
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                });

                const fileName =
                    `PV_${currentNom}_${currentPrenoms}.docx`
                        .replace(/\s+/g, "_");

                zipFile.file(fileName, out);
            }

            // ===== GENERATE ZIP =====
            const finalZip =
                await zipFile.generateAsync({
                    type: "blob"
                });

            const zipName =
                `PV_${bulkDiplomaType}_${bulkSpeciality}.zip`
                    .replace(/\s+/g, "_");

            await triggerDownload(finalZip, zipName);

            toast.success(
                `${finalStudents.length} PV générés avec succès !`
            );

        } catch (error: any) {

            console.error(error);

            toast.error(
                "Erreur lors de la génération des PV"
            );

        } finally {

            setBulkGenerating(false);
        }
    };


  const handleDownload = async () => {
    console.log("handleDownload triggered", { generatedBlob, downloadFilename });
    if (!generatedBlob) {
      toast.error("Le document n'est pas prêt.");
      return;
    }

    const fileName = downloadFilename || "PV_Soutenance.docx";

    try {
      toast.info("Téléchargement en cours...");
      await triggerDownload(generatedBlob, fileName);
      toast.success("Téléchargement lancé !");
    } catch (err) {
      console.error("Download Error:", err);
      toast.error("Erreur lors du téléchargement.");
    }
  };

    const [availableSpecialities, setAvailableSpecialities] = useState<string[]>([]);

    useEffect(() => {

        const fetchSpecialities = async () => {

            if (!bulkDiplomaType) {
                setAvailableSpecialities([]);
                return;
            }

            const { data, error } = await supabase
                .from("soutenances")
                .select("speciality, diploma_type");

            if (error) {
                console.error(error);
                return;
            }

            const normalizedDiploma =
                normalizeSpeciality(bulkDiplomaType);

            const specialities = Array.from(
                new Set(
                    (data || [])
                        .filter(item =>
                            normalizeSpeciality(
                                item.diploma_type || ""
                            ) === normalizedDiploma
                        )
                        .map(item =>
                            normalizeSpeciality(
                                item.speciality || ""
                            )
                        )
                        .filter(Boolean)
                )
            ).sort((a, b) =>
                a.localeCompare(b, "fr", {
                    sensitivity: "base"
                })
            );

            setAvailableSpecialities(specialities);
        };

        fetchSpecialities();

    }, [bulkDiplomaType]);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Documentation Officielle</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-blue-900 dark:text-white uppercase">
          Génération de PV
        </h1>
        <p className="text-blue-600/70 dark:text-blue-400 font-medium">
          Créez et téléchargez les procès-verbaux de soutenance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-lg bg-white dark:bg-[#0f1629] rounded-3xl overflow-hidden">
            <CardHeader className="p-6 pb-0">
              <CardTitle className="text-lg font-black text-blue-900 dark:text-white uppercase">Sélection de l'Étudiant</CardTitle>
              <CardDescription className="text-blue-400">Choisissez un étudiant pour générer son PV</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                <Input
                  placeholder="Rechercher par nom ou matricule..."
                  className="pl-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={selectedUniqueId} onValueChange={setSelectedUniqueId}>
                <SelectTrigger className="h-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none text-base font-semibold">
                  <SelectValue placeholder="Sélectionner un étudiant..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl max-h-80">
                  {loading ? (
                    <div className="p-4 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                    </div>
                  ) : paginatedStudents.length === 0 ? (
                    <div className="p-4 text-center text-blue-400">Aucun étudiant trouvé</div>
                  ) : (
                    <>
                      {paginatedStudents.map((student) => (
                        <SelectItem key={student.uniqueId} value={student.uniqueId} className="py-3">
                          <div className="flex flex-col">
                            <span className="font-bold">
                              {student.currentNom} {student.currentPrenoms}
                            </span>
                            <span className="text-xs text-blue-400">
                              {student.diploma_type} - {student.currentMatricule}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between p-2 border-t border-blue-50 dark:border-blue-900/20 sticky bottom-0 bg-white dark:bg-[#0f1629]">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentPage(prev => prev - 1);
                            }}
                          >
                            Précédent
                          </Button>
                          <span className="text-xs font-bold text-blue-600">
                            {currentPage} / {totalPages}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentPage(prev => prev + 1);
                            }}
                          >
                            Suivant
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>

              <Button 
                onClick={generatePV}
                disabled={!selectedUniqueId || generating}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Générer le Document
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

            <Card className="border-none shadow-lg bg-white dark:bg-[#0f1629] rounded-3xl overflow-hidden">
                <CardHeader className="p-6 pb-0">
                    <CardTitle className="text-lg font-black text-green-700 dark:text-green-400 uppercase">
                        Génération Massive
                    </CardTitle>

                    <CardDescription>
                        Générer automatiquement tous les PV d'une spécialité
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-4">

                    {/* DIPLOMA */}
                    <Select
                        value={bulkDiplomaType}
                        onValueChange={(v) => {
                            setBulkDiplomaType(v);
                            setBulkSpeciality("");
                        }}
                    >
                        <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Choisir le diplôme" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="Licence">
                                Licence
                            </SelectItem>

                            <SelectItem value="Master">
                                Master
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* SPECIALITY */}
                    <Select
                        value={bulkSpeciality}
                        onValueChange={setBulkSpeciality}
                        disabled={!bulkDiplomaType}
                    >
                        <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Choisir la spécialité" />
                        </SelectTrigger>

                        <SelectContent>

                            {availableSpecialities.map((spec) => (
                                <SelectItem
                                    key={spec}
                                    value={spec}
                                >
                                    {spec}
                                </SelectItem>
                            ))}

                        </SelectContent>
                    </Select>

                    {/* BUTTON */}
                    <Button
                        onClick={generateAllPVs}
                        disabled={
                            bulkGenerating ||
                            !bulkDiplomaType ||
                            !bulkSpeciality
                        }
                        className="w-full h-14 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest"
                    >
                        {bulkGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Génération...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5 mr-2" />
                                Générer Tous les PV
                            </>
                        )}
                    </Button>

                </CardContent>
            </Card>

          <div className="grid grid-cols-1 gap-4">
            {[
              { title: "Format Standard", desc: "Conforme aux normes académiques Pigier", icon: CheckCircle2 },
              { title: "Génération Rapide", desc: "Document prêt en quelques secondes", icon: Loader2 },
              { title: "Prêt à Imprimer", desc: "Format DOCX compatible MS Word", icon: FileText },
            ].map((info, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                  <info.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-white text-sm">{info.title}</h4>
                  <p className="text-xs text-blue-400">{info.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 dark:from-blue-800 dark:via-blue-900 dark:to-blue-950 rounded-3xl overflow-hidden text-white h-full">
            <CardContent className="p-8 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/10 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight">Aperçu du Document</h3>
                  <p className="text-blue-200 text-sm">Informations qui seront incluses</p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {selectedStudent ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 bg-white/10 rounded-2xl p-6 space-y-4 overflow-y-auto"
                  >
                    <div className="text-center pb-4 border-b border-white/20">
                      <p className="text-xs text-blue-200 uppercase tracking-widest mb-2">Université Pigier</p>
                      <h4 className="text-xl font-black">PROCÈS-VERBAL DE SOUTENANCE</h4>
                    </div>

                    <div className="space-y-3">
                        {[
                            { label: "Diplôme", value: selectedStudent.diploma_type },
                            { label: "Spécialité", value: selectedStudent.speciality },
                            { label: "Session", value: `${selectedStudent.session_month} ${selectedStudent.session_year}` },
                            { label: "Matricule", value: selectedStudent.currentMatricule },
                          { label: "Étudiant", value: `${selectedStudent.currentNom} ${selectedStudent.currentPrenoms}` },
                          { label: "Date de naissance", value: formatDate(selectedStudent.currentDateNaissance) },
                          { label: "Lieu de naissance", value: selectedStudent.currentLieuNaissance },
                          { label: "Thème", value: selectedStudent.theme },
                            { label: "Directeur", value: `${selectedStudent.directeur} (${selectedStudent.grade_directeur})` },
                            { label: "Date de soutenance", value: formatDate(selectedStudent.date_soutenance) },
                            { label: "Heure", value: formatTime(selectedStudent.heure_soutenance) },
                            { label: "Salle", value: selectedStudent.salle },

                        ].map((item, i) => (
                        <div key={i} className="flex justify-between items-start gap-4">
                          <span className="text-xs text-blue-200 uppercase tracking-wider shrink-0">{item.label}</span>
                          <span className="text-sm font-semibold text-right">{item.value || "Non défini"}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-white/20">
                      <p className="text-xs text-blue-200 uppercase tracking-widest mb-3">Composition du Jury</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-blue-200">Président</span>
                          <span className="text-sm font-semibold">{selectedStudent.president || "À définir"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-blue-200">Examinateur</span>
                          <span className="text-sm font-semibold">{selectedStudent.examinateur || "À définir"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-blue-200">Rapporteur</span>
                          <span className="text-sm font-semibold">{selectedStudent.rapporteur || "À définir"}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
                      <Users className="w-12 h-12 text-blue-200" />
                    </div>
                    <h4 className="text-xl font-bold mb-2">Aucun étudiant sélectionné</h4>
                    <p className="text-blue-200 text-sm max-w-xs">
                      Sélectionnez un étudiant dans la liste pour voir l'aperçu du procès-verbal
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl bg-white dark:bg-[#0f1629]">
          <DialogHeader className="flex flex-col items-center justify-center pt-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-2xl font-black text-center text-blue-900 dark:text-white uppercase tracking-tight">
              Document Prêt !
            </DialogTitle>
            <DialogDescription className="text-center text-blue-600/70 dark:text-blue-400 font-medium">
              Le procès-verbal pour <span className="font-bold text-blue-900 dark:text-white">{selectedStudent?.currentNom} {selectedStudent?.currentPrenoms}</span> a été généré avec succès.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-6">
            <div className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center gap-4 border border-blue-100 dark:border-blue-800">
              <div className="p-3 bg-white dark:bg-blue-900/50 rounded-xl shadow-sm">
                <FileDown className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-blue-900 dark:text-white truncate">
                  {downloadFilename}
                </p>
                <p className="text-xs text-blue-400 uppercase tracking-widest font-bold">
                  Format DOCX
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pb-6 px-6 relative z-[50]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSuccessDialog(false)}
              className="flex-1 h-12 rounded-xl border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer relative z-[60] pointer-events-auto"
            >
              Fermer
            </Button>
            <Button
              type="button"
              onClick={(e) => {
                console.log("Download button clicked");
                handleDownload();
              }}
              className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/30 cursor-pointer transition-transform active:scale-95 relative z-[60] pointer-events-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
