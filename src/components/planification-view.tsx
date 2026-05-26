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
  UserPlus,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { triggerDownload } from "@/lib/download-helper";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate, formatTime } from "@/lib/utils";
import { LICENCE_SPECIALITIES, MASTER_SPECIALITIES } from "@/lib/constants";
import { ResetEverythingButton } from "./reset-everything-button";
import { Download } from "lucide-react";
import { useUserRole } from "@/lib/useUserRole";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { normalizeSpeciality } from "@/lib/utils";
import { sortStudentsByName } from "@/lib/utils";

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
    codirecteur?: string;
    grade_codirecteur?: string;
  is_merged?: boolean;
}

const ITEMS_PER_PAGE = 20;

export function PlanificationView({ diplomaType }: { diplomaType: string }) {
  const [data, setData] = useState<Soutenance[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(initialSearch);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Soutenance | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<Partial<Soutenance>>({});

  const [selectedSpeciality, setSelectedSpeciality] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDirector, setSelectedDirector] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sessionMonth, setSessionMonth] = useState("");
  const [sessionYear, setSessionYear] = useState("");

  const [isBinomeDialogOpen, setIsBinomeDialogOpen] = useState(false);
  const [targetBinomeItem, setTargetBinomeItem] = useState<Soutenance | null>(null);
  const [binomeSearch, setBinomeSearch] = useState("");
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);
    const role = useUserRole();

    const [selectedSoutenances, setSelectedSoutenances] = useState<Set<string>>(new Set());
    const [juryNumber, setJuryNumber] = useState<number | "">("");

    const [selectedJury, setSelectedJury] = useState("all");

    const [numeroArrete, setNumeroArrete] = useState("");

  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch !== null) {
      setSearch(urlSearch);
      setCurrentPage(1);
    }
  }, [searchParams]);

    const toggleSelection = (id: string) => {
        setSelectedSoutenances(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };


    // Update session for selected or all
    const updateSession = async () => {
        const query = supabase.from("soutenances").update({
            session_month: sessionMonth,
            session_year: sessionYear
        });

        if (selectedSoutenances.size > 0) {
            query.in("id", Array.from(selectedSoutenances));
        } else {
            query.eq("diploma_type", diplomaType);
        }

        const { error } = await query;

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Session mise à jour");
            fetchData();
            setSelectedSoutenances(new Set());
        }
    };

// Update jury for selected or all
    const updateJury = async () => {
        if (juryNumber === "") {
            toast.error("Entrer un numéro de jury");
            return;
        }

        const query = supabase
            .from("soutenances")
            .update({ jury: Number(juryNumber) });

        if (selectedSoutenances.size > 0) {
            query.in("id", Array.from(selectedSoutenances));
        } else {
            query.eq("diploma_type", diplomaType);
        }

        const { error } = await query;

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Jury mis à jour");
            fetchData();
            setJuryNumber("");
            setSelectedSoutenances(new Set());
        }
    };

    const fetchData = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("soutenances")
            .select(`
    id,
    matricule,
    nom,
    prenoms,
    date_naissance,
    lieu_naissance,
    matricule2,
    nom2,
    prenoms2,
    date_naissance2,
    lieu_naissance2,
    theme,
    directeur,
    grade_directeur,
    date_depot,
    jury,
    salle,
    date_soutenance,
    heure_soutenance,
    president,
    grade_president,
    examinateur,
    grade_examinateur,
    rapporteur,
    grade_rapporteur,
    diploma_type,
    speciality,
    session_month,
    session_year,
    is_merged,
    created_at
  `)
            .eq("is_merged", false)
            .ilike("diploma_type", diplomaType)
            .order("created_at", { ascending: false });

        if (data) {
            setData(sortStudentsByName(data || []));
            // Persist the session globally from the first student
            if (data[0]?.session_month) setSessionMonth(data[0].session_month);
            if (data[0]?.session_year) setSessionYear(data[0].session_year);
        }
        setLoading(false);
    };

  useEffect(() => {
    fetchData();
  }, [diplomaType]);

    const normalize = (s?: string) =>
        (s || "")
            .trim()
            .replace(/\s+/g, " ")
            .toUpperCase();

    const uniqueSpecialities = useMemo(() => {
        const base =
            diplomaType === "Licence"
                ? LICENCE_SPECIALITIES
                : MASTER_SPECIALITIES;

        const fromDb = data.map(item =>
            normalize(item.speciality || "")
        );

        const merged = [...base, ...fromDb]
            .map(spec => normalize(spec))
            .filter(spec => spec !== "");

        const specs = new Set(merged);

        return Array.from(specs).sort((a, b) =>
            a.localeCompare(b, "fr", {
                sensitivity: "base"
            })
        );
    }, [data, diplomaType]);

  const uniqueDirectors = useMemo(() => {
    const dirs = new Set(data.map(item => item.directeur).filter(Boolean));
    return Array.from(dirs);
  }, [data]);

    const uniqueJuries = useMemo(() => {
        const juries = new Set(
            data.map(item => item.jury).filter(j => j !== null && j !== undefined)
        );
        return Array.from(juries);
    }, [data]);

    const handleSave = async () => {
        try {
            // 🔐 Role-based field filtering
            let finalForm: any = {
                ...form,
                diploma_type: diplomaType,
                session_month: form.session_month || sessionMonth,
                session_year: form.session_year || sessionYear
            };

            // 🚫 If collaborator → restrict sensitive fields
            if (role !== "admin") {
                finalForm = {
                    // ONLY allowed fields
                    matricule: form.matricule,
                    nom: form.nom,
                    prenoms: form.prenoms,
                    date_naissance: form.date_naissance,
                    lieu_naissance: form.lieu_naissance,

                    matricule2: form.matricule2,
                    nom2: form.nom2,
                    prenoms2: form.prenoms2,
                    date_naissance2: form.date_naissance2,
                    lieu_naissance2: form.lieu_naissance2,

                    speciality: form.speciality,

                    diploma_type: diplomaType,
                    session_month: form.session_month || sessionMonth,
                    session_year: form.session_year || sessionYear
                };
            }

            if (editingItem) {
                const { error } = await supabase
                    .from("soutenances")
                    .update(finalForm)
                    .eq("id", editingItem.id);

                if (error) throw error;
                toast.success("Mis à jour avec succès");
            } else {
                const { error } = await supabase
                    .from("soutenances")
                    .insert(finalForm);

                if (error) throw error;
                toast.success("Ajouté avec succès");
            }

            setIsDialogOpen(false);
            setEditingItem(null);
            setForm({});

            await fetchData();
            setSelectedSpeciality("all");
            setCurrentPage(1);

        } catch (err: any) {
            console.error(err);
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
      const matchesSpeciality = selectedSpeciality === "all" || normalizeSpeciality(item.speciality).includes(normalizeSpeciality(selectedSpeciality));
        const matchesJury =
            selectedJury === "all" || item.jury?.toString() === selectedJury;
      const matchesDirector = selectedDirector === "all" || item.directeur === selectedDirector;

        return matchesSearch && matchesSpeciality && matchesDirector && matchesJury;
    });
  }, [data, search, selectedSpeciality, selectedJury, selectedDirector]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeFiltersCount = [selectedSpeciality, selectedJury, selectedDirector].filter(f => f !== "all").length;

  const clearFilters = () => {
    setSelectedSpeciality("all");
    setSelectedJury("all");
    setSelectedDirector("all");
    setCurrentPage(1);
  };

    const openEditDialog = (item: Soutenance) => {
        setEditingItem(item);
        setForm({
            ...item,
            speciality: item.speciality ?? ""
        });
        setIsDialogOpen(true);
    };

  const activeSpecialities = diplomaType === "Licence" ? LICENCE_SPECIALITIES : MASTER_SPECIALITIES;

    const binomeCandidates = useMemo(() => {
        if (!targetBinomeItem) return [];

        return data.filter(item =>
            item.id !== targetBinomeItem.id &&
            !item.is_merged &&
            !item.matricule2 &&
            (`${item.nom} ${item.prenoms} ${item.matricule}`.toLowerCase().includes(binomeSearch.toLowerCase()))
        );
    }, [data, targetBinomeItem, binomeSearch]);


    const handleAddBinome = async (selectedStudent: Soutenance) => {
        if (!targetBinomeItem) return;

        // Optimistic update
        const previousData = [...data];
        const updatedData = data.map(item => {
            if (item.id === targetBinomeItem.id) {
                return {
                    ...item,
                    matricule2: selectedStudent.matricule,
                    nom2: selectedStudent.nom,
                    prenoms2: selectedStudent.prenoms,
                    date_naissance2: selectedStudent.date_naissance,
                    lieu_naissance2: selectedStudent.lieu_naissance
                };
            }
            return item;
        }).filter(item => item.id !== selectedStudent.id);

        setData(updatedData);

        try {
            // 1) Add second student to the target card
            const { error: updateTargetError } = await supabase
                .from("soutenances")
                .update({
                    matricule2: selectedStudent.matricule,
                    nom2: selectedStudent.nom,
                    prenoms2: selectedStudent.prenoms,
                    date_naissance2: selectedStudent.date_naissance,
                    lieu_naissance2: selectedStudent.lieu_naissance
                })
                .eq("id", targetBinomeItem.id);

            if (updateTargetError) throw updateTargetError;

            // 2) Mark second student as merged (DO NOT DELETE)
            const { error: mergeError } = await supabase
                .from("soutenances")
                .update({ is_merged: true })
                .eq("id", selectedStudent.id);

            if (mergeError) throw mergeError;

            toast.success(`${selectedStudent.nom} ${selectedStudent.prenoms} ajouté en binôme`);

            setIsBinomeDialogOpen(false);
            setTargetBinomeItem(null);
            setBinomeSearch("");
            await fetchData();
        } catch (err: any) {
            setData(previousData); // Rollback
            toast.error(err.message);
        }
    };

    const getBase64FromUrl = async (url: string): Promise<string> => {
        const response = await fetch(url);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const downloadPDF = async () => {
        try {
            if (filteredData.length === 0) {
                toast.error("Aucune donnée à exporter.");
                return;
            }

            toast.info("Génération du planning PDF...");

            const doc = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4"
            });

            const logoBase64 = await getBase64FromUrl("/logo-pigier.jpeg");
            const today = new Date();
            const year = today.getFullYear();

            // ===== SPECIALITY CODE =====
            const hasSpecialityFilter =
                selectedSpeciality &&
                selectedSpeciality !== "all";

            const specialityAcronym = hasSpecialityFilter
                ? (selectedSpeciality.match(/\((.*?)\)/)?.[1] || "")
                : "";

            const docCode =
                diplomaType === "Licence"
                    ? `DOC-PR-FOR_L/01/13${specialityAcronym ? `/${specialityAcronym}` : ""}/${year}`
                    : `DOC-PR-FOR_M/01/13${specialityAcronym ? `/${specialityAcronym}` : ""}/${year}`;

            // ===== DOCUMENT CODE =====
            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            doc.setFont("helvetica", "normal");
            doc.text(docCode, 285, 8, { align: "right" });

            const pageWidth = doc.internal.pageSize.getWidth();

            // ===== LOGO TOP LEFT =====
            doc.addImage(logoBase64, "JPEG", 10, 4, 34, 16);

// ===== HEADER LINE =====
            doc.setDrawColor(30, 64, 175);
            doc.setLineWidth(1);
            doc.line(10, 24, pageWidth - 10, 24);

// ===== TITLE =====
            doc.setFontSize(18);
            doc.setTextColor(30, 64, 175);
            doc.setFont("helvetica", "bold");
            doc.text(
                "PLANNING DES SOUTENANCES",
                pageWidth / 2,
                34,
                { align: "center" }
            );

// ===== SUBTITLE (IMPORTANT: PUSHED DOWN) =====
            doc.setFontSize(12);
            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "bold");
            doc.text(
                `${diplomaType.toUpperCase()} PROFESSIONNEL${
                    selectedSpeciality !== "all"
                        ? ` EN ${selectedSpeciality}`
                        : ""
                } - SESSION DE ${sessionMonth.toUpperCase()} ${sessionYear}`,
                pageWidth / 2,
                42,
                { align: "center" }
            );


            // ===== SECOND BLUE LINE UNDER SUBTITLE =====
            doc.setDrawColor(30, 64, 175);
            doc.setLineWidth(0.8);

            doc.line(10, 46, 287, 46);

// ===== TABLE START (PUSHED DOWN CLEANLY) =====
            autoTable(doc, {
                startY: 55,

                head: [[
                    'JURY',
                    'DATE & HEURE',
                    'SALLE',
                    'NOM & PRÉNOMS',
                    'THÈME',
                    'DIRECTEUR',
                    'PRÉSIDENT',
                    'EXAMINATEUR',
                    'RAPPORTEUR'
                ]],

                body: sortStudentsByName(filteredData).map(item => [
                    item.jury || "---",

                    `${formatDate(item.date_soutenance)}\n${formatTime(item.heure_soutenance)}`,

                    item.salle || "---",

                    `${item.nom} ${item.prenoms}${
                        item.nom2
                            ? '\n\n&\n\n' + item.nom2 + ' ' + item.prenoms2
                            : ''
                    }`,

                    item.theme || "---",

                    `${item.directeur || "---"}\n\n${item.grade_directeur || ""}`,

                    `${item.president || "---"}\n\n${item.grade_president || ""}`,

                    `${item.examinateur || "---"}\n\n${item.grade_examinateur || ""}`,

                    `${item.rapporteur || "---"}\n\n${item.grade_rapporteur || ""}`
                ]),

                theme: "grid",

                // IMPORTANT:
                // top margin small for next pages
                // startY controls only first page
                margin: {
                    top: 60,
                    left: 10,
                    right: 10
                },

                headStyles: {
                    fillColor: [30, 64, 175],
                    textColor: [255, 255, 255],
                    fontSize: 8,
                    fontStyle: "bold",
                    halign: "center",
                    valign: "middle"
                },

                bodyStyles: {
                    fontSize: 7.5,
                    valign: "middle",
                    halign: "center",
                    textColor: [20, 20, 20]
                },

                styles: {
                    overflow: "linebreak",
                    cellPadding: 2.5,
                    fontSize: 7.5,
                    halign: "center",
                    valign: "middle"
                },

                columnStyles: {
                    0: { cellWidth: 15, halign: "center" },
                    1: { cellWidth: 27, halign: "center" },
                    2: { cellWidth: 18, halign: "center" },
                    3: { cellWidth: 35, halign: "center" },
                    4: { cellWidth: 48, halign: "center" },
                    5: { cellWidth: 30, halign: "center" },
                    6: { cellWidth: 28, halign: "center" },
                    7: { cellWidth: 28, halign: "center" },
                    8: { cellWidth: 28, halign: "center" }
                },

                didDrawPage: (data) => {
                    doc.setFontSize(8);
                    doc.setTextColor(148, 163, 184);
                    doc.setFont("helvetica", "normal");

                    doc.text(
                        `Page ${data.pageNumber}`,
                        287,
                        205,
                        { align: "right" }
                    );
                }
            });

            // ===== SIGNATURE =====
            const totalPages = doc.getNumberOfPages();
            doc.setPage(totalPages);

            const finalY = (doc as any).lastAutoTable.finalY || 170;
            const pageHeight = doc.internal.pageSize.height;

            let signatureY = finalY + 20;

            if (signatureY > pageHeight - 45) {
                doc.addPage();
                doc.setPage(doc.getNumberOfPages());
                signatureY = 40;
            }

            const formattedDate = today.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            });

            doc.setFontSize(11);
            doc.setTextColor(30, 30, 30);
            doc.setFont("helvetica", "normal");

            doc.text("Cotonou, le ", 220, signatureY);
            doc.text("Le Directeur des Etudes", 220, signatureY + 12);

            const directorName = "Dr Arsène VIGAN";

            doc.setFont("helvetica", "bold");
            doc.text(directorName, 220, signatureY + 32);

            const textWidth = doc.getTextWidth(directorName);
            doc.line(220, signatureY + 33, 220 + textWidth, signatureY + 33);

            // ===== SAVE =====
            const filename = `Planning_${diplomaType}_${sessionMonth}_${sessionYear}.pdf`;
            const pdfBlob = doc.output("blob");

            await triggerDownload(pdfBlob, filename);

            toast.success("Planning exporté avec succès !");
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast.error("Erreur lors de l'export PDF.");
        }
    };

    const exportPlanningExcel = () => {
        try {
            if (filteredData.length === 0) {
                toast.error("Aucune donnée à exporter.");
                return;
            }

            const excelData = sortStudentsByName(filteredData).map((item, index) => ({
                "N°": index + 1,

                "JURY": item.jury || "",

                "DATE SOUTENANCE": formatDate(item.date_soutenance),

                "HEURE SOUTENANCE": formatTime(item.heure_soutenance),

                "SALLE": item.salle || "",

                "NOM": item.nom || "",
                "PRENOMS": item.prenoms || "",
                "MATRICULE": item.matricule || "",
                "DATE NAISSANCE": item.date_naissance || "",
                "LIEU NAISSANCE": item.lieu_naissance || "",

                "NOM 2": item.nom2 || "",
                "PRENOMS 2": item.prenoms2 || "",
                "MATRICULE 2": item.matricule2 || "",
                "DATE NAISSANCE 2": item.date_naissance2 || "",
                "LIEU NAISSANCE 2": item.lieu_naissance2 || "",

                "THEME": item.theme || "",

                "DIRECTEUR": item.directeur || "",
                "GRADE DIRECTEUR": item.grade_directeur || "",

                "PRESIDENT": item.president || "",
                "GRADE PRESIDENT": item.grade_president || "",

                "EXAMINATEUR": item.examinateur || "",
                "GRADE EXAMINATEUR": item.grade_examinateur || "",

                "RAPPORTEUR": item.rapporteur || "",
                "GRADE RAPPORTEUR": item.grade_rapporteur || "",

                "SPECIALITE": item.speciality || "",

                "DIPLOME": item.diploma_type || "",

                "SESSION MOIS": item.session_month || "",
                "SESSION ANNEE": item.session_year || "",

                "DATE DEPOT": item.date_depot || ""
            }));

            const worksheet = XLSX.utils.json_to_sheet(excelData);

            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                diplomaType === "Licence" ? "LICENCE" : "MASTER"
            );

            const excelBuffer = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "array"
            });

            const file = new Blob(
                [excelBuffer],
                {
                    type:
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                }
            );

            const filename =
                `Planning_${diplomaType}_${sessionMonth}_${sessionYear}.xlsx`;

            saveAs(file, filename);

            toast.success("Planning Excel exporté avec succès !");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de l'export Excel.");
        }
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
          {sessionMonth && sessionYear && (
            <h2 className="text-lg font-bold text-blue-600/80 dark:text-blue-400/80 uppercase tracking-tight">
              Session de {sessionMonth} {sessionYear}
            </h2>
          )}
          <p className="text-blue-600/70 dark:text-blue-400 font-medium">
            {filteredData.length} soutenance(s) {activeFiltersCount > 0 && `(filtré de ${data.length})`}
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
                placeholder="Année (ex: 2025)"
                value={sessionYear} 
                onChange={(e) => setSessionYear(e.target.value)}
                className="h-9 text-xs rounded-lg border-blue-200"
              />
            </div>
            <Button size="sm" onClick={updateSession} className="h-9 px-3 text-[10px] font-bold uppercase">
              Appliquer Session
            </Button>

              <Input
                  type="number"
                  placeholder="Numéro Jury"
                  value={juryNumber}
                  disabled={role !== "admin"}
                  onChange={(e) => {
                      const val = e.target.value;
                      setJuryNumber(val === "" ? "" : Number(val));
                  }}
                  className="h-9 text-xs"
              />
              <Button onClick={updateJury}>
                  Appliquer Jury
              </Button>
          </div>

            <div className="space-y-2">
                <Label>Numéro d'arrêté</Label>

                <Input
                    placeholder="Ex: 2026-154/MESRS/DGES/..."
                    value={numeroArrete}
                    onChange={(e) => {
                        setNumeroArrete(e.target.value);
                        localStorage.setItem("numeroArrete", e.target.value);
                    }}
                />
            </div>

          <div className="flex items-center gap-3 flex-wrap">
            <ResetEverythingButton diplomaType={diplomaType} target="planning" />
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
              
              <Button 
                variant="outline"
                onClick={downloadPDF}
                className="h-12 px-4 rounded-xl border-blue-200 dark:border-blue-800 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter Planning
              </Button>

              <Button
                  onClick={exportPlanningExcel}
                  className="bg-green-600 hover:bg-green-700 text-white"
              >
                  Exporter Planning Excel
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
                          <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                              Spécialité
                          </Label>

                          <Select
                              value={form.speciality || ""}
                              onValueChange={(val) =>
                                  setForm({
                                      ...form,
                                      speciality: val
                                  })
                              }
                          >
                              <SelectTrigger className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none">
                                  <SelectValue placeholder="Sélectionner une spécialité..." />
                              </SelectTrigger>

                              <SelectContent className="rounded-xl">

                                  {uniqueSpecialities.map(spec => (
                                      <SelectItem
                                          key={spec}
                                          value={spec}
                                      >
                                          {spec}
                                      </SelectItem>
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


                    {role !== "admin" && (
                        <p className="text-sm text-red-500 font-medium">
                            ⚠️ Vous êtes collaborateur : certaines modifications sont limitées.
                        </p>
                    )}
                  <div className="space-y-4 pt-4 border-t border-blue-50 dark:border-blue-900/20">
                    <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Soutenance</h3>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Thème</Label>
                      <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.theme || ""} onChange={e => setForm({...form, theme: e.target.value})} disabled={role !== "admin"} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Directeur</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.directeur || ""} onChange={e => setForm({...form, directeur: e.target.value})} disabled={role !== "admin"} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Grade Directeur</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.grade_directeur || ""} onChange={e => setForm({...form, grade_directeur: e.target.value})} disabled={role !== "admin"} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Date Soutenance</Label>
                        <Input type="date" className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.date_soutenance || ""} onChange={e => setForm({...form, date_soutenance: e.target.value})} disabled={role !== "admin"} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Heure</Label>
                        <Input type="time" className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.heure_soutenance || ""} onChange={e => setForm({...form, heure_soutenance: e.target.value})} disabled={role !== "admin"} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Salle</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.salle || ""} onChange={e => setForm({...form, salle: e.target.value})} disabled={role !== "admin"} />
                      </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Jury</Label>
                            <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.jury || ""} onChange={e => setForm({...form, jury: e.target.value})} disabled={role !== "admin"} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Date de dépot</Label>
                            <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.date_depot || ""} onChange={e => setForm({...form, date_depot: e.target.value})} disabled={role !== "admin"} />
                        </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-blue-50 dark:border-blue-900/20">
                    <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Jury</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Président</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.president || ""} onChange={e => setForm({...form, president: e.target.value})} disabled={role !== "admin"} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Grade Président</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.grade_president || ""} onChange={e => setForm({...form, grade_president: e.target.value})} disabled={role !== "admin"} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Examinateur</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.examinateur || ""} onChange={e => setForm({...form, examinateur: e.target.value})} disabled={role !== "admin"} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Grade Examinateur</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.grade_examinateur || ""} onChange={e => setForm({...form, grade_examinateur: e.target.value})} disabled={role !== "admin"} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Rapporteur</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.rapporteur || ""} onChange={e => setForm({...form, rapporteur: e.target.value})} disabled={role !== "admin"} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Grade Rapporteur</Label>
                        <Input className="h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none" value={form.grade_rapporteur || ""} onChange={e => setForm({...form, grade_rapporteur: e.target.value})} disabled={role !== "admin"} />
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
                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Jury</Label>
                      <Select
                          value={selectedJury}
                          onValueChange={setSelectedJury}
                      >
                          <SelectTrigger className="w-full">
                              <SelectValue placeholder="Filtrer par jury" />
                          </SelectTrigger>

                          <SelectContent>

                              {/* ✅ NEVER empty string */}
                              <SelectItem value="all">Tous les jurys</SelectItem>

                              {Array.from(
                                  new Set(
                                      data
                                          .map(item => item.jury)
                                          .filter(j => j !== null && j !== undefined && j !== "")
                                  )
                              ).map(jury => (
                                  <SelectItem key={jury} value={String(jury)}>
                                      Jury {jury}
                                  </SelectItem>
                              ))}

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

        <div className="flex items-center gap-2 mb-3">
            <input
                type="checkbox"
                checked={
                    paginatedData.length > 0 &&
                    paginatedData.every(item => selectedSoutenances.has(item.id))
                }
                onChange={(e) => {
                    if (e.target.checked) {
                        setSelectedSoutenances(new Set(paginatedData.map(item => item.id)));
                    } else {
                        setSelectedSoutenances(new Set());
                    }
                }}
                className="w-5 h-5 rounded-md border border-gray-300 dark:border-gray-600 accent-blue-600"
            />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
    Sélectionner tout
  </span>
        </div>

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
                  <div className="flex items-start gap-3 w-full">
                      <input
                          type="checkbox"
                          className="mt-3 accent-blue-600 w-4 h-4"
                          checked={selectedSoutenances.has(item.id)}
                          onChange={() => toggleSelection(item.id)}
                      />
                      <Card
                          className={`group relative w-full border-none bg-white dark:bg-[#0f1629] rounded-3xl hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer border border-blue-50 dark:border-blue-900/20 ${
                              selectedSoutenances.has(item.id)
                                  ? "ring-1 ring-blue-300 dark:ring-blue-700"
                                  : ""
                          }`}
                          onClick={() => openEditDialog(item)}
                      >
                          <div className={`absolute top-0 left-0 w-2 h-full ${diplomaType === "Licence" ? "bg-gradient-to-b from-blue-500 to-blue-700" : "bg-gradient-to-b from-yellow-400 to-yellow-600"}`} />
                          <CardContent className="p-6">
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                                      {item.nom2 && item.nom2.trim() !== '' && (
                                          <div className="pt-2 border-t border-blue-50 dark:border-blue-900/10">
                                              <h4 className="text-xs font-black text-blue-300 uppercase tracking-widest mb-1">Binôme</h4>
                                              <p className="text-sm font-bold text-blue-800 dark:text-blue-100 uppercase">
                                                  {item.nom2} {item.prenoms2} ({item.matricule2})
                                              </p>
                                              <p className="text-[10px] text-blue-400">Né(e) le {formatDate(item.date_naissance2)} à {item.lieu_naissance2}</p>
                                          </div>
                                      )}

                                  </div>

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
                                                  <span className="text-xs font-bold text-purple-600">
                                    {item.speciality || "Non définie"}
                                </span>
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

                                  <div className="lg:col-span-3 flex flex-col justify-between items-end">
                                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {!item.nom2 && (
                                              <Button
                                                  size="icon"
                                                  variant="outline"
                                                  className="rounded-full w-10 h-10 border-blue-200 dark:border-blue-800 hover:bg-blue-600 hover:text-white"
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      setTargetBinomeItem(item);
                                                      setIsBinomeDialogOpen(true);
                                                  }}
                                                  title="Ajouter un binôme"
                                              >
                                                  <UserPlus className="w-4 h-4" />
                                              </Button>
                                          )}
                                          <Button size="icon" variant="ghost" className="rounded-full w-10 h-10 hover:bg-blue-50 dark:hover:bg-blue-900/30" onClick={(e) => { e.stopPropagation(); openEditDialog(item); }}>
                                              <Edit2 className="w-4 h-4 text-blue-500" />
                                          </Button>
                                          <Button size="icon" variant="ghost" className="rounded-full w-10 h-10 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500" onClick={(e) => { e.stopPropagation(); setItemToDelete({ id: item.id, name: `${item.nom} ${item.prenoms}` }); }}>
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
                  </div>

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

      <Dialog open={isBinomeDialogOpen} onOpenChange={setIsBinomeDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-black uppercase flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Former un binôme
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Rechercher un étudiant</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                <Input 
                  placeholder="Nom, prénoms ou matricule..." 
                  className="pl-10 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none shadow-inner"
                  value={binomeSearch}
                  onChange={(e) => setBinomeSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {binomeCandidates.length === 0 ? (
                <div className="text-center py-8 text-blue-400 text-sm">
                  {binomeSearch ? "Aucun étudiant trouvé" : "Commencez à taper pour rechercher"}
                </div>
              ) : (
                binomeCandidates.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => handleAddBinome(student)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-blue-900/10 border border-blue-50 dark:border-blue-900/20 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all group text-left"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold text-blue-900 dark:text-white group-hover:text-blue-600">
                        {student.nom} {student.prenoms}
                      </span>
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">
                        {student.matricule}
                      </span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-4 h-4 text-blue-600" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          <DialogFooter className="p-6 bg-blue-50 dark:bg-blue-900/20">
            <Button variant="ghost" onClick={() => setIsBinomeDialogOpen(false)} className="rounded-xl font-bold">Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-blue-900 dark:text-white uppercase tracking-tight">
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="text-blue-400 font-medium">
              Êtes-vous sûr de vouloir supprimer <span className="font-black text-blue-600">"{itemToDelete?.name}"</span> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold border-blue-200">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (itemToDelete) {
                  handleDelete(itemToDelete.id, itemToDelete.name);
                  setItemToDelete(null);
                }
              }}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
