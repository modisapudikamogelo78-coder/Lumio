import { useState } from "react";
import { Camera, FileText, Mic, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import ImageUploader from "../../components/dyslexia/ImageUploader";
import TextInput from "../../components/dyslexia/TextInput";
import VoiceWriter from "../../components/dyslexia/VoiceWriter";

export default function DyslexiaHome() {
  const [mode, setMode] = useState(null); // 'upload' | 'text' | 'voice'

  if (mode === "upload") return <ImageUploader onBack={() => setMode(null)} />;
  if (mode === "text") return <TextInput onBack={() => setMode(null)} />;
  if (mode === "voice") return <VoiceWriter onBack={() => setMode(null)} />;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dyslexia Support</h1>
        <p className="text-muted-foreground max-w-lg leading-relaxed">
          Transform text into vivid visuals and audio. Upload a photo of your homework
          or paste text directly — we'll bring it to life.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => setMode("upload")}
          className="group relative overflow-hidden rounded-2xl bg-card border border-border p-8 text-left transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
        >
          <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 mb-5">
            <Camera className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Upload a Photo</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Take a picture of your homework, textbook page, or any written text.
            We'll extract the words and create visuals.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
            Get started <ArrowRight className="h-4 w-4" />
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => setMode("text")}
          className="group relative overflow-hidden rounded-2xl bg-card border border-border p-8 text-left transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
        >
          <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-5">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Paste Text</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Paste any text directly — a story, assignment, or reading passage.
            We'll visualize it and read it aloud for you.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
            Get started <ArrowRight className="h-4 w-4" />
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => setMode("voice")}
          className="group relative overflow-hidden rounded-2xl bg-card border border-border p-8 text-left transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 md:col-span-2"
        >
          <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 mb-5">
            <Mic className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Voice Writer</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Speak your thoughts freely — we'll transcribe, clean up, and read back your writing.
            Great for assignments: say what you know, get polished written text.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
            Get started <ArrowRight className="h-4 w-4" />
          </div>
        </motion.button>
      </div>
    </div>
  );
}