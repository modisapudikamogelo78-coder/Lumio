const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";
import { ArrowLeft, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import VisualResult from "./VisualResult";

export default function TextInput({ onBack }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const processText = async () => {
    if (!text.trim()) return;
    setLoading(true);

    const analysis = await db.integrations.Core.InvokeLLM({
      prompt: `You are helping a person with dyslexia understand text through visuals.

Here is the text they need to understand:
"${text}"

Please provide:
1. A simplified version of the text (easier to read, shorter sentences, friendly tone)
2. Break the text into 2-4 key scenes that can be visualized
3. For each scene, provide a detailed image generation prompt (describe characters, setting, action, style)

Return as JSON.`,
      response_json_schema: {
        type: "object",
        properties: {
          simplified_text: { type: "string" },
          scenes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                image_prompt: { type: "string" },
              },
            },
          },
        },
      },
    });

    // Generate images sequentially to avoid overload
    const images = [];
    for (const scene of (analysis.scenes || [])) {
      const img = await db.integrations.Core.GenerateImage({
        prompt: `${scene.image_prompt}. Style: Colorful, friendly, educational illustration, clear and simple composition, suitable for children and young learners. No text in the image.`,
      });
      images.push(img);
    }

    const resultData = {
      original_text: text,
      simplified_text: analysis.simplified_text,
      scenes: (analysis.scenes || []).map((scene, i) => ({
        ...scene,
        image_url: images[i]?.url || null,
      })),
    };

    await db.entities.LearningSession.create({
      module: "dyslexia",
      session_type: "text_visual",
      original_text: text,
      simplified_text: analysis.simplified_text,
      generated_images: images.map((img) => img?.url).filter(Boolean),
      image_descriptions: (analysis.scenes || []).map((s) => s.description),
      completed: true,
    });

    setResult(resultData);
    setLoading(false);
  };

  if (result) return <VisualResult result={result} onBack={onBack} />;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h2 className="text-2xl font-bold mb-2">Paste Your Text</h2>
        <p className="text-muted-foreground text-sm">
          Paste a story, homework passage, or any text. We'll turn it into pictures and read it aloud.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-medium">Creating your visuals...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Analyzing text and generating images
            </p>
          </div>
        </div>
      ) : (
        <>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here... For example: 'Once upon a time, a tortoise and a hare decided to have a race...'"
            className="min-h-[200px] rounded-xl text-base leading-relaxed resize-none"
          />
          <Button
            onClick={processText}
            size="lg"
            disabled={!text.trim()}
            className="w-full rounded-xl"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Generate Visuals
          </Button>
        </>
      )}
    </div>
  );
}