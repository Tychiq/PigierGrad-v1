"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  UserCheck, 
  Clock 
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
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSoutenances: 0,
    totalDirectors: 0,
    licenceCount: 0,
    masterCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase.from("soutenances").select("*");
      if (data) {
        const uniqueDirectors = new Set(data.map(s => s.directeur)).size;
        const licence = data.filter(s => s.diploma_type === "Licence").length;
        const master = data.filter(s => s.diploma_type === "Master").length;
        
        setStats({
          totalStudents: data.length,
          totalSoutenances: data.filter(s => s.date_soutenance).length,
          totalDirectors: uniqueDirectors,
          licenceCount: licence,
          masterCount: master,
        });
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  const chartData = [
    { name: "Licence", value: stats.licenceCount },
    { name: "Master", value: stats.masterCount },
  ];

  const COLORS = ["#000000", "#71717a"];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-black dark:text-white uppercase">
          Vue d'ensemble
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">
          Statistiques en temps réel de PigierGrad
        </p>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { title: "Étudiants", value: stats.totalStudents, icon: Users, description: "Total inscrits" },
          { title: "Soutenances", value: stats.totalSoutenances, icon: GraduationCap, description: "Planifiées" },
          { title: "Directeurs", value: stats.totalDirectors, icon: UserCheck, description: "Intervenants" },
          { title: "Taux Complétion", value: "85%", icon: TrendingUp, description: "+12.5% ce mois" },
        ].map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card className="border-none shadow-sm bg-white dark:bg-black overflow-hidden group hover:shadow-xl transition-all duration-500">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">{stat.title}</p>
                    <h3 className="text-3xl font-black text-black dark:text-white">{stat.value}</h3>
                  </div>
                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl group-hover:bg-black dark:group-hover:bg-white transition-colors duration-500">
                    <stat.icon className="w-5 h-5 text-zinc-500 group-hover:text-white dark:group-hover:text-black transition-colors" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{stat.description}</span>
                  <ArrowUpRight className="w-3 h-3 text-zinc-300" />
                </div>
              </CardContent>
              <div className="absolute bottom-0 left-0 h-1 bg-black dark:bg-white w-0 group-hover:w-full transition-all duration-700" />
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm bg-white dark:bg-black rounded-3xl overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-black tracking-tight uppercase">Distribution des Diplômes</CardTitle>
            <CardDescription>Répartition entre Licence et Master</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Jan', l: 10, m: 5 },
                { name: 'Fév', l: 25, m: 15 },
                { name: 'Mar', l: 45, m: 30 },
                { name: 'Avr', l: 30, m: 50 },
                { name: 'Mai', l: 60, m: 40 },
                { name: 'Juin', l: stats.licenceCount || 80, m: stats.masterCount || 60 },
              ]}>
                <defs>
                  <linearGradient id="colorL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#71717a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#a1a1aa'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#a1a1aa'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="l" stroke="#000000" strokeWidth={3} fillOpacity={1} fill="url(#colorL)" name="Licence" />
                <Area type="monotone" dataKey="m" stroke="#71717a" strokeWidth={3} fillOpacity={1} fill="url(#colorM)" name="Master" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-black rounded-3xl overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xl font-black tracking-tight uppercase">Répartition Actuelle</CardTitle>
          </CardHeader>
          <CardContent className="p-8 h-[400px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-black" />
                <span className="text-sm font-medium">Licence</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-400" />
                <span className="text-sm font-medium">Master</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-none shadow-sm bg-white dark:bg-black rounded-3xl overflow-hidden">
        <CardHeader className="p-8 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black tracking-tight uppercase">Activités Récentes</CardTitle>
            <CardDescription>Dernières inscriptions et mises à jour</CardDescription>
          </div>
          <Button variant="outline" className="rounded-xl font-bold text-xs uppercase tracking-widest h-10">Tout voir</Button>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="space-y-6">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                    <Clock className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-black dark:text-white uppercase tracking-tight">Nouvelle inscription</h4>
                    <p className="text-sm text-zinc-500">Étudiant ajouté à la liste Licence</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-zinc-300 block uppercase tracking-tighter">Il y a 2h</span>
                  <span className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded uppercase">Succès</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
