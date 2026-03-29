const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Circle, Trash2, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const BUCKETS = [
  { id: "today", label: "Today", color: "text-violet-600", bg: "bg-violet-50 border-violet-200", badge: "bg-violet-600" },
  { id: "later", label: "Later", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", badge: "bg-blue-500" },
  { id: "someday", label: "Someday", color: "text-muted-foreground", bg: "bg-muted/50 border-border", badge: "bg-muted-foreground" },
];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [activeBucket, setActiveBucket] = useState("today");
  const [aiSurfacing, setAiSurfacing] = useState(false);
  const [aiPicks, setAiPicks] = useState([]);

  useEffect(() => {
    db.entities.ADHDTask.filter({ completed: false }).then(setTasks);
  }, []);

  const addTask = async () => {
    if (!input.trim()) return;
    const task = await db.entities.ADHDTask.create({ title: input, bucket: activeBucket, completed: false });
    setTasks((prev) => [...prev, task]);
    setInput("");
  };

  const complete = async (task) => {
    await db.entities.ADHDTask.update(task.id, { completed: true, completed_at: new Date().toISOString() });
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  const remove = async (task) => {
    await db.entities.ADHDTask.delete(task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  const moveTo = async (task, bucket) => {
    await db.entities.ADHDTask.update(task.id, { bucket });
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, bucket } : t));
  };

  const surfaceTopThree = async () => {
    setAiSurfacing(true);
    const checkins = await db.entities.ADHDCheckin.list("-created_date", 1);
    const energy = checkins[0]?.energy || 3;
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `ADHD task prioritization. Energy: ${energy}/5.\nTasks:\n${tasks.map((t, i) => `${i + 1}. [${t.bucket}] ${t.title}`).join("\n")}\n\nPick 3 most important for today given energy ${energy}/5. Quick win first if energy is low.`,
      response_json_schema: {
        type: "object",
        properties: { picks: { type: "array", items: { type: "object", properties: { title: { type: "string" }, reason: { type: "string" } } } } },
      },
    });
    setAiPicks(result.picks || []);
    for (const pick of result.picks || []) {
      const match = tasks.find((t) => t.title.toLowerCase().includes(pick.title.toLowerCase().slice(0, 15)));
      if (match && match.bucket !== "today") await moveTo(match, "today");
    }
    setAiSurfacing(false);
  };

  const byBucket = (bucket) => tasks.filter((t) => t.bucket === bucket);

  return (
    <div className="space-y-6">
      <Link to="/adhd" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">Task Board</h2>
          <p className="text-muted-foreground text-sm">Today · Later · Someday. No overload.</p>
        </div>
        <Button onClick={surfaceTopThree} disabled={aiSurfacing || tasks.length === 0} variant="outline" className="rounded-xl">
          {aiSurfacing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />} AI pick my top 3
        </Button>
      </div>

      <AnimatePresence>
        {aiPicks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl bg-violet-50 border border-violet-200 p-4 space-y-2">
            <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">AI surfaced for today</p>
            {aiPicks.map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-violet-500 font-bold text-sm">{i + 1}.</span>
                <div><p className="text-sm font-medium">{p.title}</p><p className="text-xs text-violet-600">{p.reason}</p></div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Add a task..."
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <Button onClick={addTask} disabled={!input.trim()} className="rounded-xl"><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="flex gap-2">
          {BUCKETS.map((b) => (
            <button key={b.id} onClick={() => setActiveBucket(b.id)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                activeBucket === b.id ? `${b.bg} ${b.color} border` : "bg-card border-border text-muted-foreground hover:bg-muted")}>
              Add to {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BUCKETS.map((bucket) => {
          const bucketTasks = byBucket(bucket.id);
          return (
            <div key={bucket.id} className={cn("rounded-2xl border p-4 space-y-3", bucket.bg)}>
              <div className="flex items-center justify-between">
                <p className={cn("font-semibold text-sm", bucket.color)}>{bucket.label}</p>
                <span className={cn("text-xs font-medium text-white px-2 py-0.5 rounded-full", bucket.badge)}>{bucketTasks.length}</span>
              </div>
              <AnimatePresence>
                {bucketTasks.map((task) => (
                  <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="rounded-xl bg-card border border-border p-3 space-y-2 group">
                    <div className="flex items-start gap-2">
                      <button onClick={() => complete(task)} className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors">
                        <Circle className="h-4 w-4" />
                      </button>
                      <p className="text-sm flex-1 leading-snug">{task.title}</p>
                      <button onClick={() => remove(task)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-1 flex-wrap pl-6">
                      {BUCKETS.filter((b) => b.id !== bucket.id).map((b) => (
                        <button key={b.id} onClick={() => moveTo(task, b.id)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">→ {b.label}</button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {bucketTasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-4 opacity-50">Empty</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}