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
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  NumberFormat
} from "docx";
import { saveAs } from "file-saver";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState("");

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

  const flattenedStudents: FlatStudent[] = students.flatMap(s => {
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
        const doc = new Document({
          sections: [{
            properties: {
              page: {
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            children: [
              // Header Section
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "RÉPUBLIQUE DU BÉNIN", bold: true, size: 24, font: "Arial" }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "----------", bold: true, font: "Arial" }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR ET DE LA RECHERCHE SCIENTIFIQUE", size: 18, font: "Arial" }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "----------", bold: true, font: "Arial" }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                children: [
                  new TextRun({ text: "ÉCOLE SUPÉRIEURE DE COMMERCE ET D'ADMINISTRATION DES ENTREPRISES", bold: true, size: 20, font: "Arial" }),
                  new TextRun({ text: "\nPIGIER - BÉNIN", bold: true, size: 32, color: "1e40af", font: "Arial" }),
                ],
              }),

              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                children: [
                  new TextRun({ 
                    text: "PROCÈS-VERBAL DE SOUTENANCE DE FIN DE CYCLE", 
                    bold: true, 
                    size: 36, 
                    underline: { type: "single" },
                    font: "Arial"
                  }),
                ],
              }),

                // Session Section
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 200, after: 400 },
                  children: [
                    new TextRun({ 
                      text: `SESSION DE : ${selectedStudent.session_month?.toUpperCase() || "...................."} ${selectedStudent.session_year || "202..."}`, 
                      bold: true, 
                      size: 28,
                      font: "Arial",
                      color: "1e40af"
                    }),
                  ],
                }),

                // Identification Table with better styling
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
                  },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 40, type: WidthType.PERCENTAGE },
                          shading: { fill: "f8fafc" },
                          children: [new Paragraph({ children: [new TextRun({ text: "DIPLÔME", bold: true, font: "Arial", size: 20 })] })]
                        }),
                        new TableCell({
                          width: { size: 60, type: WidthType.PERCENTAGE },
                          children: [new Paragraph({ children: [new TextRun({ text: selectedStudent.diploma_type?.toUpperCase() || "LICENCE", font: "Arial", size: 20, bold: true })] })]
                        }),
                      ],
                    }),
                    new TableRow({
                      children: [
                        new TableCell({
                          shading: { fill: "f8fafc" },
                          children: [new Paragraph({ children: [new TextRun({ text: "SPÉCIALITÉ", bold: true, font: "Arial", size: 20 })] })]
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: selectedStudent.speciality?.toUpperCase() || "NON PRÉCISÉE", font: "Arial", size: 20, bold: true })] })]
                        }),
                      ],
                    }),
                  ],
                }),

                new Paragraph({ spacing: { before: 300 } }),

                new Paragraph({
                  children: [new TextRun({ text: "I. IDENTITÉ DU CANDIDAT", bold: true, underline: {}, font: "Arial", size: 24, color: "1e40af" })],
                  spacing: { after: 200 },
                }),
                
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({ 
                          width: { size: 35, type: WidthType.PERCENTAGE },
                          shading: { fill: "f8fafc" },
                          children: [new Paragraph({ children: [new TextRun({ text: "Nom & Prénoms :", bold: true, font: "Arial" })] })] 
                        }),
                        new TableCell({ 
                          width: { size: 65, type: WidthType.PERCENTAGE },
                          children: [new Paragraph({ children: [new TextRun({ 
                            text: `${selectedStudent.currentNom} ${selectedStudent.currentPrenoms}`.toUpperCase(), 
                            font: "Arial", 
                            bold: true 
                          })] })] 
                        }),
                      ],
                    }),
                    new TableRow({
                      children: [
                        new TableCell({ shading: { fill: "f8fafc" }, children: [new Paragraph({ children: [new TextRun({ text: "Numéro Matricule :", bold: true, font: "Arial" })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ 
                          text: selectedStudent.currentMatricule, 
                          font: "Arial", 
                          bold: true 
                        })] })] }),
                      ],
                    }),
                    new TableRow({
                      children: [
                        new TableCell({ shading: { fill: "f8fafc" }, children: [new Paragraph({ children: [new TextRun({ text: "Date et Lieu de Naissance :", bold: true, font: "Arial" })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [
                          new TextRun({ text: `${formatDate(selectedStudent.currentDateNaissance)} à ${selectedStudent.currentLieuNaissance}`, font: "Arial" }),
                        ] })] }),
                      ],
                    }),
                  ],
                }),


              // Theme
              new Paragraph({
                spacing: { before: 400, after: 200 },
                children: [
                  new TextRun({ text: "THÈME DU MÉMOIRE : ", bold: true, font: "Arial", size: 22 }),
                  new TextRun({ text: selectedStudent.theme || "Non spécifié", italics: true, font: "Arial", size: 22 }),
                ],
              }),

              // Jury Table
              new Paragraph({
                children: [new TextRun({ text: "COMPOSITION DU JURY", bold: true, underline: {}, font: "Arial", size: 24 })],
                spacing: { before: 400, after: 200 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ shading: { fill: "1e40af" }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "FONCTION", bold: true, color: "ffffff", font: "Arial" })] })] }),
                      new TableCell({ shading: { fill: "1e40af" }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NOM & PRÉNOMS", bold: true, color: "ffffff", font: "Arial" })] })] }),
                      new TableCell({ shading: { fill: "1e40af" }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "GRADE", bold: true, color: "ffffff", font: "Arial" })] })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ text: "PRÉSIDENT", font: "Arial" })] }),
                      new TableCell({ children: [new Paragraph({ text: selectedStudent.president || "................................................", font: "Arial" })] }),
                      new TableCell({ children: [new Paragraph({ text: selectedStudent.grade_president || "..........", font: "Arial" })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ text: "EXAMINATEUR", font: "Arial" })] }),
                      new TableCell({ children: [new Paragraph({ text: selectedStudent.examinateur || "................................................", font: "Arial" })] }),
                      new TableCell({ children: [new Paragraph({ text: selectedStudent.grade_examinateur || "..........", font: "Arial" })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ text: "RAPPORTEUR", font: "Arial" })] }),
                      new TableCell({ children: [new Paragraph({ text: selectedStudent.rapporteur || "................................................", font: "Arial" })] }),
                      new TableCell({ children: [new Paragraph({ text: selectedStudent.grade_rapporteur || "..........", font: "Arial" })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ text: "DIRECTEUR", font: "Arial" })] }),
                      new TableCell({ children: [new Paragraph({ text: selectedStudent.directeur || "................................................", font: "Arial" })] }),
                      new TableCell({ children: [new Paragraph({ text: selectedStudent.grade_directeur || "..........", font: "Arial" })] }),
                    ],
                  }),
                ],
              }),

              // Results Section
              new Paragraph({
                children: [new TextRun({ text: "RÉSULTATS DE LA SOUTENANCE", bold: true, underline: {}, font: "Arial", size: 24 })],
                spacing: { before: 400, after: 200 },
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "NOTE OBTENUE (/20)", bold: true, font: "Arial" })] })] }),
                      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: ".................... / 20", font: "Arial" })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "MENTION", bold: true, font: "Arial" })] })] }),
                      new TableCell({ children: [new Paragraph({ text: "................................................", font: "Arial" })] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "DÉCISION DU JURY", bold: true, font: "Arial" })] })] }),
                      new TableCell({ children: [new Paragraph({ text: "ADMIS(E) / AJOURNÉ(E)", font: "Arial" })] }),
                    ],
                  }),
                ],
              }),

              // Observations
              new Paragraph({
                spacing: { before: 400, after: 100 },
                children: [new TextRun({ text: "OBSERVATIONS :", bold: true, font: "Arial" })],
              }),
              new Paragraph({
                children: [new TextRun({ text: "............................................................................................................................................................", font: "Arial" })],
              }),
              new Paragraph({
                children: [new TextRun({ text: "............................................................................................................................................................", font: "Arial" })],
              }),

              // Signatures
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 600, after: 400 },
                children: [
                  new TextRun({ text: `Fait à Cotonou, le ${formatDate(selectedStudent.date_soutenance)}`, italics: true, font: "Arial" }),
                ],
              }),

              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                  insideHorizontal: { style: BorderStyle.NONE },
                  insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ 
                        children: [
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Le Rapporteur", bold: true, font: "Arial" })] }),
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\n\n\n\n" })] }),
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(Signature)", font: "Arial" })] }),
                        ] 
                      }),
                      new TableCell({ 
                        children: [
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Le Président du Jury", bold: true, font: "Arial" })] }),
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\n\n\n\n" })] }),
                          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(Signature et Cachet)", font: "Arial" })] }),
                        ] 
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }],
        });


        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const filename = `PV_Soutenance_${selectedStudent.currentNom.replace(/\s+/g, '_')}.docx`;
        
        setDownloadUrl(url);
        setDownloadFilename(filename);
        setShowSuccessDialog(true);
        
        toast.success("Procès-Verbal généré avec succès !");

    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de la génération : " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl && downloadFilename) {
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = downloadUrl;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // We don't revoke here because user might want to click again or we do it on dialog close
    }
  };

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        window.URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

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
          <DialogFooter className="flex-col sm:flex-row gap-3 pb-4">
            <Button
              variant="outline"
              onClick={() => setShowSuccessDialog(false)}
              className="flex-1 h-12 rounded-xl border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Fermer
            </Button>
            <Button
              onClick={handleDownload}
              className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/30"
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
