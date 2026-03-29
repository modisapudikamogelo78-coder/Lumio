const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Zap, Play, Pause, RotateCcw, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const DURATIONS = [15, 25, 45];

function speak(text) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9; u.pitch = 1.05;
  window.speechSynthesis.speak(u);
}

export default function Focus() {
  const [energy, setEnergy] = useState(null);
  const [duration, setDuration] = useState(25);
  const [aiTask, setAiTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("setup");
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => { clearInterval(intervalRef.current); window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    } else if (secondsLeft === 0 && running) {
      setRunning(false);
      setPhase("done");
      speak("Session complete! You showed up and did the work. That counts.");
    }
    return () => clearInterval(intervalRef.current);
  }, [running, secondsLeft]);

  const pickTask = async () => {
    setLoading(true);
    const tasks = await db.entities.ADHDTask.filter({ bucket: "today", completed: false });
    const checkins = await db.entities.ADHDCheckin.list("-created_date", 3);
    const avgEnergy = energy || (checkins.length ? Math.round(checkins.reduce((a, c) => a + c.energy, 0) / checkins.length) : 3);

    if (tasks.length === 0) {
      setAiTask({ title: "Free session", rationale: "No tasks queued — use this time however feels right. Rest counts." });
      setLoading(false);
      return;
    }

    const result = await db.integrations.Core.InvokeLLM({
      prompt: `You are an AI executive assistant for someone with ADHD. 
Current energy level: ${avgEnergy}/5. Available focus time: ${duration} minutes.
Their task list for today:
${tasks.map((t, i) => `${i + 1}. ${t.title}${t.notes ? ` (${t.notes})` : ""}`).join("\n")}

Pick the SINGLE best task to focus on right now. Consider energy and time available.
Give: the task title (exact match), a one-sentence rationale, and a concrete first action.`,
      response_json_schema: {
        type: "object",
        properties: {
          task_title: { type: "string" },
          rationale: { type: "string" },
          first_action: { type: "string" },
        },
      },
    });

    const match = tasks.find((t) => t.title.toLowerCase().includes(result.task_title?.toLowerCase().slice(0, 20)));
    if (match) await db.entities.ADHDTask.update(match.id, { ai_selected: true });

    setAiTask(result);
    setLoading(false);
    speak(`Let's focus on: ${result.task_title}. To start: ${result.first_action}`);
  };

  const startSession = () => {
    setSecondsLeft(duration * 60);
    setRunning(true);
    setPhase("session");
  };

  const mins = secondsLeft !== null ? Math.floor(secondsLeft / 60) : duration;
  const secs = secondsLeft !== null ? secondsLeft % 60 : 0;
  const progress = secondsLeft !== null ? secondsLeft / (duration * 60) : 1;
  const circumference = 2 * Math.PI * 90;

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <Link to="/adhd" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div>
        <h2 className="text-2xl font-bold mb-1">Focus Mode</h2>
        <p className="text-muted-foreground text-sm">One task. One session. No decision paralysis.</p>
      </div>

      <AnimatePresence mode="wait">
        {phase === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium">How's your energy right now?</p>
              <div className="flex gap-3">
                {[{ v: 1, e: "😴" }, { v: 2, e: "😔" }, { v: 3, e: "😐" }, { v: 4, e: "😊" }, { v: 5, e: "⚡" }].map(({ v, e }) => (
                  <button key={v} onClick={() => setEnergy(v)}
                    className={cn("flex-1 py-3 rounded-xl text-2xl border-2 transition-all",
                      energy === v ? "border-primary bg-primary/10 scale-110" : "border-border hover:border-primary/40")}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Session length</p>
              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <button key={d} onClick={() => setDuration(d)}
                    className={cn("flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all",
                      duration === d ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40")}>
                    {d} min
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={pickTask} disabled={loading} size="lg" className="w-full rounded-xl">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              {loading ? "AI is picking your task..." : "Pick my task & start"}
            </Button>
            {aiTask && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-amber-50 border border-amber-200 p-5 space-y-3">
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Your focus task</p>
                <p className="text-xl font-bold">{aiTask.task_title || aiTask.title}</p>
                <p className="text-sm text-amber-800">{aiTask.rationale}</p>
                {aiTask.first_action && (
                  <div className="rounded-xl bg-white border border-amber-200 p-3">
                    <p className="text-xs text-amber-600 font-medium mb-1">First action (do this NOW):</p>
                    <p className="text-sm font-medium">{aiTask.first_action}</p>
                  </div>
                )}
                <Button onClick={startSession} size="lg" className="w-full rounded-xl">
                  <Play className="h-4 w-4 mr-2" /> Start {duration}-min session
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {phase === "session" && (
          <motion.div key="session" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6">
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-3 text-center">
              <p className="text-sm font-semibold">{aiTask?.task_title || aiTask?.title || "Free session"}</p>
            </div>
            <div className="relative flex items-center justify-center">
              <svg width="220" height="220" className="-rotate-90">
                <circle cx="110" cy="110" r="90" fill="none" stroke="hsl(var(--muted))" strokeWidth="14" />
                <circle cx="110" cy="110" r="90" fill="none" stroke="hsl(var(--primary))" strokeWidth="14"
                  strokeLinecap="round" strokeDasharray={circumference}
                  strokeDashoffset={circumference - circumference * progress}
                  style={{ transition: "stroke-dashoffset 1s linear" }} />
              </svg>
              <div className="absolute text-center">
                <p className="text-5xl font-bold tabular-nums">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</p>
                <p className="text-sm text-muted-foreground mt-1">{running ? "focusing..." : "paused"}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setRunning(!running)} variant="outline" size="lg" className="rounded-xl px-8">
                {running ? <><Pause className="h-4 w-4 mr-2" />Pause</> : <><Play className="h-4 w-4 mr-2" />Resume</>}
              </Button>
              <Button onClick={() => { setRunning(false); setPhase("done"); }} variant="ghost" size="lg" className="rounded-xl">Done early</Button>
            </div>
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-10">
            <div className="inline-flex p-5 rounded-2xl bg-green-100">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Session complete! 🎉</h3>
              <p className="text-muted-foreground">You showed up and did the work. That counts.</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { setPhase("setup"); setAiTask(null); setSecondsLeft(null); }} className="rounded-xl">
                <RotateCcw className="h-4 w-4 mr-2" /> Another session
              </Button>
              <Link to="/adhd/tasks">
                <Button variant="outline" className="rounded-xl">Update task board</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}