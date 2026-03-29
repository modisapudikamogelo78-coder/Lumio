const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";
import { ArrowLeft, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import FeedbackPanel from "../../components/dyscalculia/FeedbackPanel";

const contexts = [
  { value: "cooking", label: "Cooking", emoji: "🍳", desc: "Recipes, measuring, timing" },
  { value: "shopping", label: "Shopping", emoji: "🛒", desc: "Prices, discounts, totals" },
  { value: "gaming", label: "Gaming", emoji: "🎮", desc: "Scores, stats, strategy" },
  { value: "budgeting", label: "Budgeting", emoji: "💰", desc: "Savings, spending, planning" },
  { value: "sports", label: "Sports", emoji: "⚽", desc: "Stats, scores, distances" },
];

export default function RealWorld() {
  const [selectedContext, setSelectedContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);

  const generateScenario = async (ctx) => {
    setSelectedContext(ctx);
    setLoading(true);
    setFeedback(null);
    setUserAnswer("");

    const result = await db.integrations.Core.InvokeLLM({
      prompt: `Create a real-world math problem for someone with dyscalculia in the context of "${ctx}".

Rules:
- Make it practical and relatable
- Use simple numbers (suitable for early-intermediate math)
- Include a vivid scenario description
- The question should have a single numerical answer
- Include step-by-step hints (3 steps, each progressively more helpful)

Return as JSON.`,
      response_json_schema: {
        type: "object",
        properties: {
          scenario_title: { type: "string" },
          scenario_description: { type: "string" },
          question: { type: "string" },
          correct_answer: { type: "number" },
          unit: { type: "string" },
          hints: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    });

    setScenario(result);
    setLoading(false);
  };

  const checkAnswer = async () => {
    const correct = parseFloat(userAnswer) === scenario.correct_answer;
    if (correct) {
      setFeedback({ correct: true, message: "Perfect! You solved the real-world problem! 🎉" });
    } else {
      const analysis = await db.integrations.Core.InvokeLLM({
        prompt: `A student with dyscalculia was solving a real-world ${selectedContext} math problem.
Scenario: ${scenario.scenario_description}
Question: ${scenario.question}
Their answer: ${userAnswer} ${scenario.unit}
Correct answer: ${scenario.correct_answer} ${scenario.unit}

Give supportive, growth-mindset feedback. Explain the mistake gently, provide the step-by-step solution, and an alternative approach.`,
        response_json_schema: {
          type: "object",
          properties: {
            what_happened: { type: "string" },
            step_by_step: { type: "string" },
            alternative_strategy: { type: "string" },
            encouragement: { type: "string" },
          },
        },
      });
      setFeedback({ correct: false, analysis });
    }
  };

  const speakScenario = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(`${scenario.scenario_description}. ${scenario.question}`);
    utterance.rate = 0.8;
    synth.speak(utterance);
  };

  const [revealedHints, setRevealedHints] = useState(0);

  if (!selectedContext) {
    return (
      <div className="space-y-6">
        <Link
          to="/dyscalculia"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <h2 className="text-2xl font-bold mb-2">Real-World Math</h2>
          <p className="text-muted-foreground text-sm">Pick a topic you enjoy — we'll create math problems around it!</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {contexts.map((c) => (
            <button
              key={c.value}
              onClick={() => generateScenario(c.value)}
              className="rounded-2xl bg-card border border-border p-6 text-center hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all"
            >
              <div className="text-3xl mb-3">{c.emoji}</div>
              <p className="font-medium">{c.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => { setSelectedContext(null); setScenario(null); setFeedback(null); setRevealedHints(0); }}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Choose context
      </button>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="font-medium">Creating your scenario...</p>
        </div>
      ) : scenario ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{scenario.scenario_title}</h3>
              <button onClick={speakScenario} className="p-2 rounded-lg hover:bg-muted">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-muted-foreground leading-relaxed">{scenario.scenario_description}</p>
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <p className="font-semibold text-lg">{scenario.question}</p>
            </div>

            {/* Answer */}
            <div className="flex gap-3">
              <input
                type="number"
                step="any"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && userAnswer && checkAnswer()}
                placeholder={`Answer in ${scenario.unit || "number"}...`}
                className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={feedback !== null}
              />
              {!feedback ? (
                <Button onClick={checkAnswer} disabled={!userAnswer} size="lg" className="rounded-xl">
                  Check
                </Button>
              ) : (
                <Button onClick={() => generateScenario(selectedContext)} size="lg" className="rounded-xl">
                  Next
                </Button>
              )}
            </div>

            {/* Hints */}
            {!feedback && scenario.hints && (
              <div className="space-y-2">
                {scenario.hints.slice(0, revealedHints).map((hint, i) => (
                  <div key={i} className="text-sm bg-muted/50 rounded-lg p-3 text-muted-foreground">
                    💡 Hint {i + 1}: {hint}
                  </div>
                ))}
                {revealedHints < scenario.hints.length && (
                  <button
                    onClick={() => setRevealedHints((h) => h + 1)}
                    className="text-sm text-primary hover:underline"
                  >
                    Show hint {revealedHints + 1}
                  </button>
                )}
              </div>
            )}

            {feedback && <FeedbackPanel feedback={feedback} />}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}