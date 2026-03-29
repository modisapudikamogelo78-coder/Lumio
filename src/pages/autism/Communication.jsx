const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mic, Volume2, AlertCircle, BookOpen, MessageSquare, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const QUICK_PHRASES = [
  { label: "I need a break", emoji: "🛑" },
  { label: "I can't talk right now", emoji: "🤫" },
  { label: "I'm overwhelmed", emoji: "😮💨" },
  { label: "Please give me space", emoji: "🙏" },
  { label: "I need help", emoji: "🆘" },
  { label: "I'm okay, just quiet", emoji: "✌️" },
  { label: "Yes", emoji: "✅" },
  { label: "No", emoji: "❌" },
  { label: "I don't know", emoji: "🤷" },
  { label: "Thank you", emoji: "💙" },
  { label: "Wait please", emoji: "⏸️" },
  { label: "I'm done for today", emoji: "🏁" },
];

const TONE_VOICES = [
  { id: "assertive", label: "Assertive" },
  { id: "polite", label: "Polite" },
  { id: "friendly", label: "Friendly" },
  { id: "professional", label: "Professional" },
];

const SCRIPT_SITUATIONS = [
  "Meeting someone new",
  "Doctor's appointment",
  "Setting a boundary",
  "Asking for accommodation",
  "Leaving an overwhelming place",
  "Ending a phone call",
  "Saying no",
  "Requesting quiet",
];

function speak(text) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

export default function Communication() {
  const [activeTab, setActiveTab] = useState("aac");
  // AAC state
  const [aacText, setAacText] = useState("");
  // Tone checker
  const [toneInput, setToneInput] = useState("");
  const [toneTarget, setToneTarget] = useState("polite");
  const [toneResult, setToneResult] = useState(null);
  const [toneLoading, setToneLoading] = useState(false);
  // Scripts
  const [selectedSituation, setSelectedSituation] = useState(null);
  const [scriptResult, setScriptResult] = useState(null);
  const [scriptLoading, setScriptLoading] = useState(false);

  const checkTone = async () => {
    if (!toneInput.trim()) return;
    setToneLoading(true);
    setToneResult(null);
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `You are helping an autistic person communicate effectively. They wrote this message:

"${toneInput}"

They want it to sound: ${toneTarget}

Please:
1. Rate the current tone (e.g. "Currently sounds a bit blunt")
2. Suggest an improved version that keeps their meaning but hits the "${toneTarget}" tone
3. Explain very briefly what changed and why (in plain language)

Be supportive and non-judgmental. Their original message is valid — this is just a translation tool.`,
      response_json_schema: {
        type: "object",
        properties: {
          current_tone_rating: { type: "string" },
          improved_version: { type: "string" },
          what_changed: { type: "string" },
        },
      },
    });
    setToneResult(result);
    setToneLoading(false);
  };

  const getScript = async (situation) => {
    setSelectedSituation(situation);
    setScriptLoading(true);
    setScriptResult(null);
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `You are helping an autistic person navigate a common social situation: "${situation}".

Write 3 different script options they could use. Make them:
- Natural and authentic (not robotic or overly formal)
- Varying in length (one short, one medium, one longer)
- Respectful of their autonomy — they can adapt these however they want
- Include a note about what to do if the conversation goes off-script

Do NOT include social "training" or tell them how they "should" behave. These are tools, not rules.`,
      response_json_schema: {
        type: "object",
        properties: {
          scripts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                text: { type: "string" },
              },
            },
          },
          off_script_tip: { type: "string" },
        },
      },
    });
    setScriptResult(result);
    setScriptLoading(false);
  };

  const tabs = [
    { id: "aac", label: "Quick AAC", icon: Zap },
    { id: "tone", label: "Tone Checker", icon: MessageSquare },
    { id: "scripts", label: "Script Library", icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      <Link to="/autism" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div>
        <h2 className="text-2xl font-bold mb-1">Communication Support</h2>
        <p className="text-muted-foreground text-sm">Tools for every kind of communication, your way.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === tab.id ? "bg-primary text-primary-foreground shadow" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* AAC Tab */}
      {activeTab === "aac" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Emergency phrases */}
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 space-y-3">
            <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
              <AlertCircle className="h-4 w-4" /> Emergency Quick Access
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUICK_PHRASES.slice(0, 6).map((p) => (
                <button
                  key={p.label}
                  onClick={() => { speak(p.label); setAacText(p.label); }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-white border border-red-200 text-sm font-medium hover:bg-red-50 transition-colors text-left"
                >
                  <span className="text-lg">{p.emoji}</span> {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* All phrases */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">All quick phrases</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUICK_PHRASES.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { speak(p.label); setAacText(p.label); }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border text-sm font-medium hover:bg-muted transition-colors text-left"
                >
                  <span className="text-lg">{p.emoji}</span> {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom text */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Or type your own</p>
            <Textarea
              value={aacText}
              onChange={(e) => setAacText(e.target.value)}
              placeholder="Type anything to speak aloud..."
              className="rounded-xl resize-none"
              rows={3}
            />
            <Button onClick={() => speak(aacText)} disabled={!aacText.trim()} className="rounded-xl">
              <Volume2 className="h-4 w-4 mr-2" /> Speak it
            </Button>
          </div>
        </motion.div>
      )}

      {/* Tone Checker Tab */}
      {activeTab === "tone" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Type a message and we'll show you how it reads — and suggest a version with a different tone if you want. Your message is always valid.
          </p>
          <Textarea
            value={toneInput}
            onChange={(e) => setToneInput(e.target.value)}
            placeholder="Paste or type the message you want to check..."
            className="rounded-xl resize-none min-h-[120px]"
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">I want it to sound:</p>
            <div className="flex flex-wrap gap-2">
              {TONE_VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setToneTarget(v.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                    toneTarget === v.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={checkTone} disabled={!toneInput.trim() || toneLoading} className="rounded-xl">
            {toneLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
            Check tone
          </Button>

          <AnimatePresence>
            {toneResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current tone</p>
                  <p className="text-sm">{toneResult.current_tone_rating}</p>
                </div>
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-2">
                  <p className="text-xs font-medium text-primary uppercase tracking-wide">Suggested version</p>
                  <p className="text-sm leading-relaxed">{toneResult.improved_version}</p>
                  <Button size="sm" variant="outline" onClick={() => speak(toneResult.improved_version)} className="rounded-xl mt-1">
                    <Volume2 className="h-3.5 w-3.5 mr-1.5" /> Read aloud
                  </Button>
                </div>
                <div className="rounded-xl bg-card border border-border p-4 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">What changed</p>
                  <p className="text-sm text-muted-foreground">{toneResult.what_changed}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Script Library Tab */}
      {activeTab === "scripts" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Choose a situation and get real, adaptable scripts — not rules. Use them as-is, remix them, or ignore them.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SCRIPT_SITUATIONS.map((s) => (
              <button
                key={s}
                onClick={() => getScript(s)}
                className={cn(
                  "p-3 rounded-xl border text-sm font-medium text-left transition-all",
                  selectedSituation === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {scriptLoading && (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Writing your scripts...</p>
            </div>
          )}

          <AnimatePresence>
            {scriptResult && !scriptLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {scriptResult.scripts?.map((script, i) => (
                  <div key={i} className="rounded-xl bg-card border border-border p-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{script.label}</p>
                    <p className="text-sm leading-relaxed">{script.text}</p>
                    <Button size="sm" variant="outline" onClick={() => speak(script.text)} className="rounded-xl">
                      <Volume2 className="h-3.5 w-3.5 mr-1.5" /> Read aloud
                    </Button>
                  </div>
                ))}
                {scriptResult.off_script_tip && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <p className="text-xs font-medium text-amber-700 mb-1">If it goes off-script</p>
                    <p className="text-sm text-amber-800">{scriptResult.off_script_tip}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}