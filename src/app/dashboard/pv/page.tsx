"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  FileText, 
  Download, 
  Loader2, 
  CheckCircle2, 
  Search,
  Users,
  GraduationCap
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
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle } from "docx";
import { saveAs } from "file-saver";

interface Student {
  id: string;
  nom: string;
  prenoms: string;
  matricule: string;
  theme: string;
  directeur: string;
  jury: string;
  salle: string;
  date_soutenance: string;
  heure_soutenance: string;
  president: string;
  examinateur: string;
  rapporteur: string;
  diploma_type: string;
}

export default function PVGenerationPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const generatePV = async () => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) {
      toast.error("Veuillez sélectionner un étudiant");
      return;
    }

    setGenerating(true);
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "UNIVERSITÉ PIGIER", bold: true, size: 28 }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "PROCES VERBAL DE SOUTENANCE", bold: true, size: 24, underline: {} }),
              ],
            }),
            new Paragraph({ text: "", spacing: { after: 400 } }),
            new Paragraph({
              children: [
                new TextRun({ text: `Type de Diplôme: `, bold: true }),
                new TextRun({ text: student.diploma_type }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Étudiant: `, bold: true }),
                new TextRun({ text: `${student.nom} ${student.prenoms}` }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Matricule: `, bold: true }),
                new TextRun({ text: student.matricule }),
              ],
            }),
            new Paragraph({ text: "", spacing: { after: 200 } }),
            new Paragraph({
              children: [
                new TextRun({ text: `Thème: `, bold: true }),
                new TextRun({ text: student.theme, italic: true }),
              ],
            }),
            new Paragraph({ text: "", spacing: { after: 400 } }),
            new Paragraph({
              children: [
                new TextRun({ text: `Directeur de Mémoire: `, bold: true }),
                new TextRun({ text: student.directeur }),
              ],
            }),
            new Paragraph({ text: "", spacing: { after: 400 } }),
            new Paragraph({
              children: [
                new TextRun({ text: `Composition du Jury:`, bold: true, underline: {} }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `- Président: `, bold: true }),
                new TextRun({ text: student.president || "A définir" }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `- Examinateur: `, bold: true }),
                new TextRun({ text: student.examinateur || "A définir" }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `- Rapporteur: `, bold: true }),
                new TextRun({ text: student.rapporteur || "A définir" }),
              ],
            }),
            new Paragraph({ text: "", spacing: { after: 400 } }),
            new Paragraph({
              children: [
                new TextRun({ text: `Fait à Cotonou, le ${new Date().toLocaleDateString('fr-FR')}`, italic: true }),
              ],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `PV_${student.nom}_${student.prenoms}.docx`);
      setSuccess(true);
      toast.success("Procès Verbal généré avec succès !");
    } catch (err: any) {
      toast.error("Erreur lors de la génération : " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-black dark:text-white uppercase italic">
          Génération de PV
        </h1>
        <p className="text-zinc-500 font-medium">Éditez et téléchargez les procès-verbaux officiels</p>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-black rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Sélectionner l'Étudiant</label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none text-lg font-bold">
                    <SelectValue placeholder="Rechercher un étudiant..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl max-h-80">
                    <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <Input placeholder="Filtrer..." className="pl-9 h-10 bg-transparent border-none focus-visible:ring-0" />
                      </div>
                    </div>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id} className="py-3 font-bold">
                        <div className="flex flex-col">
                          <span>{student.nom} {student.prenoms}</span>
                          <span className="text-[10px] text-zinc-400 font-medium uppercase">{student.diploma_type} - {student.matricule}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-black flex items-center justify-center shadow-sm">
                  <FileText className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-black dark:text-white uppercase leading-none mb-1">Modèle Officiel</p>
                  <p className="text-xs text-zinc-500 font-medium">Les données seront injectées automatiquement dans le template DOCX standard de Pigier.</p>
                </div>
              </div>

              <Button 
                onClick={generatePV}
                disabled={!selectedStudentId || generating}
                className="w-full h-16 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-3"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Générer le Document
                  </>
                )}
              </Button>
            </div>

            <div className="relative aspect-square hidden md:flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 p-10 overflow-hidden group">
              <AnimatePresence mode="wait">
                {selectedStudentId ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-6 w-full"
                  >
                    <div className="w-20 h-20 bg-black dark:bg-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-3">
                      <FileText className="w-10 h-10 text-white dark:text-black" />
                    </div>
                    <div className="text-center space-y-2">
                      <h4 className="text-xl font-black text-black dark:text-white uppercase">Aperçu Prêt</h4>
                      <p className="text-sm text-zinc-500 font-medium">Prêt pour l'exportation DOCX</p>
                    </div>
                    <div className="space-y-3 bg-white dark:bg-black p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                      <div className="flex justify-between border-b border-zinc-50 pb-2">
                        <span className="text-[10px] font-black text-zinc-300 uppercase">Étudiant</span>
                        <span className="text-xs font-bold">{students.find(s => s.id === selectedStudentId)?.nom}</span>
                      </div>
                      <div className="flex justify-between border-b border-zinc-50 pb-2">
                        <span className="text-[10px] font-black text-zinc-300 uppercase">Jury</span>
                        <span className="text-xs font-bold">Complet</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-black text-zinc-300 uppercase">Format</span>
                        <span className="text-xs font-bold">DOCX / MS Word</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 text-zinc-300"
                  >
                    <Users className="w-16 h-16" />
                    <p className="font-bold uppercase tracking-widest text-xs">En attente de sélection</p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 p-8">
                <div className="w-2 h-2 bg-zinc-200 rounded-full" />
              </div>
              <div className="absolute bottom-0 left-0 p-8">
                <div className="w-2 h-2 bg-zinc-200 rounded-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Standardisation", desc: "Respect strict des normes académiques Pigier.", icon: CheckCircle2 },
          { title: "Rapidité", desc: "Génération en moins de 2 secondes par document.", icon: Loader2 },
          { title: "Archivage", desc: "Prêt pour l'impression et la signature physique.", icon: FileText },
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
