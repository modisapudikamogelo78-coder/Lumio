const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Clock, CheckCircle2, Circle, Loader2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "tasks", label: "Task Breakdown" },
  { id: "timer", label: "Visual Timer" },
  { id: "transition", label: "Transition Warnings" },
];

function VisualTimer() {
  const [minutes, setMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  const total = minutes * 60;

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    } else if (secondsLeft === 0 && running) {
      setRunning(false);
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("Time's up! Great work. Take a break whenever you're ready.");
      window.speechSynthesis.speak(u);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, secondsLeft]);

  const start = () => { setSecondsLeft(minutes * 60); setRunning(true); };
  const stop = () => { setRunning(false); clearInterval(intervalRef.current); };
  const reset = () => { stop(); setSecondsLeft(null); };

  const progress = secondsLeft !== null ? secondsLeft / total : 1;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * progress;

  const displayMins = secondsLeft !== null ? Math.floor(secondsLeft / 60) : minutes;
  const displaySecs = secondsLeft !== null ? secondsLeft % 60 : 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground text-center">A visual timer — no alarming countdowns, just a calm visual.</p>
      <div className="relative flex items-center justify-center">
        <svg width="200" height="200" className="-rotate-90">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
          <circle
            cx="100" cy="100" r={radius} fill="none"
            stroke="hsl(var(--primary))" strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - strokeDash}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute text-center">
          <p className="text-4xl font-bold tabular-nums">
            {String(displayMins).padStart(2, "0")}:{String(displaySecs).padStart(2, "0")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{running ? "in progress" : "ready"}</p>
        </div>
      </div>

      {!running && secondsLeft === null && (
        <div className="flex items-center gap-3">
          {[5, 10, 15, 25, 30, 45, 60].map((m) => (
            <button
              key={m}
              onClick={() => setMinutes(m)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-sm font-medium border transition-all",
                minutes === m ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {m}m
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        {!running ? (
          <Button onClick={start} className="rounded-xl px-8">
            <Clock className="h-4 w-4 mr-2" /> {secondsLeft !== null ? "Resume" : "Start"}
          </Button>
        ) : (
          <Button onClick={stop} variant="outline" className="rounded-xl px-8">Pause</Button>
        )}
        {secondsLeft !== null && (
          <Button onClick={reset} variant="ghost" className="rounded-xl">Reset</Button>
        )}
      </div>
    </div>
  );
}

function TransitionWarnings() {
  const [event, setEvent] = useState("");
  const [warnMinutes, setWarnMinutes] = useState(10);
  const [active, setActive] = useState(false);
  const [timeoutRef] = useState({ current: null });

  const schedule = () => {
    if (!event.trim()) return;
    clearTimeout(timeoutRef.current);
    setActive(true);
    timeoutRef.current = setTimeout(() => {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`Heads up — in about ${warnMinutes} minutes: ${event}. You've got time to finish up and prepare.`);
      u.rate = 0.88;
      window.speechSynthesis.speak(u);
      setActive(false);
    }, warnMinutes * 60 * 1000);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Set a gentle spoken warning before an upcoming transition — so you have time to wrap up and prepare.
      </p>
      <div className="space-y-3">
        <label className="text-sm font-medium">What's happening?</label>
        <input
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          placeholder="e.g. leaving for school, dinner time, video call..."
          className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Warn me this many minutes before:</label>
        <div className="flex flex-wrap gap-2">
          {[5, 10, 15, 20, 30].map((m) => (
            <button
              key={m}
              onClick={() => setWarnMinutes(m)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                warnMinutes === m ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>
      <Button onClick={schedule} disabled={!event.trim()} className="rounded-xl">
        <Bell className="h-4 w-4 mr-2" /> Set warning
      </Button>
      {active && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 font-medium">
          ✅ Warning set — you'll be notified {warnMinutes} minutes before "{event}"
        </motion.div>
      )}
    </div>
  );
}

export default function ExecutiveFunction() {
  const [activeTab, setActiveTab] = useState("tasks");
  const [taskInput, setTaskInput] = useState("");
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState({});

  const breakdown = async () => {
    if (!taskInput.trim()) return;
    setLoading(true);
    setSteps([]);
    setChecked({});
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `You are helping an autistic person with executive function challenges. They need to do this task:

"${taskInput}"

Break it into clear, small, concrete steps. Each step should:
- Be ONE action only (not "do X and Y")
- Start with a verb
- Be achievable in 5–15 minutes max
- Account for transition time and energy
- Include a "body double" note if the task might need external accountability

Also provide:
- A gentle task initiation prompt (the first thing to physically do to get started)
- An estimated total time
- A note about what counts as "done enough" (to prevent perfectionism spirals)`,
      response_json_schema: {
        type: "object",
        properties: {
          steps: {
            type: "array",
            items: { type: "object", properties: { step: { type: "string" }, time_estimate: { type: "string" } } },
          },
          initiation_prompt: { type: "string" },
          total_time: { type: "string" },
          done_enough: { type: "string" },
        },
      },
    });
    setSteps(result.steps || []);
    setLoading(false);

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`Okay! Here's how to start: ${result.initiation_prompt}`);
    u.rate = 0.88;
    window.speechSynthesis.speak(u);
  };

  const toggleCheck = (i) => setChecked((c) => ({ ...c, [i]: !c[i] }));
  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <Link to="/autism" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div>
        <h2 className="text-2xl font-bold mb-1">Executive Function</h2>
        <p className="text-muted-foreground text-sm">Task breakdown, visual timers, and transition warnings.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === tab.id ? "bg-primary text-primary-foreground shadow" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "tasks" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <p className="text-sm text-muted-foreground">What do you need to do? We'll break it into manageable steps.</p>
          <div className="flex gap-3">
            <input
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && breakdown()}
              placeholder="e.g. write a cover letter, clean my room, make a phone call..."
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={breakdown} disabled={!taskInput.trim() || loading} className="rounded-xl">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-10 gap-3">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Breaking it down...</p>
            </div>
          )}

          {steps.length > 0 && (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{doneCount} of {steps.length} done</p>
                  <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
                  </div>
                </div>

                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer",
                      checked[i] ? "bg-muted/50 border-muted opacity-60" : "bg-card border-border hover:border-primary/30"
                    )}
                    onClick={() => toggleCheck(i)}
                  >
                    {checked[i] ? <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" /> : <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />}
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium", checked[i] && "line-through text-muted-foreground")}>{step.step}</p>
                      {step.time_estimate && <p className="text-xs text-muted-foreground mt-0.5">{step.time_estimate}</p>}
                    </div>
                  </motion.div>
                ))}

                {doneCount === steps.length && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                    <p className="text-emerald-700 font-semibold text-lg">🎉 You did it!</p>
                    <p className="text-emerald-600 text-sm mt-1">Every step counts. That was real work.</p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      )}

      {activeTab === "timer" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <VisualTimer />
        </motion.div>
      )}

      {activeTab === "transition" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <TransitionWarnings />
        </motion.div>
      )}
    </div>
  );
}