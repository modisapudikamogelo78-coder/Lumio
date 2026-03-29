const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mic, MicOff, Send, Trash2, ArrowRight, Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TYPE_COLORS = {
  task: "bg-violet-100 text-violet-700 border-violet-200",
  idea: "bg-amber-100 text-amber-700 border-amber-200",
  worry: "bg-red-100 text-red-700 border-red-200",
  reminder: "bg-blue-100 text-blue-700 border-blue-200",
  thought: "bg-muted text-muted-foreground border-border",
};

export default function Capture() {
  const [input, setInput] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    db.entities.ADHDCapture.filter({ processed: false }).then(setItems);
  }, []);

  const capture = async (text) => {
    if (!text.trim()) return;
    const item = await db.entities.ADHDCapture.create({ content: text, type: "thought", processed: false });
    setItems((prev) => [item, ...prev]);
    setInput("");
    setProcessingId(item.id);
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `Classify this quick capture from someone with ADHD: "${text}"\nType options: task, idea, worry, reminder, thought\nReturn only the type word.`,
    });
    const type = ["task", "idea", "worry", "reminder", "thought"].find((t) => result.toLowerCase().includes(t)) || "thought";
    await db.entities.ADHDCapture.update(item.id, { type });
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, type } : i));
    setProcessingId(null);
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("Voice not supported in this browser.");
    const r = new SR();
    r.continuous = false; r.interimResults = false;
    r.onresult = (e) => capture(e.results[0][0].transcript);
    r.onend = () => setIsRecording(false);
    recognitionRef.current = r;
    r.start();
    setIsRecording(true);
  };

  const convertToTask = async (item) => {
    await db.entities.ADHDTask.create({ title: item.content, bucket: "later", completed: false });
    await db.entities.ADHDCapture.update(item.id, { processed: true, converted_to_task: true });
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const dismiss = async (item) => {
    await db.entities.ADHDCapture.update(item.id, { processed: true });
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const processAll = async () => {
    if (items.length === 0) return;
    setLoading(true);
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `Help someone with ADHD process their thought inbox:\n${items.map((i, n) => `${n + 1}. [${i.type}] ${i.content}`).join("\n")}\n\nFor each: "task" (make it a task), "keep" (remember but not task), or "discard" (clear it).`,
      response_json_schema: {
        type: "object",
        properties: { decisions: { type: "array", items: { type: "object", properties: { index: { type: "number" }, action: { type: "string" } } } } },
      },
    });
    for (const d of result.decisions || []) {
      const item = items[d.index - 1];
      if (!item) continue;
      if (d.action === "task") await convertToTask(item);
      else if (d.action === "discard") await dismiss(item);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <Link to="/adhd" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div>
        <h2 className="text-2xl font-bold mb-1">Quick Capture</h2>
        <p className="text-muted-foreground text-sm">Dump it here. No organizing. The AI sorts it later.</p>
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && capture(input)}
          placeholder="What's in your head right now?"
          className="flex-1 px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary" autoFocus />
        <button onClick={() => isRecording ? recognitionRef.current?.stop() : startVoice()}
          className={cn("p-3 rounded-xl border-2 transition-all", isRecording ? "border-red-500 bg-red-50 text-red-500 animate-pulse" : "border-border hover:border-primary")}>
          {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <Button onClick={() => capture(input)} disabled={!input.trim()} className="rounded-xl px-5">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium flex items-center gap-2">
              <Inbox className="h-4 w-4" /> {items.length} item{items.length !== 1 ? "s" : ""} in inbox
            </p>
            <Button onClick={processAll} disabled={loading} size="sm" variant="outline" className="rounded-xl">
              {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null} AI process all
            </Button>
          </div>
          <AnimatePresence>
            {items.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="rounded-xl bg-card border border-border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className={cn("text-xs font-medium px-2 py-0.5 rounded-full border shrink-0", TYPE_COLORS[item.type] || TYPE_COLORS.thought)}>
                    {processingId === item.id ? "..." : item.type}
                  </div>
                  <p className="text-sm flex-1">{item.content}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => convertToTask(item)} className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors">
                    <ArrowRight className="h-3.5 w-3.5" /> Make task
                  </button>
                  <button onClick={() => dismiss(item)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" /> Clear
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {items.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Inbox is clear. Nice.</p>
        </div>
      )}
    </div>
  );
}