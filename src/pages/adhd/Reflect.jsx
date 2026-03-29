const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Moon, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

import { motion, AnimatePresence } from "framer-motion";

function speak(text) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.88;
  window.speechSynthesis.speak(u);
}

export default function Reflect() {
  const [phase, setPhase] = useState("start");
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [celebration, setCelebration] = useState(null);
  const [tomorrowTasks, setTomorrowTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completedToday, setCompletedToday] = useState([]);

  useEffect(() => {
    db.entities.ADHDTask.filter({ completed: true }).then((tasks) => {
      const today = new Date().toDateString();
      setCompletedToday(tasks.filter((t) => t.completed_at && new Date(t.completed_at).toDateString() === today));
    });
  }, []);

  const startReflection = () => {
    setPhase("q1");
    speak("Let's do a quick reflection. What's one thing you did today that you're glad about — even if it feels small?");
  };

  const submitQ1 = () => { if (!answer1.trim()) return; setPhase("q2"); speak("Good. What's one thing that was hard today, or that you didn't finish?"); };

  const submitQ2 = async () => {
    if (!answer2.trim()) return;
    setLoading(true); setPhase("celebrating");
    const tasks = await db.entities.ADHDTask.filter({ bucket: "later", completed: false });
    const checkins = await db.entities.ADHDCheckin.list("-created_date", 3);
    const avgEnergy = checkins.length ? Math.round(checkins.reduce((a, c) => a + c.energy, 0) / checkins.length) : 3;

    const result = await db.integrations.Core.InvokeLLM({
      prompt: `End-of-day ADHD reflection.\nGlad about: "${answer1}"\nHard/unfinished: "${answer2}"\nCompleted today: ${completedToday.map((t) => t.title).join(", ") || "none"}\nAverage energy: ${avgEnergy}/5\nTask backlog:\n${tasks.map((t, i) => `${i + 1}. ${t.title}`).join("\n") || "None"}\n\nProvide: a genuine celebration of their wins, a compassionate reframe of what was hard, the 3 best tasks for tomorrow, a warm closing sentence.`,
      response_json_schema: {
        type: "object",
        properties: {
          celebration: { type: "string" },
          reframe: { type: "string" },
          tomorrow_tasks: { type: "array", items: { type: "string" } },
          closing: { type: "string" },
        },
      },
    });

    setCelebration(result);
    if (result.tomorrow_tasks?.length) {
      setTomorrowTasks(result.tomorrow_tasks);
      for (const title of result.tomorrow_tasks) {
        const match = tasks.find((t) => t.title.toLowerCase().includes(title.toLowerCase().slice(0, 15)));
        if (match) await db.entities.ADHDTask.update(match.id, { bucket: "today" });
      }
    }
    setLoading(false); setPhase("preload");
    speak(result.celebration + " " + result.closing);
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <Link to="/adhd" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div>
        <h2 className="text-2xl font-bold mb-1">Daily Reflection</h2>
        <p className="text-muted-foreground text-sm">Two questions. A celebration. Tomorrow, ready to go.</p>
      </div>

      <AnimatePresence mode="wait">
        {phase === "start" && (
          <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-sky-500/5 border border-cyan-200/50 p-8 text-center space-y-4">
              <div className="inline-flex p-4 rounded-2xl bg-cyan-100"><Moon className="h-8 w-8 text-cyan-600" /></div>
              <div>
                <h3 className="text-xl font-bold mb-2">End of day check-in</h3>
                <p className="text-muted-foreground text-sm">Two quick questions. This will take 2 minutes and set you up for tomorrow.</p>
              </div>
              {completedToday.length > 0 && (
                <div className="rounded-xl bg-white/70 p-3 space-y-1 text-left">
                  <p className="text-xs font-medium text-muted-foreground">Completed today:</p>
                  {completedToday.map((t) => <p key={t.id} className="text-sm font-medium text-emerald-700">✓ {t.title}</p>)}
                </div>
              )}
              <Button onClick={startReflection} size="lg" className="w-full rounded-xl">
                <Moon className="h-4 w-4 mr-2" /> Start reflection
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "q1" && (
          <motion.div key="q1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
            <div className="rounded-xl bg-cyan-50 border border-cyan-200 px-5 py-4">
              <p className="text-xs text-cyan-700 font-medium mb-1">Question 1 of 2</p>
              <p className="font-semibold">What's one thing you did today that you're glad about — even if it feels small?</p>
            </div>
            <textarea value={answer1} onChange={(e) => setAnswer1(e.target.value)} autoFocus
              placeholder="It can be anything — showing up, making a call, getting out of bed..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" rows={4} />
            <Button onClick={submitQ1} disabled={!answer1.trim()} size="lg" className="w-full rounded-xl">
              <Send className="h-4 w-4 mr-2" /> Next
            </Button>
          </motion.div>
        )}

        {phase === "q2" && (
          <motion.div key="q2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
            <div className="rounded-xl bg-cyan-50 border border-cyan-200 px-5 py-4">
              <p className="text-xs text-cyan-700 font-medium mb-1">Question 2 of 2</p>
              <p className="font-semibold">What's one thing that was hard today, or that you didn't finish?</p>
            </div>
            <textarea value={answer2} onChange={(e) => setAnswer2(e.target.value)} autoFocus
              placeholder="No judgment — this is just information, not a report card."
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" rows={4} />
            <Button onClick={submitQ2} disabled={!answer2.trim() || loading} size="lg" className="w-full rounded-xl">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {loading ? "Reflecting..." : "Finish reflection"}
            </Button>
          </motion.div>
        )}

        {(phase === "celebrating" || phase === "preload") && celebration && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-200 p-6 space-y-2">
              <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wide">Today's wins</p>
              <p className="text-sm leading-relaxed">{celebration.celebration}</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">About what was hard</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{celebration.reframe}</p>
            </div>
            {tomorrowTasks.length > 0 && (
              <div className="rounded-xl bg-violet-50 border border-violet-200 p-4 space-y-2">
                <p className="text-xs font-semibold text-violet-700">Pre-loaded for tomorrow</p>
                {tomorrowTasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="h-5 w-5 rounded-full bg-violet-200 text-violet-700 text-xs flex items-center justify-center font-bold">{i + 1}</span>{t}
                  </div>
                ))}
                <p className="text-xs text-violet-600">These are now in your Today list.</p>
              </div>
            )}
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
              <p className="text-sm font-medium text-emerald-800">{celebration.closing}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}