const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Clock, Inbox, LayoutList, Battery, Moon, ArrowRight, Sparkles } from "lucide-react";

const MODULES = [
  { id: "focus", title: "Focus Mode", description: "One task. One session. AI picks where to start so you don't have to.", icon: Zap, path: "/adhd/focus", gradient: "from-amber-500 to-orange-500", color: "text-amber-600" },
  { id: "timeanchor", title: "Time Anchor", description: "A living clock that makes time feel real — with layered transition warnings.", icon: Clock, path: "/adhd/time", gradient: "from-blue-500 to-indigo-500", color: "text-blue-600" },
  { id: "capture", title: "Quick Capture", description: "One tap to dump a thought. No sorting, no friction. AI handles the rest.", icon: Inbox, path: "/adhd/capture", gradient: "from-emerald-500 to-teal-500", color: "text-emerald-600" },
  { id: "tasks", title: "Task Board", description: "Today / Later / Someday. The AI surfaces your three most important tasks.", icon: LayoutList, path: "/adhd/tasks", gradient: "from-violet-500 to-purple-500", color: "text-violet-600" },
  { id: "energy", title: "Energy Tracker", description: "A 3-second check-in. Over time, AI learns your peak windows.", icon: Battery, path: "/adhd/energy", gradient: "from-pink-500 to-rose-500", color: "text-pink-600" },
  { id: "reflect", title: "Daily Reflection", description: "A short debrief. Celebrate what got done. Pre-load tomorrow.", icon: Moon, path: "/adhd/reflect", gradient: "from-cyan-500 to-sky-500", color: "text-cyan-600" },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

export default function ADHDHome() {
  const [todayCount, setTodayCount] = useState(0);
  const [latestEnergy, setLatestEnergy] = useState(null);

  useEffect(() => {
    db.entities.ADHDTask.filter({ bucket: "today", completed: false }).then((tasks) => setTodayCount(tasks.length));
    db.entities.ADHDCheckin.list("-created_date", 1).then((c) => setLatestEnergy(c[0] || null));
  }, []);

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-8 md:p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">ADHD Support</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">One system. Not ten apps.</h1>
          <p className="text-muted-foreground max-w-xl text-base leading-relaxed">
            An AI executive core that ties focus, time, tasks, energy, and reflection together — so switching between tools stops being the problem.
          </p>
          <div className="flex items-center gap-6 mt-5">
            {todayCount > 0 && (
              <div className="flex items-center gap-2 text-sm font-medium">
                <LayoutList className="h-4 w-4 text-violet-600" />
                <span>{todayCount} task{todayCount !== 1 ? "s" : ""} for today</span>
              </div>
            )}
            {latestEnergy && (
              <div className="flex items-center gap-2 text-sm font-medium">
                <Battery className="h-4 w-4 text-pink-600" />
                <span>Energy: {latestEnergy.energy}/5 · {latestEnergy.mood}</span>
              </div>
            )}
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((mod) => (
          <motion.div key={mod.id} variants={item}>
            <Link to={mod.path} className="block group">
              <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 h-full transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${mod.gradient} mb-4`}>
                  <mod.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-base font-semibold mb-1.5">{mod.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{mod.description}</p>
                <div className={`flex items-center gap-2 text-sm font-medium ${mod.color} group-hover:gap-3 transition-all`}>
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}