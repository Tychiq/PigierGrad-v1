"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  UserCheck, 
  Clock,
  FileUp,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  Legend
} from "recharts";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSoutenances: 0,
    totalDirectors: 0,
    licenceCount: 0,
    masterCount: 0,
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase.from("soutenances").select("*").order("created_at", { ascending: true });
      if (data) {
        const uniqueDirectors = new Set(data.map(s => s.directeur).filter(Boolean)).size;
        const licence = data.filter(s => s.diploma_type === "Licence").length;
        const master = data.filter(s => s.diploma_type === "Master").length;
        
        // Process monthly data for area chart
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const currentYear = new Date().getFullYear();
        
        const monthlyData = months.map((month, index) => {
          const monthLicence = data.filter(s => {
            const date = new Date(s.created_at);
            return date.getMonth() === index && date.getFullYear() === currentYear && s.diploma_type === "Licence";
          }).length;
          
          const monthMaster = data.filter(s => {
            const date = new Date(s.created_at);
            return date.getMonth() === index && date.getFullYear() === currentYear && s.diploma_type === "Master";
          }).length;
          
          return {
            name: month,
            licence: monthLicence,
            master: monthMaster
          };
        });

        // Cumulative data for the area chart to show growth
        let cumulativeLicence = 0;
        let cumulativeMaster = 0;
        const evolutionData = monthlyData.map(d => {
          cumulativeLicence += d.licence;
          cumulativeMaster += d.master;
          return {
            name: d.name,
            licence: cumulativeLicence,
            master: cumulativeMaster
          };
        });

        setStats({
          totalStudents: data.length,
          totalSoutenances: data.filter(s => s.date_soutenance).length,
          totalDirectors: uniqueDirectors,
          licenceCount: licence,
          masterCount: master,
        });
        setRecentStudents([...data].reverse().slice(0, 5));
        setAreaChartData(evolutionData);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  const [areaChartData, setAreaChartData] = useState<any[]>([]);

  const pieData = [
    { name: "Licence", value: stats.licenceCount || 0, fill: "#3b82f6" },
    { name: "Master", value: stats.masterCount || 0, fill: "#fbbf24" },
  ];

  const areaData = [
    { name: 'Jan', licence: 12, master: 8 },
    { name: 'Fév', licence: 19, master: 12 },
    { name: 'Mar', licence: 25, master: 18 },
    { name: 'Avr', licence: 32, master: 22 },
    { name: 'Mai', licence: 45, master: 35 },
    { name: 'Juin', licence: stats.licenceCount || 55, master: stats.masterCount || 42 },
  ];

  const radialData = [
    { name: 'Planifiées', value: stats.totalSoutenances, fill: '#3b82f6' },
    { name: 'En attente', value: Math.max(0, stats.totalStudents - stats.totalSoutenances), fill: '#fbbf24' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const completionRate = stats.totalStudents > 0 
    ? Math.round((stats.totalSoutenances / stats.totalStudents) * 100) 
    : 0;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Bienvenue sur PigierGrad</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-blue-900 dark:text-white uppercase">
            Vue d'ensemble
          </h1>
          <p className="text-blue-600/70 dark:text-blue-400 font-medium">
            Statistiques en temps réel des soutenances
          </p>
        </div>
        <Link href="/dashboard/insertion">
          <Button className="h-12 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg shadow-blue-600/30 transition-all hover:shadow-xl hover:shadow-blue-600/40">
            <FileUp className="w-4 h-4 mr-2" />
            Importer des données
          </Button>
        </Link>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { title: "Étudiants", value: stats.totalStudents, icon: Users, description: "Total inscrits", color: "blue", href: "/dashboard/licence" },
          { title: "Soutenances", value: stats.totalSoutenances, icon: GraduationCap, description: "Planifiées", color: "yellow", href: "/dashboard/licence" },
          { title: "Directeurs", value: stats.totalDirectors, icon: UserCheck, description: "Intervenants", color: "blue", href: "/dashboard/directeurs-licence" },
          { title: "Complétion", value: `${completionRate}%`, icon: TrendingUp, description: "Taux de planification", color: "green", href: "/dashboard/licence" },
        ].map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Link href={stat.href}>
              <Card className="relative border-none shadow-lg bg-white dark:bg-[#0f1629] overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer">
                <div className={`absolute top-0 left-0 w-full h-1 ${stat.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : stat.color === 'yellow' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-green-500 to-green-600'}`} />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">{stat.title}</p>
                      <h3 className="text-4xl font-black text-blue-900 dark:text-white">{stat.value}</h3>
                    </div>
                    <div className={`p-3 rounded-2xl transition-all duration-500 ${stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-600' : stat.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/30 group-hover:bg-yellow-500' : 'bg-green-50 dark:bg-green-900/30 group-hover:bg-green-600'}`}>
                      <stat.icon className={`w-6 h-6 transition-colors ${stat.color === 'blue' ? 'text-blue-600 group-hover:text-white' : stat.color === 'yellow' ? 'text-yellow-600 group-hover:text-white' : 'text-green-600 group-hover:text-white'}`} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-400">{stat.description}</span>
                    <ArrowUpRight className="w-3 h-3 text-blue-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-lg bg-white dark:bg-[#0f1629] rounded-3xl overflow-hidden">
          <CardHeader className="p-6 pb-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black text-blue-900 dark:text-white uppercase tracking-tight">Évolution des Inscriptions</CardTitle>
              <CardDescription className="text-blue-400">Tendance mensuelle Licence vs Master</CardDescription>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-xs font-semibold text-blue-600">Licence</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-xs font-semibold text-yellow-600">Master</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorLicence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMaster" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280', fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    padding: '12px 16px'
                  }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                />
                <Area type="monotone" dataKey="licence" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorLicence)" name="Licence" />
                <Area type="monotone" dataKey="master" stroke="#fbbf24" strokeWidth={3} fillOpacity={1} fill="url(#colorMaster)" name="Master" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 dark:from-blue-800 dark:via-blue-900 dark:to-blue-950 rounded-3xl overflow-hidden text-white">
          <CardHeader className="p-6 pb-0">
            <CardTitle className="text-xl font-black uppercase tracking-tight">Répartition</CardTitle>
            <CardDescription className="text-blue-200">Distribution actuelle des diplômes</CardDescription>
          </CardHeader>
          <CardContent className="p-6 h-[350px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-8 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
                <div className="flex flex-col">
                  <span className="text-xs text-blue-200">Licence</span>
                  <span className="text-lg font-black">{stats.licenceCount}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50" />
                <div className="flex flex-col">
                  <span className="text-xs text-blue-200">Master</span>
                  <span className="text-lg font-black">{stats.masterCount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-lg bg-white dark:bg-[#0f1629] rounded-3xl overflow-hidden">
          <CardHeader className="p-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black text-blue-900 dark:text-white uppercase tracking-tight">Dernières Inscriptions</CardTitle>
              <CardDescription className="text-blue-400">Étudiants récemment ajoutés</CardDescription>
            </div>
            <Link href="/dashboard/licence">
              <Button variant="outline" className="rounded-xl font-bold text-xs uppercase tracking-widest h-10 border-blue-200 dark:border-blue-800 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                Tout voir
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-4">
              {recentStudents.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="w-12 h-12 text-blue-200 mx-auto mb-3" />
                  <p className="text-blue-400 font-medium">Aucun étudiant enregistré</p>
                  <Link href="/dashboard/insertion">
                    <Button className="mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                      Importer des données
                    </Button>
                  </Link>
                </div>
              ) : (
                recentStudents.map((student, i) => (
                  <div key={i} className="flex items-center justify-between group p-3 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center font-black text-blue-600 dark:text-blue-300">
                        {student.nom?.charAt(0) || "?"}
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-900 dark:text-white">{student.nom} {student.prenoms}</h4>
                        <p className="text-xs text-blue-400 line-clamp-1 max-w-[200px]">{student.theme || "Thème non défini"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full ${student.diploma_type === 'Licence' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600'}`}>
                        {student.diploma_type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white dark:bg-[#0f1629] rounded-3xl overflow-hidden">
          <CardHeader className="p-6">
            <CardTitle className="text-xl font-black text-blue-900 dark:text-white uppercase tracking-tight">Actions Rapides</CardTitle>
            <CardDescription className="text-blue-400">Raccourcis vers les fonctionnalités clés</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: "Importer Excel", desc: "Ajouter des étudiants", icon: FileUp, href: "/dashboard/insertion", color: "blue" },
                { title: "Planning Licence", desc: "Gérer les soutenances", icon: GraduationCap, href: "/dashboard/licence", color: "blue" },
                { title: "Planning Master", desc: "Sessions Master", icon: GraduationCap, href: "/dashboard/master", color: "yellow" },
                { title: "Générer PV", desc: "Créer des documents", icon: Calendar, href: "/dashboard/pv", color: "green" },
              ].map((action, i) => (
                <Link key={i} href={action.href}>
                  <div className={`group p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer hover:shadow-lg ${action.color === 'blue' ? 'border-blue-200 dark:border-blue-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30' : action.color === 'yellow' ? 'border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30' : 'border-green-200 dark:border-green-800 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'}`}>
                    <action.icon className={`w-8 h-8 mb-3 ${action.color === 'blue' ? 'text-blue-500' : action.color === 'yellow' ? 'text-yellow-500' : 'text-green-500'}`} />
                    <h4 className="font-bold text-blue-900 dark:text-white text-sm">{action.title}</h4>
                    <p className="text-xs text-blue-400 mt-1">{action.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
