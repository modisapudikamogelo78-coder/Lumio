const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, Calculator, Brain, Zap, TrendingUp, Calendar, BarChart2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { cn } from "@/lib/utils";

const MODULE_COLORS = {
  dyslexia: "bg-violet-100 text-violet-700 border-violet-200",
  dyscalculia: "bg-blue-100 text-blue-700 border-blue-200",
  autism: "bg-emerald-100 text-emerald-700 border-emerald-200",
  adhd: "bg-amber-100 text-amber-700 border-amber-200",
};

const MODULE_ICONS = { dyslexia: BookOpen, dyscalculia: Calculator, autism: Brain, adhd: Zap };

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 flex items-start gap-4">
      <div className={cn("p-2.5 rounded-xl", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function ParentDashboard() {
  const [learningSessions, setLearningSessions] = useState([]);
  const [mathProgress, setMathProgress] = useState([]);
  const [adhdTasks, setAdhdTasks] = useState([]);
  const [adhdCheckins, setAdhdCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      db.entities.LearningSession.list("-created_date", 50),
      db.entities.MathProgress.list("-updated_date", 20),
      db.entities.ADHDTask.list("-created_date", 50),
      db.entities.ADHDCheckin.list("-created_date", 30),
    ]).then(([sessions, math, tasks, checkins]) => {
      setLearningSessions(sessions);
      setMathProgress(math);
      setAdhdTasks(tasks);
      setAdhdCheckins(checkins);
      setLoading(false);
    });
  }, []);

  const getAiInsight = async () => {
    setInsightLoading(true);
    const completedTasks = adhdTasks.filter((t) => t.completed).length;
    const avgMastery = mathProgress.length ? Math.round(mathProgress.reduce((a, m) => a + (m.mastery_level || 0), 0) / mathProgress.length) : null;
    const avgEnergy = adhdCheckins.length ? (adhdCheckins.reduce((a, c) => a + c.energy, 0) / adhdCheckins.length).toFixed(1) : null;
    const struggles = mathProgress.filter((m) => (m.mastery_level || 0) < 50).map((m) => m.topic);
    const dyslexiaSessions = learningSessions.filter((s) => s.module === "dyslexia").length;

    const result = await db.integrations.Core.InvokeLLM({
      prompt: `You are helping a parent or teacher understand a student's learning progress in an adaptive learning app.

Summary of their activity:
- Dyslexia support sessions: ${dyslexiaSessions}
- Math average mastery: ${avgMastery !== null ? avgMastery + "%" : "no data yet"}
- Math topics needing support: ${struggles.join(", ") || "none identified"}
- ADHD tasks completed: ${completedTasks} total
- Average energy check-in: ${avgEnergy !== null ? avgEnergy + "/5" : "no data yet"}
- Total learning sessions: ${learningSessions.length}

Please provide:
1. 2-3 specific strengths to celebrate and reinforce
2. 2-3 areas where the student is working hard and may need extra support
3. 3 concrete things a parent/teacher can do to reinforce learning OUTSIDE the app
4. One encouragement note to share with the student directly

Be specific, practical, and strengths-focused. Avoid clinical language.`,
      response_json_schema: {
        type: "object",
        properties: {
          strengths: { type: "array", items: { type: "string" } },
          support_areas: { type: "array", items: { type: "string" } },
          parent_actions: { type: "array", items: { type: "string" } },
          student_note: { type: "string" },
        },
      },
    });
    setAiInsight(result);
    setInsightLoading(false);
  };

  // Chart data: sessions per module
  const moduleCounts = learningSessions.reduce((acc, s) => {
    acc[s.module] = (acc[s.module] || 0) + 1;
    return acc;
  }, {});
  const moduleChartData = Object.entries(moduleCounts).map(([module, count]) => ({ module, count }));

  // ADHD energy trend
  const energyChartData = [...adhdCheckins].reverse().slice(-10).map((c, i) => ({
    i: i + 1,
    energy: c.energy,
  }));

  // Math topic bars
  const mathChartData = mathProgress.map((m) => ({
    topic: m.topic?.replace("_", " ") || "unknown",
    mastery: m.mastery_level || 0,
  }));

  const totalSessions = learningSessions.length;
  const completedSessions = learningSessions.filter((s) => s.completed).length;
  const completedTasks = adhdTasks.filter((t) => t.completed).length;
  const avgEnergy = adhdCheckins.length
    ? (adhdCheckins.reduce((a, c) => a + c.energy, 0) / adhdCheckins.length).toFixed(1)
    : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <p className="text-muted-foreground">Loading progress data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Parent & Teacher Dashboard</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Learning Progress Overview</h1>
          <p className="text-muted-foreground text-sm max-w-lg leading-relaxed">
            See patterns, celebrate growth, and find out where your support outside the app can make the biggest difference.
          </p>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Total sessions" value={totalSessions} sub={`${completedSessions} completed`} color="bg-primary/10 text-primary" />
        <StatCard icon={CheckCircle2} label="Tasks done" value={completedTasks} sub="ADHD module" color="bg-amber-100 text-amber-600" />
        <StatCard icon={BarChart2} label="Math topics" value={mathProgress.length} sub="tracked so far" color="bg-blue-100 text-blue-600" />
        <StatCard icon={TrendingUp} label="Avg. energy" value={avgEnergy} sub="out of 5" color="bg-pink-100 text-pink-600" />
      </div>

      {/* Module activity */}
      {moduleChartData.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-semibold">Activity by module</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(moduleCounts).map(([module, count]) => {
              const Icon = MODULE_ICONS[module] || BookOpen;
              return (
                <div key={module} className={cn("rounded-xl border p-4 text-center", MODULE_COLORS[module] || "bg-muted text-muted-foreground border-border")}>
                  <Icon className="h-5 w-5 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs font-medium capitalize">{module}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Math progress */}
      {mathChartData.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <div>
            <h2 className="font-semibold">Math topic mastery</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Topics under 50% may need extra reinforcement</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={mathChartData} barSize={24}>
              <XAxis dataKey="topic" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}%`, "Mastery"]} />
              <Bar dataKey="mastery" radius={[4, 4, 0, 0]}>
                {mathChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.mastery >= 80 ? "#22c55e" : entry.mastery >= 50 ? "#f59e0b" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-500" />Strong (80%+)</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Building (50-79%)</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" />Needs support (&lt;50%)</span>
          </div>
        </div>
      )}

      {/* Energy trend */}
      {energyChartData.length > 2 && (
        <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <div>
            <h2 className="font-semibold">Energy pattern (ADHD module)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Dips may correlate with learning difficulty or environmental stress</p>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={energyChartData} barSize={20}>
              <XAxis dataKey="i" hide />
              <YAxis domain={[0, 5]} hide />
              <Tooltip formatter={(v) => [`${v}/5`, "Energy"]} />
              <Bar dataKey="energy" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Math struggles */}
      {mathProgress.some((m) => (m.mastery_level || 0) < 50) && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <h2 className="font-semibold text-amber-800">Areas needing extra support</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {mathProgress.filter((m) => (m.mastery_level || 0) < 50).map((m) => (
              <div key={m.topic} className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-sm text-amber-800 font-medium capitalize">
                {m.topic?.replace("_", " ")}
              </div>
            ))}
          </div>
          <p className="text-sm text-amber-700">Consider extra real-world practice with these topics at home or in class.</p>
        </div>
      )}

      {/* AI Insight */}
      <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold">AI Progress Analysis</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Personalised insights for supporting this learner</p>
          </div>
          <Button onClick={getAiInsight} disabled={insightLoading || totalSessions === 0} variant="outline" className="rounded-xl">
            {insightLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />}
            Generate insights
          </Button>
        </div>

        {totalSessions === 0 && !aiInsight && (
          <p className="text-sm text-muted-foreground">No learning sessions recorded yet. Insights will appear once the student starts using Lumio.</p>
        )}

        {aiInsight && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Strengths to celebrate</p>
              {aiInsight.strengths?.map((s, i) => (
                <div key={i} className="flex gap-2 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />{s}
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Working hard on</p>
              {aiInsight.support_areas?.map((s, i) => (
                <div key={i} className="flex gap-2 text-sm text-amber-800">
                  <span className="text-amber-500 mt-0.5">•</span>{s}
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">How you can help (outside the app)</p>
              {aiInsight.parent_actions?.map((s, i) => (
                <div key={i} className="flex gap-2 text-sm text-blue-800">
                  <span className="font-bold text-blue-500">{i + 1}.</span>{s}
                </div>
              ))}
            </div>
            {aiInsight.student_note && (
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-1">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">Share with the student</p>
                <p className="text-sm italic leading-relaxed">"{aiInsight.student_note}"</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}