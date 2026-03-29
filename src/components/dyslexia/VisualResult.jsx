import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Volume2, VolumeX, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const INTERVENTIONS = [
  "This part is tricky — let's try it a different way.",
  "No rush at all. Let me break this down into smaller pieces.",
  "I've got you. Let's take this one small step at a time.",
  "You're doing great. Let me make this a little easier to follow.",
];

export default function VisualResult({ result, onBack }) {
  const [currentScene, setCurrentScene] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [readingMode, setReadingMode] = useState("simplified");
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [rulerLine, setRulerLine] = useState(-1);
  const [ttsRate, setTtsRate] = useState(0.85);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [chunkMode, setChunkMode] = useState(false);
  const [interventionMsg, setInterventionMsg] = useState(null);

  const synthRef = useRef(window.speechSynthesis);
  const wordRefs = useRef([]);
  const textContainerRef = useRef(null);
  const replayCountRef = useRef({});
  const inactivityTimerRef = useRef(null);
  const struggleLevelRef = useRef(0);
  const interventionIndexRef = useRef(0);

  useEffect(() => {
    return () => { synthRef.current.cancel(); clearTimeout(inactivityTimerRef.current); };
  }, []);

  const resetInactivity = () => {
    clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      triggerIntervention("inactivity");
    }, 28000);
  };

  useEffect(() => {
    resetInactivity();
    return () => clearTimeout(inactivityTimerRef.current);
  }, [currentScene, readingMode]);

  // Update ruler line position based on active word
  useEffect(() => {
    if (activeWordIndex < 0 || !wordRefs.current[activeWordIndex] || !textContainerRef.current) {
      setRulerLine(-1);
      return;
    }
    const wordEl = wordRefs.current[activeWordIndex];
    const containerEl = textContainerRef.current;
    const wordRect = wordEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();
    setRulerLine(wordRect.top - containerRect.top + containerEl.scrollTop);
  }, [activeWordIndex]);

  const getChunks = () => {
    const text = readingMode === "simplified" ? result.simplified_text : result.original_text;
    return text.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()).filter(Boolean) || [text];
  };

  const speakText = (text, withHighlight = false) => {
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = ttsRate;
    utterance.pitch = 1.05;
    if (withHighlight) {
      const words = text.split(/\s+/);
      utterance.onboundary = (e) => {
        if (e.name === "word") {
          let charCount = 0;
          let idx = 0;
          for (let i = 0; i < words.length; i++) {
            if (charCount >= e.charIndex) { idx = i; break; }
            charCount += words[i].length + 1;
            idx = i;
          }
          setActiveWordIndex(idx);
        }
      };
    }
    utterance.onend = () => { setSpeaking(false); setActiveWordIndex(-1); setRulerLine(-1); resetInactivity(); };
    utterance.onerror = () => { setSpeaking(false); setActiveWordIndex(-1); setRulerLine(-1); };
    setSpeaking(true);
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    synthRef.current.cancel();
    setSpeaking(false);
    setActiveWordIndex(-1);
    setRulerLine(-1);
  };

  const triggerIntervention = (reason) => {
    if (synthRef.current.speaking) return;
    const msg = INTERVENTIONS[interventionIndexRef.current % INTERVENTIONS.length];
    interventionIndexRef.current++;
    struggleLevelRef.current = Math.min(struggleLevelRef.current + 1, 3);
    setTtsRate((r) => Math.max(r - 0.08, 0.65));
    setChunkMode(true);
    setChunkIndex(0);
    setInterventionMsg(msg);

    const utterance = new SpeechSynthesisUtterance(msg);
    utterance.rate = 0.82;
    utterance.pitch = 1.05;
    utterance.onend = () => {
      const text = getChunks()[0];
      if (text) speakText(text, true);
    };
    synthRef.current.cancel();
    setSpeaking(true);
    synthRef.current.speak(utterance);
  };

  const scene = result.scenes[currentScene];

  const readAloud = () => {
    resetInactivity();
    if (speaking) { stopSpeaking(); return; }

    const key = `${currentScene}-${readingMode}`;
    replayCountRef.current[key] = (replayCountRef.current[key] || 0) + 1;

    if (replayCountRef.current[key] > 2) {
      triggerIntervention("replay");
      return;
    }

    if (chunkMode) {
      const chunks = getChunks();
      speakText(chunks[chunkIndex] || chunks[0], true);
    } else {
      const textToRead = readingMode === "simplified" ? result.simplified_text : result.original_text;
      speakText(textToRead, true);
    }
  };

  const readSceneDescription = () => {
    resetInactivity();
    if (speaking) { stopSpeaking(); return; }
    speakText(`Scene ${currentScene + 1}: ${scene.title}. ${scene.description}`);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => { stopSpeaking(); onBack(); }}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Scene Viewer */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {scene?.image_url ? (
              <motion.img
                key={scene.image_url}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                src={scene.image_url}
                alt={scene.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-muted-foreground text-sm">Image loading...</div>
            )}
          </AnimatePresence>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                disabled={currentScene === 0}
                onClick={() => setCurrentScene((s) => s - 1)}
                className="text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="text-center text-white">
                <p className="font-semibold text-lg">{scene?.title}</p>
                <p className="text-white/70 text-sm">Scene {currentScene + 1} of {result.scenes.length}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={currentScene === result.scenes.length - 1}
                onClick={() => setCurrentScene((s) => s + 1)}
                className="text-white hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{scene?.description}</p>
          <Button variant="outline" size="sm" onClick={readSceneDescription} className="rounded-xl">
            {speaking ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
            {speaking ? "Stop" : "Read scene aloud"}
          </Button>
        </div>
      </div>

      {/* Scene dots */}
      <div className="flex justify-center gap-2">
        {result.scenes.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentScene(i)}
            className={cn(
              "h-2.5 rounded-full transition-all duration-300",
              i === currentScene ? "w-8 bg-primary" : "w-2.5 bg-muted-foreground/30"
            )}
          />
        ))}
      </div>

      {/* Text Section */}
      <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Text</h3>
          <div className="flex items-center gap-2">
            {["simplified", "original"].map((mode) => (
              <button
                key={mode}
                onClick={() => setReadingMode(mode)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full transition-colors capitalize",
                  readingMode === mode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Text with word highlighting + reading ruler */}
        <div ref={textContainerRef} className="relative">
          {rulerLine >= 0 && (
            <div
              className="absolute left-0 right-0 h-7 bg-amber-200/40 rounded pointer-events-none transition-all duration-150"
              style={{ top: rulerLine - 4 }}
            />
          )}
          <p className="text-base leading-loose tracking-wide relative">
            {(readingMode === "simplified" ? result.simplified_text : result.original_text)
              .split(/\s+/)
              .map((word, i) => (
                <span
                  key={i}
                  ref={(el) => (wordRefs.current[i] = el)}
                  className={cn(
                    "transition-colors duration-100",
                    activeWordIndex === i ? "bg-primary text-primary-foreground rounded px-0.5" : ""
                  )}
                >
                  {word}{" "}
                </span>
              ))}
          </p>
        </div>

        {/* Intervention message */}
        {interventionMsg && (
          <div className="rounded-xl bg-violet-50 border border-violet-200 px-4 py-3 text-sm text-violet-700 font-medium flex items-center gap-2">
            <span>💜</span> {interventionMsg}
          </div>
        )}

        {/* Chunk navigation */}
        {chunkMode && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Reading one piece at a time:</p>
            <div className="flex flex-wrap gap-2">
              {getChunks().map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setChunkIndex(i); resetInactivity(); speakText(getChunks()[i], true); }}
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-300",
                    i === chunkIndex ? "w-8 bg-primary" : "w-2.5 bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            {chunkIndex < getChunks().length - 1 ? (
              <button
                onClick={() => {
                  const next = chunkIndex + 1;
                  setChunkIndex(next);
                  resetInactivity();
                  speakText(getChunks()[next], true);
                }}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Next piece
              </button>
            ) : (
              <p className="text-sm text-green-600 font-medium">🎉 You made it through! That was brilliant.</p>
            )}
          </div>
        )}

        <Button onClick={readAloud} className="rounded-xl">
          {speaking ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
          {speaking ? "Stop reading" : "Read aloud"}
        </Button>
      </div>
    </div>
  );
}