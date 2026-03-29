const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const diagnosticQuestions = [
  {
    id: 1,
    category: "number_sense",
    question: "Which number is bigger?",
    options: ["47", "74"],
    correct: 1,
    visual: "🔢",
  },
  {
    id: 2,
    category: "number_sense",
    question: "What comes between 8 and 10?",
    options: ["7", "9", "11"],
    correct: 1,
    visual: "📊",
  },
  {
    id: 3,
    category: "addition",
    question: "What is 7 + 5?",
    options: ["11", "12", "13"],
    correct: 1,
    visual: "➕",
  },
  {
    id: 4,
    category: "subtraction",
    question: "What is 15 - 8?",
    options: ["6", "7", "8"],
    correct: 1,
    visual: "➖",
  },
  {
    id: 5,
    category: "multiplication",
    question: "What is 6 × 3?",
    options: ["15", "18", "21"],
    correct: 1,
    visual: "✖️",
  },
  {
    id: 6,
    category: "division",
    question: "What is 20 ÷ 4?",
    options: ["4", "5", "6"],
    correct: 1,
    visual: "➗",
  },
  {
    id: 7,
    category: "fractions",
    question: "Which is bigger: ½ or ¼?",
    options: ["½", "¼", "They're equal"],
    correct: 0,
    visual: "🍕",
  },
  {
    id: 8,
    category: "measurement",
    question: "How many centimeters are in 1 meter?",
    options: ["10", "100", "1000"],
    correct: 1,
    visual: "📏",
  },
  {
    id: 9,
    category: "money",
    question: "If you have $5 and spend $2.50, how much do you have left?",
    options: ["$2.00", "$2.50", "$3.50"],
    correct: 1,
    visual: "💰",
  },
  {
    id: 10,
    category: "time",
    question: "If it's 2:30, what time will it be in 45 minutes?",
    options: ["3:00", "3:15", "3:45"],
    correct: 1,
    visual: "⏰",
  },
];

export default function Diagnostic() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  const q = diagnosticQuestions[current];

  const selectAnswer = (idx) => {
    setSelected(idx);
  };

  const nextQuestion = async () => {
    const newAnswers = { ...answers, [q.id]: { category: q.category, correct: selected === q.correct } };
    setAnswers(newAnswers);
    setSelected(null);

    if (current < diagnosticQuestions.length - 1) {
      setCurrent(current + 1);
    } else {
      setSaving(true);
      setDone(true);

      // Analyze results
      const categories = {};
      Object.values(newAnswers).forEach(({ category, correct }) => {
        if (!categories[category]) categories[category] = { total: 0, correct: 0 };
        categories[category].total++;
        if (correct) categories[category].correct++;
      });

      const analysisResults = Object.entries(categories).map(([topic, data]) => ({
        topic,
        mastery: Math.round((data.correct / data.total) * 100),
        struggles: data.correct < data.total,
      }));

      // Save progress for each topic
      for (const r of analysisResults) {
        await db.entities.MathProgress.create({
          topic: r.topic,
          mastery_level: r.mastery,
          current_difficulty: r.mastery >= 80 ? 5 : r.mastery >= 50 ? 3 : 1,
          total_problems_attempted: categories[r.topic].total,
          total_correct: categories[r.topic].correct,
          struggles: r.mastery < 80 ? [`Needs practice with ${r.topic}`] : [],
        });
      }

      setResults(analysisResults);
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-6">
        <Link
          to="/dyscalculia"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        {saving ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="font-medium">Analyzing your results...</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Assessment Complete!</h2>
              <p className="text-muted-foreground">Here's what we found about your math skills.</p>
            </div>

            <div className="grid gap-3">
              {results?.map((r) => (
                <div key={r.topic} className="rounded-xl bg-card border border-border p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{r.topic.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.mastery >= 80 ? "Strong!" : r.mastery >= 50 ? "Getting there" : "Let's work on this"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          r.mastery >= 80 ? "bg-green-500" : r.mastery >= 50 ? "bg-amber-500" : "bg-red-400"
                        )}
                        style={{ width: `${r.mastery}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-10 text-right">{r.mastery}%</span>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={() => navigate("/dyscalculia/practice")} className="w-full rounded-xl" size="lg">
              Start Practicing <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/dyscalculia"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div>
        <h2 className="text-2xl font-bold mb-1">Diagnostic Assessment</h2>
        <p className="text-muted-foreground text-sm">
          Question {current + 1} of {diagnosticQuestions.length}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={false}
          animate={{ width: `${((current + 1) / diagnosticQuestions.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="rounded-2xl bg-card border border-border p-8 space-y-6"
        >
          <div className="text-center">
            <div className="text-4xl mb-4">{q.visual}</div>
            <h3 className="text-xl font-semibold">{q.question}</h3>
          </div>

          <div className="grid gap-3">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => selectAnswer(idx)}
                className={cn(
                  "p-4 rounded-xl border-2 text-left font-medium transition-all",
                  selected === idx
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/30 hover:bg-muted/50"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <Button
        onClick={nextQuestion}
        disabled={selected === null}
        size="lg"
        className="w-full rounded-xl"
      >
        {current === diagnosticQuestions.length - 1 ? "Finish" : "Next"}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}