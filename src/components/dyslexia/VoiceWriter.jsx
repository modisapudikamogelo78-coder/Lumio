const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Mic, MicOff, Volume2, VolumeX, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function VoiceWriter({ onBack }) {
  const [isRecording, setIsRecording] = useState(false);
  const [rawTranscript, setRawTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [cleanedText, setCleanedText] = useState(null);
  const [spellingFlags, setSpellingFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editableText, setEditableText] = useState("");
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      synthRef.current.cancel();
    };
  }, []);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support voice input. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalText = rawTranscript;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + " ";
          setRawTranscript(finalText);
          setInterimTranscript("");
        } else {
          interim += transcript;
          setInterimTranscript(interim);
        }
      }
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const processTranscript = async () => {
    if (!rawTranscript.trim()) return;
    setLoading(true);

    const result = await db.integrations.Core.InvokeLLM({
      prompt: `You are helping a student with dyslexia. They spoke their answer aloud and this was transcribed:

"${rawTranscript}"

Please:
1. Clean up the transcription — fix grammar, punctuation, and sentence structure
2. PRESERVE their voice, personality, and ideas — don't make it sound robotic or over-formal
3. Identify any words that might be spelled uncertainly in the cleaned version (common dyslexia misspelling targets: double letters, silent letters, irregular spellings)
4. Keep the cleaned text close to what they said — this is about reducing cognitive load, not rewriting their work

Return as JSON.`,
      response_json_schema: {
        type: "object",
        properties: {
          cleaned_text: { type: "string" },
          uncertain_words: {
            type: "array",
            items: { type: "string" },
            description: "Words in the cleaned text that are commonly misspelled or tricky",
          },
          encouragement: { type: "string" },
        },
      },
    });

    setCleanedText(result.cleaned_text);
    setEditableText(result.cleaned_text);
    setSpellingFlags(result.uncertain_words || []);
    setLoading(false);
  };

  const readAloud = () => {
    if (speaking) {
      synthRef.current.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(editableText);
    utterance.rate = 0.85;
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    synthRef.current.speak(utterance);
  };

  const copyText = () => {
    navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setRawTranscript("");
    setInterimTranscript("");
    setCleanedText(null);
    setEditableText("");
    setSpellingFlags([]);
    setSpeaking(false);
    synthRef.current.cancel();
  };

  // Render cleaned text with gentle spelling highlights
  const renderHighlightedText = () => {
    if (!cleanedText) return null;
    const words = editableText.split(/(\s+)/);
    return words.map((word, i) => {
      const clean = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
      const isUncertain = spellingFlags.some((f) => f.toLowerCase() === clean);
      return (
        <span
          key={i}
          className={cn(
            isUncertain && "underline decoration-amber-400 decoration-dotted underline-offset-4 cursor-help"
          )}
          title={isUncertain ? "Double-check this spelling" : undefined}
        >
          {word}
        </span>
      );
    });
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h2 className="text-2xl font-bold mb-2">Voice Writer</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
          Speak your thoughts freely. We'll turn your words into polished written text — keeping your voice and ideas intact.
        </p>
      </div>

      {/* Recording area */}
      <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm">Your spoken words</p>
          {rawTranscript && (
            <button onClick={reset} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
              Clear
            </button>
          )}
        </div>

        <div className="min-h-[100px] rounded-xl bg-muted/40 p-4 text-sm leading-relaxed">
          {rawTranscript || interimTranscript ? (
            <span>
              {rawTranscript}
              {interimTranscript && (
                <span className="text-muted-foreground italic">{interimTranscript}</span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {isRecording ? "Listening... speak now" : "Press the mic button to start speaking"}
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all",
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "bg-primary text-primary-foreground hover:opacity-90"
            )}
          >
            {isRecording ? (
              <><MicOff className="h-4 w-4" /> Stop</>
            ) : (
              <><Mic className="h-4 w-4" /> {rawTranscript ? "Continue" : "Start talking"}</>
            )}
          </button>

          {rawTranscript && !isRecording && !cleanedText && (
            <Button onClick={processTranscript} variant="outline" className="rounded-xl">
              Clean it up ✨
            </Button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Polishing your writing...</p>
        </div>
      )}

      {/* Cleaned result */}
      <AnimatePresence>
        {cleanedText && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card border border-border p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">Your written response</p>
              <div className="flex gap-2">
                <button onClick={readAloud} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Read aloud">
                  {speaking ? <VolumeX className="h-4 w-4 text-primary" /> : <Volume2 className="h-4 w-4 text-muted-foreground" />}
                </button>
                <button onClick={copyText} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Copy text">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
            </div>

            {/* Editable with highlights */}
            <div className="relative">
              <div className="text-sm leading-loose tracking-wide pointer-events-none absolute inset-0 p-3 rounded-xl whitespace-pre-wrap break-words">
                {renderHighlightedText()}
              </div>
              <textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                className="w-full min-h-[140px] p-3 rounded-xl border border-border bg-transparent text-sm leading-loose tracking-wide resize-none focus:outline-none focus:ring-2 focus:ring-primary relative z-10 caret-foreground"
                style={{ color: "transparent", caretColor: "hsl(var(--foreground))" }}
              />
            </div>

            {spellingFlags.length > 0 && (
              <p className="text-xs text-muted-foreground">
                <span className="underline decoration-amber-400 decoration-dotted underline-offset-2">Dotted underlines</span> are words worth double-checking — no pressure!
              </p>
            )}

            <div className="flex gap-3">
              <Button onClick={readAloud} variant="outline" size="sm" className="rounded-xl">
                {speaking ? <><VolumeX className="h-3.5 w-3.5 mr-1.5" /> Stop</> : <><Volume2 className="h-3.5 w-3.5 mr-1.5" /> Read back to me</>}
              </Button>
              <Button onClick={copyText} variant="outline" size="sm" className="rounded-xl">
                {copied ? <><Check className="h-3.5 w-3.5 mr-1.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy to submit</>}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}