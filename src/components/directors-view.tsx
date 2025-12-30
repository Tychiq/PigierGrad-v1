"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Download, 
  Search, 
  UserCheck, 
  Trophy,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";

interface DirectorStats {
  name: string;
  count: number;
}

const ITEMS_PER_PAGE = 10;

export function DirectorsView({ diplomaType }: { diplomaType: string }) {
  const [directors, setDirectors] = useState<DirectorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchDirectors = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("soutenances")
        .select("directeur")
        .eq("diploma_type", diplomaType);

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach(item => {
          if (item.directeur) {
            counts[item.directeur] = (counts[item.directeur] || 0) + 1;
          }
        });
        
        const stats = Object.entries(counts).map(([name, count]) => ({
          name,
          count
        })).sort((a, b) => b.count - a.count);
        
        setDirectors(stats);
      }
      setLoading(false);
    };

    fetchDirectors();
  }, [diplomaType]);

    const downloadPDF = () => {
      const doc = new jsPDF();
      
      // Add a header background or border
      doc.setDrawColor(30, 64, 175); // Blue-800
      doc.setLineWidth(1);
      doc.line(10, 10, 200, 10);
      doc.line(10, 45, 200, 45);

      doc.setFontSize(26);
      doc.setTextColor(30, 64, 175);
      doc.setFont("helvetica", "bold");
      doc.text("PIGIERGRAD", 105, 25, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "italic");
      doc.text("Plateforme Officielle de Gestion des Soutenances", 105, 32, { align: "center" });

      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(`LISTE DES DIRECTEURS - ${diplomaType.toUpperCase()}`, 105, 55, { align: "center" });
      
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 105, 62, { align: "center" });
      
      autoTable(doc, {
        startY: 70,
        head: [['N°', 'NOM DU DIRECTEUR', 'NOMBRE D\'ENCADREMENTS']],
        body: filteredDirectors.map((d, i) => [i + 1, d.name.toUpperCase(), d.count]),
        theme: 'striped',
        headStyles: { 
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 4
        },
        bodyStyles: {
          fontSize: 9,
          halign: 'center',
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 120, halign: 'left', fontStyle: 'bold' },
          2: { cellWidth: 40 }
        },
        margin: { top: 70 },
        didDrawPage: (data) => {
          // Footer
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text("PIGIERGRAD - Tous droits réservés", 105, 285, { align: "center" });
          doc.text(`Page ${data.pageNumber}`, 190, 285, { align: "right" });
        }
      });
      
      doc.save(`PIGIERGRAD_Directeurs_${diplomaType}_${new Date().toISOString().split('T')[0]}.pdf`);
    };


  const filteredDirectors = directors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDirectors.length / ITEMS_PER_PAGE);
  const paginatedDirectors = filteredDirectors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Statistiques d'Encadrement</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-blue-900 dark:text-white uppercase">
            Directeurs <span className={diplomaType === "Licence" ? "text-blue-500" : "text-yellow-500"}>{diplomaType}</span>
          </h1>
          <p className="text-blue-600/70 dark:text-blue-400 font-medium">
            {directors.length} directeur(s) référencé(s)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
            <Input 
              placeholder="Rechercher un directeur..." 
              className="pl-10 h-12 w-64 rounded-xl border-none bg-white dark:bg-[#0f1629] shadow-lg focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <Button 
            onClick={downloadPDF}
            className="h-12 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg shadow-blue-600/30"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-950 text-white rounded-3xl overflow-hidden">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Total Directeurs</p>
              <h3 className="text-4xl font-black tracking-tighter">{directors.length}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-lg bg-white dark:bg-[#0f1629] rounded-3xl overflow-hidden">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-yellow-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Top Encadreur</p>
              <h3 className="text-xl font-black text-blue-900 dark:text-white uppercase truncate max-w-[200px]">
                {directors[0]?.name || "N/A"}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white dark:bg-[#0f1629] rounded-3xl overflow-hidden">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Total Encadrements</p>
              <h3 className="text-4xl font-black text-blue-900 dark:text-white tracking-tighter">
                {directors.reduce((acc, curr) => acc + curr.count, 0)}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg bg-white dark:bg-[#0f1629] rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-blue-100 dark:border-blue-900/50 hover:bg-transparent h-16">
                <TableHead className="w-20 text-center font-black uppercase tracking-widest text-[10px] text-blue-400">#</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-blue-400">Nom du Directeur</TableHead>
                <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-blue-400 pr-10">Encadrements</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="h-20 animate-pulse">
                    <TableCell colSpan={3} className="px-10"><div className="h-4 bg-blue-50 dark:bg-blue-900/30 rounded-full w-full" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedDirectors.length === 0 ? (
                <TableRow className="h-64">
                  <TableCell colSpan={3} className="text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Users className="w-10 h-10 text-blue-300" />
                      </div>
                      <p className="text-blue-900 dark:text-white font-bold uppercase tracking-widest text-sm">Aucun directeur trouvé</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDirectors.map((director, index) => {
                  const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
                  return (
                    <motion.tr
                      key={director.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="group border-b border-blue-50 dark:border-blue-900/30 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors h-16"
                    >
                      <TableCell className="text-center font-black text-blue-300 group-hover:text-blue-600 transition-colors">
                        {globalIndex + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center font-black text-sm text-blue-600 dark:text-blue-300 group-hover:from-blue-600 group-hover:to-blue-700 group-hover:text-white transition-all">
                            {director.name.charAt(0)}
                          </div>
                          <span className="font-bold text-blue-900 dark:text-white group-hover:translate-x-1 transition-transform inline-block">
                            {director.name}
                          </span>
                          {globalIndex === 0 && (
                            <span className="text-[10px] font-black bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 px-2 py-0.5 rounded-full">TOP</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <span className="inline-flex items-center justify-center w-12 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 font-black text-blue-900 dark:text-white group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {director.count}
                        </span>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
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
