const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Waves, Battery, AlertTriangle, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "energy", label: "Energy Tracker" },
  { id: "regulation", label: "Regulation Tools" },
  { id: "earlywarning", label: "Early Warning" },
];

const SPOON_LEVELS = [
  { value: 1, label: "Critically low", color: "bg-red-500", emoji: "🔴" },
  { value: 2, label: "Very low", color: "bg-orange-500", emoji: "🟠" },
  { value: 3, label: "Low", color: "bg-amber-500", emoji: "🟡" },
  { value: 4, label: "Getting there", color: "bg-lime-500", emoji: "🟢" },
  { value: 5, label: "Okay", color: "bg-emerald-500", emoji: "💚" },
  { value: 6, label: "Good", color: "bg-teal-500", emoji: "🩵" },
  { value: 7, label: "Pretty good", color: "bg-cyan-500", emoji: "💙" },
  { value: 8, label: "Well resourced", color: "bg-blue-500", emoji: "⚡" },
  { value: 9, label: "High capacity", color: "bg-indigo-500", emoji: "✨" },
  { value: 10, label: "Fully charged", color: "bg-violet-500", emoji: "💜" },
];

const REGULATION_STRATEGIES = [
  { category: "Movement", items: ["Shake out hands and arms", "Walk around for 2 minutes", "Jump or bounce in place", "Squeeze a stress ball or pillow", "Slow deep stretches"] },
  { category: "Breathing", items: ["4-7-8 breathing (in 4, hold 7, out 8)", "Box breathing (4 counts each side)", "Blow slowly through pursed lips", "Hum on the exhale"] },
  { category: "Stimming", items: ["Rock gently back and forth", "Tap a rhythm with your fingers", "Spin in a chair", "Flap hands or shake legs", "Chew gum or crunchy snack"] },
  { category: "Sensory Grounding", items: ["Name 5 things you can see", "Hold something cold or warm", "Put on noise-cancelling headphones", "Dim the lights if possible", "Wrap in a weighted blanket"] },
];

const WARNING_SIGNS = [
  "Getting louder or faster speech",
  "Increased stimming",
  "Short answers / shutting down",
  "Difficulty finding words",
  "Everything feels irritating",
  "Avoiding eye contact more than usual",
  "Feeling like crying for no clear reason",
  "Muscles tightening (jaw, shoulders, fists)",
  "Senses feeling sharper / more overwhelming",
  "Losing track of time or feeling foggy",
];

function speak(text) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

export default function Sensory() {
  const [activeTab, setActiveTab] = useState("energy");
  const [spoons, setSpoons] = useState(null);
  const [energyNote, setEnergyNote] = useState("");
  const [energyAdvice, setEnergyAdvice] = useState(null);
  const [energyLoading, setEnergyLoading] = useState(false);
  const [checkedWarnings, setCheckedWarnings] = useState({});
  const [warningAdvice, setWarningAdvice] = useState(null);
  const [warningLoading, setWarningLoading] = useState(false);

  const getEnergyAdvice = async () => {
    if (spoons === null) return;
    setEnergyLoading(true);
    const level = SPOON_LEVELS.find((s) => s.value === spoons);
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `An autistic person is tracking their energy using "spoon theory". They currently feel: ${level.label} (${spoons}/10).
Additional context they shared: "${energyNote || "none"}"

Give them:
1. A compassionate, non-judgmental acknowledgment of where they are
2. 2-3 suggestions appropriate for THIS energy level (not generic advice)
3. One thing they can safely say no to today
4. One small nourishing action they can do right now

Do NOT suggest they "push through" or imply they should have more energy. Meet them where they are.`,
      response_json_schema: {
        type: "object",
        properties: {
          acknowledgment: { type: "string" },
          suggestions: { type: "array", items: { type: "string" } },
          say_no_to: { type: "string" },
          right_now: { type: "string" },
        },
      },
    });
    setEnergyAdvice(result);
    setEnergyLoading(false);
  };

  const checkWarnings = async () => {
    const active = WARNING_SIGNS.filter((_, i) => checkedWarnings[i]);
    if (active.length === 0) return;
    setWarningLoading(true);
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `An autistic person is checking in on their early warning signs of overwhelm. They are currently noticing:
${active.map((s) => `- ${s}`).join("\n")}

This is ${active.length} out of ${WARNING_SIGNS.length} warning signs.

Give them:
1. A calm, non-alarmist assessment of where they are
2. The single most effective regulation strategy for right now
3. An exit strategy (how to leave or reduce input in the next 5 minutes)
4. A recovery note (what to do once they're somewhere safe/quiet)

Be warm, practical, and autistic-affirming. Do NOT catastrophize.`,
      response_json_schema: {
        type: "object",
        properties: {
          assessment: { type: "string" },
          regulation_now: { type: "string" },
          exit_strategy: { type: "string" },
          recovery: { type: "string" },
        },
      },
    });
    setWarningAdvice(result);
    setWarningLoading(false);
    speak(result.regulation_now);
  };

  return (
    <div className="space-y-6">
      <Link to="/autism" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div>
        <h2 className="text-2xl font-bold mb-1">Sensory Regulation</h2>
        <p className="text-muted-foreground text-sm">Know your patterns, regulate your nervous system, catch overwhelm early.</p>
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

      {/* Energy Tracker */}
      {activeTab === "energy" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Spoon theory: how much energy (spoons) do you have today? There's no right answer.
          </p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {SPOON_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => setSpoons(level.value)}
                title={level.label}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all",
                  spoons === level.value ? "border-primary scale-110 shadow-md" : "border-transparent hover:border-muted-foreground/30"
                )}
              >
                <span className="text-2xl">{level.emoji}</span>
                <span className="text-xs text-muted-foreground">{level.value}</span>
              </button>
            ))}
          </div>

          {spoons && (
            <div className="rounded-xl bg-card border border-border p-4 space-y-1">
              <p className="font-medium">{SPOON_LEVELS.find((s) => s.value === spoons)?.label}</p>
              <p className="text-sm text-muted-foreground">You said you have {spoons} spoon{spoons === 1 ? "" : "s"} today.</p>
            </div>
          )}

          <textarea
            value={energyNote}
            onChange={(e) => setEnergyNote(e.target.value)}
            placeholder="Anything else going on? (optional — e.g. didn't sleep well, busy week, sensory day)"
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />

          <Button onClick={getEnergyAdvice} disabled={spoons === null || energyLoading} className="rounded-xl">
            {energyLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Battery className="h-4 w-4 mr-2" />}
            Get personalised support
          </Button>

          <AnimatePresence>
            {energyAdvice && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                  <p className="text-sm leading-relaxed">{energyAdvice.acknowledgment}</p>
                </div>
                <div className="rounded-xl bg-card border border-border p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">For your energy level</p>
                  {energyAdvice.suggestions?.map((s, i) => (
                    <p key={i} className="text-sm flex gap-2"><span className="text-primary">•</span>{s}</p>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                    <p className="text-xs font-medium text-red-700 mb-1">It's okay to say no to</p>
                    <p className="text-sm text-red-800">{energyAdvice.say_no_to}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                    <p className="text-xs font-medium text-emerald-700 mb-1">Right now, try</p>
                    <p className="text-sm text-emerald-800">{energyAdvice.right_now}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Regulation Tools */}
      {activeTab === "regulation" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <p className="text-sm text-muted-foreground">Pick a category. These are suggestions, not rules.</p>
          {REGULATION_STRATEGIES.map((cat) => (
            <div key={cat.category} className="rounded-2xl bg-card border border-border p-5 space-y-3">
              <p className="font-semibold flex items-center gap-2">
                <Wind className="h-4 w-4 text-primary" /> {cat.category}
              </p>
              <div className="space-y-2">
                {cat.items.map((item) => (
                  <button
                    key={item}
                    onClick={() => speak(item)}
                    className="w-full text-left text-sm px-3 py-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Early Warning */}
      {activeTab === "earlywarning" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Check any signs you're noticing right now. This is an early warning system — catching overwhelm before it peaks.
          </p>
          <div className="space-y-2">
            {WARNING_SIGNS.map((sign, i) => (
              <button
                key={i}
                onClick={() => setCheckedWarnings((c) => ({ ...c, [i]: !c[i] }))}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left text-sm transition-all",
                  checkedWarnings[i] ? "border-amber-400 bg-amber-50 text-amber-900 font-medium" : "border-border bg-card hover:bg-muted"
                )}
              >
                <div className={cn("h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center",
                  checkedWarnings[i] ? "border-amber-500 bg-amber-500" : "border-muted-foreground"
                )}>
                  {checkedWarnings[i] && <span className="text-white text-xs">✓</span>}
                </div>
                {sign}
              </button>
            ))}
          </div>

          {Object.values(checkedWarnings).filter(Boolean).length > 0 && (
            <Button onClick={checkWarnings} disabled={warningLoading} className="w-full rounded-xl">
              {warningLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
              Get support for what I'm noticing ({Object.values(checkedWarnings).filter(Boolean).length} signs)
            </Button>
          )}

          <AnimatePresence>
            {warningAdvice && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                  <p className="text-sm leading-relaxed">{warningAdvice.assessment}</p>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-1">
                  <p className="text-xs font-medium text-amber-700">Right now</p>
                  <p className="text-sm text-amber-900">{warningAdvice.regulation_now}</p>
                </div>
                <div className="rounded-xl bg-card border border-border p-4 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Exit strategy</p>
                  <p className="text-sm">{warningAdvice.exit_strategy}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-1">
                  <p className="text-xs font-medium text-emerald-700">When you're somewhere safe</p>
                  <p className="text-sm text-emerald-800">{warningAdvice.recovery}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}