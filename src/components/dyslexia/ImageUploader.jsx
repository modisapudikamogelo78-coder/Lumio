const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useRef } from "react";
import { ArrowLeft, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

import VisualResult from "./VisualResult";

export default function ImageUploader({ onBack }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("upload"); // upload | processing | result
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  };

  const processImage = async () => {
    setLoading(true);
    setStep("processing");

    // Upload the image
    const { file_url } = await db.integrations.Core.UploadFile({ file });

    // Extract text from image
    const extractedData = await db.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          extracted_text: { type: "string", description: "All text visible in the image" },
        },
      },
    });

    const text = extractedData.output?.extracted_text || "Could not extract text from this image.";

    // Get AI to analyze and create scene descriptions
    const analysis = await db.integrations.Core.InvokeLLM({
      prompt: `You are helping a person with dyslexia understand text through visuals. 
      
The following text was extracted from their homework/reading material:
"${text}"

Please provide:
1. A simplified version of the text (easier to read, shorter sentences)
2. Break the text into 2-4 key scenes that can be visualized as images
3. For each scene, provide a detailed image generation prompt (describe characters, setting, action, style - make it colorful, friendly, and educational)

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

    // Generate images for each scene sequentially to avoid overload
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

    // Save session
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
    setStep("result");
    setLoading(false);
  };

  if (step === "result" && result) {
    return <VisualResult result={result} onBack={onBack} />;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h2 className="text-2xl font-bold mb-2">Upload a Photo</h2>
        <p className="text-muted-foreground text-sm">
          Take a photo of your homework or text. We'll extract the words and create visual scenes.
        </p>
      </div>

      {step === "processing" ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-medium">Creating your visuals...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Extracting text, analyzing content, and generating images
            </p>
          </div>
        </div>
      ) : (
        <>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-64 rounded-xl object-contain" />
            ) : (
              <>
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium mb-1">Drop your image here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />

          {preview && (
            <Button onClick={processImage} size="lg" className="w-full rounded-xl">
              <ImageIcon className="h-4 w-4 mr-2" />
              Generate Visuals
            </Button>
          )}
        </>
      )}
    </div>
  );
}