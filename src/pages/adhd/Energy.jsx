const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Battery, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const MOODS = [
  { id: "great", emoji: "🚀" }, { id: "good", emoji: "😊" }, { id: "okay", emoji: "😐" },
  { id: "low", emoji: "😔" }, { id: "rough", emoji: "😩" },
];
const SESSIONS = ["morning", "midday", "evening"];

export default function Energy() {
  const [energy, setEnergy] = useState(null);
  const [mood, setMood] = useState(null);
  const [session, setSession] = useState("morning");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]);
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    db.entities.ADHDCheckin.list("-created_date", 30).then(setHistory);
  }, []);

  const save = async () => {
    if (!energy || !mood) return;
    setSaving(true);
    await db.entities.ADHDCheckin.create({ energy, mood, note, session_type: session });
    const updated = await db.entities.ADHDCheckin.list("-created_date", 30);
    setHistory(updated);
    setSaved(true); setSaving(false); setNote("");
  };

  const getInsight = async () => {
    if (history.length < 5) return;
    setInsightLoading(true);
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `Analyze ADHD energy check-in history:\n${history.slice(0, 20).map((c) => `${c.session_type} | energy: ${c.energy}/5 | mood: ${c.mood}`).join("\n")}\n\nIdentify: peak energy windows, crash patterns, one scheduling recommendation, one self-care observation. Be specific and compassionate.`,
      response_json_schema: {
        type: "object",
        properties: {
          peak_windows: { type: "string" },
          crash_patterns: { type: "string" },
          scheduling_tip: { type: "string" },
          self_care: { type: "string" },
        },
      },
    });
    setInsight(result);
    setInsightLoading(false);
  };

  const chartData = [...history].reverse().slice(-14).map((c, i) => ({ name: `${i + 1}`, energy: c.energy }));

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <Link to="/adhd" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div>
        <h2 className="text-2xl font-bold mb-1">Energy Tracker</h2>
        <p className="text-muted-foreground text-sm">3-second check-in. AI learns your patterns over time.</p>
      </div>

      <div className="rounded-2xl bg-card border border-border p-6 space-y-5">
        <div className="flex gap-2 flex-wrap">
          {SESSIONS.map((s) => (
            <button key={s} onClick={() => setSession(s)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-all",
                session === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}>
              {s}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Energy level</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button key={v} onClick={() => setEnergy(v)}
                className={cn("flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all",
                  energy === v ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40")}>
                {v}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground px-1"><span>drained</span><span>charged</span></div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Mood</p>
          <div className="flex gap-2">
            {MOODS.map((m) => (
              <button key={m.id} onClick={() => setMood(m.id)}
                className={cn("flex-1 py-2.5 rounded-xl text-2xl border-2 transition-all",
                  mood === m.id ? "border-primary bg-primary/10 scale-110" : "border-border hover:border-primary/30")}>
                {m.emoji}
              </button>
            ))}
          </div>
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything notable? (optional)"
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        <Button onClick={save} disabled={!energy || !mood || saving || saved} className="w-full rounded-xl">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Battery className="h-4 w-4 mr-2" />}
          {saved ? "Saved ✓" : "Log check-in"}
        </Button>
        {saved && <p className="text-center text-sm text-emerald-600 font-medium">Logged! Keep going. 💙</p>}
      </div>

      {chartData.length > 2 && (
        <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">Energy trend (last {chartData.length} check-ins)</p>
            <Button onClick={getInsight} disabled={insightLoading || history.length < 5} size="sm" variant="outline" className="rounded-xl">
              {insightLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" hide /><YAxis domain={[1, 5]} hide />
              <Tooltip formatter={(v) => [`${v}/5`, "Energy"]} />
              <Line type="monotone" dataKey="energy" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <AnimatePresence>
        {insight && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {[
              { label: "Peak windows", value: insight.peak_windows, cls: "bg-emerald-50 border-emerald-200 text-emerald-800" },
              { label: "Crash patterns", value: insight.crash_patterns, cls: "bg-amber-50 border-amber-200 text-amber-800" },
              { label: "Scheduling tip", value: insight.scheduling_tip, cls: "bg-blue-50 border-blue-200 text-blue-800" },
              { label: "Self-care", value: insight.self_care, cls: "bg-violet-50 border-violet-200 text-violet-800" },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-xl border p-4 space-y-1", item.cls.split(" ").slice(0, 2).join(" "))}>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{item.label}</p>
                <p className={cn("text-sm leading-relaxed", item.cls.split(" ")[2])}>{item.value}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}