"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Download, 
  Search, 
  UserCheck, 
  Trophy,
  Loader2
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

interface DirectorStats {
  name: string;
  count: number;
}

export function DirectorsView({ diplomaType }: { diplomaType: string }) {
  const [directors, setDirectors] = useState<DirectorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
    doc.text(`Liste des Directeurs - ${diplomaType}`, 14, 15);
    
    autoTable(doc, {
      startY: 25,
      head: [['#', 'Nom du Directeur', 'Nombre d\'encadrements']],
      body: directors.map((d, i) => [i + 1, d.name, d.count]),
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] },
    });
    
    doc.save(`Directeurs_${diplomaType}.pdf`);
  };

  const filteredDirectors = directors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tighter text-black dark:text-white uppercase italic">
            Directeurs <span className="text-zinc-400 not-italic">{diplomaType}</span>
          </h1>
          <p className="text-zinc-500 font-medium">Statistiques d'encadrement par enseignant</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input 
              placeholder="Rechercher un directeur..." 
              className="pl-10 h-12 w-64 rounded-xl border-none bg-white dark:bg-black shadow-sm focus:ring-1 focus:ring-zinc-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button 
            onClick={downloadPDF}
            className="h-12 px-6 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-xs hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="border-none shadow-sm bg-black dark:bg-white text-white dark:text-black rounded-3xl overflow-hidden group">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 dark:bg-black/5 flex items-center justify-center">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Directeurs</p>
              <h3 className="text-3xl font-black tracking-tighter">{directors.length}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-white dark:bg-black rounded-3xl overflow-hidden group">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-zinc-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Major d'encadrement</p>
              <h3 className="text-xl font-black text-black dark:text-white uppercase truncate max-w-[200px]">
                {directors[0]?.name || "N/A"}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-black rounded-3xl overflow-hidden group">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
              <Users className="w-7 h-7 text-zinc-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Encadrements</p>
              <h3 className="text-3xl font-black text-black dark:text-white tracking-tighter">
                {directors.reduce((acc, curr) => acc + curr.count, 0)}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-black rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-transparent h-16">
                <TableHead className="w-20 text-center font-black uppercase tracking-widest text-[10px] text-zinc-400">#</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] text-zinc-400">Nom du Directeur</TableHead>
                <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-zinc-400 pr-10">Encadrements</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="h-20 animate-pulse">
                    <TableCell colSpan={3} className="px-10"><div className="h-4 bg-zinc-50 dark:bg-zinc-900 rounded-full w-full" /></TableCell>
                  </TableRow>
                ))
              ) : filteredDirectors.length === 0 ? (
                <TableRow className="h-64">
                  <TableCell colSpan={3} className="text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Users className="w-12 h-12 text-zinc-100" />
                      <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">Aucun directeur trouvé</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDirectors.map((director, index) => (
                  <motion.tr
                    key={director.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group border-b border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors h-20"
                  >
                    <TableCell className="text-center font-black text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center font-black text-xs text-zinc-500 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all">
                          {director.name.charAt(0)}
                        </div>
                        <span className="font-black text-black dark:text-white uppercase tracking-tight group-hover:translate-x-1 transition-transform inline-block">
                          {director.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-900 font-black text-black dark:text-white group-hover:scale-110 transition-transform">
                        {director.count}
                      </span>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
