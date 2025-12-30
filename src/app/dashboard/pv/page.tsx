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
  Sparkles
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
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
  date_depot?: string;
}

export default function PVGenerationPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const filteredStudents = students.filter(s => 
    `${s.nom} ${s.prenoms} ${s.matricule} ${s.nom2 || ""} ${s.prenoms2 || ""}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const generatePV = async () => {
    if (!selectedStudent) {
      toast.error("Veuillez sélectionner un étudiant");
      return;
    }

    setGenerating(true);

    try {
      const studentNames = selectedStudent.nom2 
        ? `${selectedStudent.nom} ${selectedStudent.prenoms} & ${selectedStudent.nom2} ${selectedStudent.prenoms2}`
        : `${selectedStudent.nom} ${selectedStudent.prenoms}`;

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
              children: [
                new TextRun({ text: "RÉPUBLIQUE DU BÉNIN", bold: true, size: 24, font: "Arial" }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
              children: [
                new TextRun({ text: "MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR ET DE LA RECHERCHE SCIENTIFIQUE", size: 20, font: "Arial" }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
              children: [
                new TextRun({ text: "UNIVERSITÉ PIGIER", bold: true, size: 28, font: "Arial", color: "1e40af" }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
              children: [
                new TextRun({ text: "PROCÈS-VERBAL DE SOUTENANCE", bold: true, size: 32, underline: {}, font: "Arial" }),
              ],
            }),
            new Paragraph({
              spacing: { after: 300 },
              children: [
                new TextRun({ text: `Diplôme : `, bold: true, size: 24, font: "Arial" }),
                new TextRun({ text: selectedStudent.diploma_type || "Non spécifié", size: 24, font: "Arial" }),
              ],
            }),
            new Paragraph({
              spacing: { after: 300 },
              children: [
                new TextRun({ text: `Candidat(s) : `, bold: true, size: 24, font: "Arial" }),
                new TextRun({ text: studentNames, size: 24, font: "Arial", bold: true }),
              ],
            }),
            new Paragraph({
              spacing: { after: 300 },
              children: [
                new TextRun({ text: `Matricule(s) : `, bold: true, size: 24, font: "Arial" }),
                new TextRun({ text: selectedStudent.matricule2 ? `${selectedStudent.matricule} / ${selectedStudent.matricule2}` : selectedStudent.matricule, size: 24, font: "Arial" }),
              ],
            }),
            new Paragraph({
              spacing: { after: 400 },
              children: [
                new TextRun({ text: `Thème : `, bold: true, size: 24, font: "Arial" }),
                new TextRun({ text: selectedStudent.theme || "Non spécifié", size: 24, italics: true, font: "Arial" }),
              ],
            }),
            new Paragraph({
              spacing: { after: 200 },
              children: [
                new TextRun({ text: `Directeur de Mémoire : `, bold: true, size: 24, font: "Arial" }),
                new TextRun({ text: `${selectedStudent.directeur || "Non spécifié"} (${selectedStudent.grade_directeur || ""})`, size: 24, font: "Arial" }),
              ],
            }),
            new Paragraph({
              spacing: { after: 300 },
              children: [
                new TextRun({ text: "COMPOSITION DU JURY :", bold: true, size: 26, underline: {}, font: "Arial" }),
              ],
            }),
            new Paragraph({
              spacing: { after: 200 },
              children: [
                new TextRun({ text: `Président : `, bold: true, size: 24, font: "Arial" }),
                new TextRun({ text: `${selectedStudent.president || "À définir"} (${selectedStudent.grade_president || ""})`, size: 24, font: "Arial" }),
              ],
            }),
            new Paragraph({
              spacing: { after: 200 },
              children: [
                new TextRun({ text: `Examinateur : `, bold: true, size: 24, font: "Arial" }),
                new TextRun({ text: `${selectedStudent.examinateur || "À définir"} (${selectedStudent.grade_examinateur || ""})`, size: 24, font: "Arial" }),
              ],
            }),
            new Paragraph({
              spacing: { after: 200 },
              children: [
                new TextRun({ text: `Rapporteur : `, bold: true, size: 24, font: "Arial" }),
                new TextRun({ text: `${selectedStudent.rapporteur || "À définir"} (${selectedStudent.grade_rapporteur || ""})`, size: 24, font: "Arial" }),
              ],
            }),
            new Paragraph({
              spacing: { after: 600 },
              children: [
                new TextRun({ text: `Date de Soutenance : `, bold: true, size: 24, font: "Arial" }),
                new TextRun({ text: `${selectedStudent.date_soutenance || "À définir"} à ${selectedStudent.heure_soutenance || ""}`, size: 24, font: "Arial" }),
              ],
            }),
            new Paragraph({
              spacing: { after: 200 },
              children: [
                new TextRun({ text: `Salle : `, bold: true, size: 24, font: "Arial" }),
                new TextRun({ text: selectedStudent.salle || "À définir", size: 24, font: "Arial" }),
              ],
            }),
            new Paragraph({ text: "", spacing: { after: 800 } }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: `Fait à Cotonou, le ${new Date().toLocaleDateString('fr-FR')}`, italics: true, size: 22, font: "Arial" }),
              ],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PV_Soutenance_${selectedStudent.nom.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Procès-Verbal généré avec succès !");
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de la génération : " + err.message);
    } finally {
      setGenerating(false);
    }
  };

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

              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="h-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-none text-base font-semibold">
                  <SelectValue placeholder="Sélectionner un étudiant..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl max-h-80">
                  {loading ? (
                    <div className="p-4 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-blue-400">Aucun étudiant trouvé</div>
                  ) : (
                    filteredStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id} className="py-3">
                        <div className="flex flex-col">
                          <span className="font-bold">{student.nom} {student.prenoms}</span>
                          <span className="text-xs text-blue-400">{student.diploma_type} - {student.matricule}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <Button 
                onClick={generatePV}
                disabled={!selectedStudentId || generating}
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
                        { label: "Matricule", value: selectedStudent.matricule },
                        { label: "Étudiant", value: `${selectedStudent.nom} ${selectedStudent.prenoms}` },
                        { label: "Date de naissance", value: selectedStudent.date_naissance },
                        { label: "Lieu de naissance", value: selectedStudent.lieu_naissance },
                        { label: "Thème", value: selectedStudent.theme },
                        { label: "Directeur", value: `${selectedStudent.directeur} (${selectedStudent.grade_directeur})` },
                        { label: "Date de soutenance", value: selectedStudent.date_soutenance },
                        { label: "Heure", value: selectedStudent.heure_soutenance },
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
    </div>
  );
}
