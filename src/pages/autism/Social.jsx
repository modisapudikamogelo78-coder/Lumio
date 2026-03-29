const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, BookOpen, HelpCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "decode", label: "Decode NT Culture" },
  { id: "events", label: "Event Prep" },
  { id: "boundaries", label: "Boundary Scripts" },
];

const NT_PHRASES = [
  "How are you?",
  "We should catch up sometime",
  "You're too sensitive",
  "I was just joking",
  "That's not how it works here",
  "You need to read the room",
  "Don't take it personally",
  "Just be yourself",
  "You'll figure it out",
  "That's not a big deal",
];

const BOUNDARY_SCENARIOS = [
  "Declining a social invitation",
  "Telling someone not to hug me",
  "Asking for more notice before plans change",
  "Saying I need to leave early",
  "Telling someone I prefer texting over calling",
  "Explaining I need quiet to think",
  "Saying I can't handle loud environments",
  "Asking not to be interrupted",
];

function speak(text) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.88;
  window.speechSynthesis.speak(u);
}

export default function Social() {
  const [activeTab, setActiveTab] = useState("decode");
  // Decode
  const [selectedPhrase, setSelectedPhrase] = useState(null);
  const [customPhrase, setCustomPhrase] = useState("");
  const [decodeResult, setDecodeResult] = useState(null);
  const [decodeLoading, setDecodeLoading] = useState(false);
  // Event prep
  const [eventInput, setEventInput] = useState("");
  const [eventResult, setEventResult] = useState(null);
  const [eventLoading, setEventLoading] = useState(false);
  // Boundaries
  const [selectedBoundary, setSelectedBoundary] = useState(null);
  const [boundaryResult, setBoundaryResult] = useState(null);
  const [boundaryLoading, setBoundaryLoading] = useState(false);

  const decode = async (phrase) => {
    const p = phrase || customPhrase;
    if (!p.trim()) return;
    setSelectedPhrase(p);
    setDecodeLoading(true);
    setDecodeResult(null);
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `An autistic person wants to understand this common neurotypical phrase or social situation:

"${p}"

Please explain:
1. What this typically means (the "surface" meaning people intend)
2. What people usually actually expect in response
3. Why neurotypicals say/do this (the social function it serves)
4. If there are multiple possible meanings depending on context, list them
5. Optional response options if the autistic person wants to respond

Be honest and factual — not apologetic for NT culture, not critical of autism. Just clear information.
Avoid telling the autistic person how they "should" respond — give them options and let them choose.`,
      response_json_schema: {
        type: "object",
        properties: {
          surface_meaning: { type: "string" },
          what_they_expect: { type: "string" },
          social_function: { type: "string" },
          possible_meanings: { type: "array", items: { type: "string" } },
          response_options: { type: "array", items: { type: "string" } },
        },
      },
    });
    setDecodeResult(result);
    setDecodeLoading(false);
  };

  const prepEvent = async () => {
    if (!eventInput.trim()) return;
    setEventLoading(true);
    setEventResult(null);
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `An autistic person is preparing for this upcoming event or situation:

"${eventInput}"

Create a practical preparation guide that includes:
1. What to expect (environment, social expectations, timing)
2. What to bring or prepare in advance
3. How to handle common unexpected things that might happen
4. Exit strategy: how to leave if overwhelmed (without drama)
5. Recovery plan: what to do after to restore energy
6. Optional scripts for 2-3 likely interactions

Do NOT tell them to "just relax" or "have fun". Be practical and give them real information.`,
      response_json_schema: {
        type: "object",
        properties: {
          what_to_expect: { type: "string" },
          prepare_in_advance: { type: "array", items: { type: "string" } },
          if_unexpected: { type: "string" },
          exit_strategy: { type: "string" },
          recovery_plan: { type: "string" },
          scripts: { type: "array", items: { type: "object", properties: { situation: { type: "string" }, script: { type: "string" } } } },
        },
      },
    });
    setEventResult(result);
    setEventLoading(false);
  };

  const getBoundaryScript = async (scenario) => {
    setSelectedBoundary(scenario);
    setBoundaryLoading(true);
    setBoundaryResult(null);
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `An autistic person needs help setting this boundary: "${scenario}"

Write 3 versions of how they could communicate this boundary:
1. Very direct (short, clear, no explanation)
2. Polite but firm (warm tone, still clear)
3. With brief explanation (for people who need to understand why)

Also:
- A response to use if someone pushes back
- A reminder that they do NOT owe anyone an explanation

Keep these natural — not robotic. They should sound like a real person saying it.`,
      response_json_schema: {
        type: "object",
        properties: {
          direct: { type: "string" },
          polite_firm: { type: "string" },
          with_explanation: { type: "string" },
          pushback_response: { type: "string" },
          reminder: { type: "string" },
        },
      },
    });
    setBoundaryResult(result);
    setBoundaryLoading(false);
  };

  return (
    <div className="space-y-6">
      <Link to="/autism" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div>
        <h2 className="text-2xl font-bold mb-1">Social Navigation</h2>
        <p className="text-muted-foreground text-sm max-w-xl">
          Tools for understanding and navigating social situations — not to change who you are, but to give you information and options.
        </p>
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

      {/* Decode NT Culture */}
      {activeTab === "decode" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <p className="text-sm text-muted-foreground">Pick a phrase to decode, or type your own.</p>
          <div className="flex flex-wrap gap-2">
            {NT_PHRASES.map((p) => (
              <button
                key={p}
                onClick={() => decode(p)}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm border transition-all",
                  selectedPhrase === p ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"
                )}
              >
                "{p}"
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customPhrase}
              onChange={(e) => setCustomPhrase(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && decode()}
              placeholder="Or type any phrase, situation, or behaviour to decode..."
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={() => decode()} disabled={!customPhrase.trim() || decodeLoading} className="rounded-xl">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>

          {decodeLoading && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Decoding...</p>
            </div>
          )}

          <AnimatePresence>
            {decodeResult && !decodeLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="rounded-xl bg-card border border-border p-4 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">What it typically means</p>
                  <p className="text-sm">{decodeResult.surface_meaning}</p>
                </div>
                <div className="rounded-xl bg-card border border-border p-4 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">What they usually expect in response</p>
                  <p className="text-sm">{decodeResult.what_they_expect}</p>
                </div>
                <div className="rounded-xl bg-card border border-border p-4 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Why people say/do this</p>
                  <p className="text-sm">{decodeResult.social_function}</p>
                </div>
                {decodeResult.possible_meanings?.length > 0 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2">
                    <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Could also mean</p>
                    {decodeResult.possible_meanings.map((m, i) => (
                      <p key={i} className="text-sm text-amber-900 flex gap-2"><span>•</span>{m}</p>
                    ))}
                  </div>
                )}
                {decodeResult.response_options?.length > 0 && (
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-2">
                    <p className="text-xs font-medium text-primary uppercase tracking-wide">If you want to respond</p>
                    {decodeResult.response_options.map((r, i) => (
                      <button key={i} onClick={() => speak(r)} className="block w-full text-left text-sm p-2 rounded-lg hover:bg-primary/10 transition-colors">
                        "{r}"
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Event Prep */}
      {activeTab === "events" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <p className="text-sm text-muted-foreground">Tell us about an upcoming event or situation and we'll help you prepare.</p>
          <textarea
            value={eventInput}
            onChange={(e) => setEventInput(e.target.value)}
            placeholder="e.g. First day at a new job, family dinner, doctor's appointment, going to a concert..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={4}
          />
          <Button onClick={prepEvent} disabled={!eventInput.trim() || eventLoading} className="rounded-xl">
            {eventLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BookOpen className="h-4 w-4 mr-2" />}
            Prepare me
          </Button>

          <AnimatePresence>
            {eventResult && !eventLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="rounded-xl bg-card border border-border p-4 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">What to expect</p>
                  <p className="text-sm leading-relaxed">{eventResult.what_to_expect}</p>
                </div>
                {eventResult.prepare_in_advance?.length > 0 && (
                  <div className="rounded-xl bg-card border border-border p-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Prepare in advance</p>
                    {eventResult.prepare_in_advance.map((item, i) => (
                      <p key={i} className="text-sm flex gap-2"><span className="text-primary">•</span>{item}</p>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-1">
                    <p className="text-xs font-medium text-red-700">Exit strategy</p>
                    <p className="text-sm text-red-900">{eventResult.exit_strategy}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-1">
                    <p className="text-xs font-medium text-emerald-700">Recovery plan</p>
                    <p className="text-sm text-emerald-900">{eventResult.recovery_plan}</p>
                  </div>
                </div>
                {eventResult.scripts?.length > 0 && (
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3">
                    <p className="text-xs font-medium text-primary uppercase">Helpful scripts</p>
                    {eventResult.scripts.map((s, i) => (
                      <div key={i} className="space-y-1">
                        <p className="text-xs text-muted-foreground">{s.situation}</p>
                        <button onClick={() => speak(s.script)} className="text-sm text-left hover:text-primary transition-colors">
                          "{s.script}"
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Boundary Scripts */}
      {activeTab === "boundaries" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Setting boundaries is a skill, and scripts make it easier. You do NOT owe anyone an explanation.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BOUNDARY_SCENARIOS.map((s) => (
              <button
                key={s}
                onClick={() => getBoundaryScript(s)}
                className={cn(
                  "p-3 rounded-xl border text-sm font-medium text-left transition-all",
                  selectedBoundary === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {boundaryLoading && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Writing your scripts...</p>
            </div>
          )}

          <AnimatePresence>
            {boundaryResult && !boundaryLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {[
                  { label: "Direct", text: boundaryResult.direct, color: "bg-card border-border" },
                  { label: "Polite & firm", text: boundaryResult.polite_firm, color: "bg-card border-border" },
                  { label: "With explanation", text: boundaryResult.with_explanation, color: "bg-card border-border" },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl border p-4 space-y-2 ${item.color}`}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm leading-relaxed">"{item.text}"</p>
                    <Button size="sm" variant="outline" onClick={() => speak(item.text)} className="rounded-xl">
                      Read aloud
                    </Button>
                  </div>
                ))}
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-1">
                  <p className="text-xs font-medium text-amber-700">If they push back</p>
                  <p className="text-sm text-amber-900">"{boundaryResult.pushback_response}"</p>
                </div>
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-primary">{boundaryResult.reminder}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}