const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";
import { ArrowLeft, Lightbulb, Volume2, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import ProblemVisual from "../../components/dyscalculia/ProblemVisual";
import FeedbackPanel from "../../components/dyscalculia/FeedbackPanel";

const topics = [
  { value: "addition", label: "Addition", emoji: "➕" },
  { value: "subtraction", label: "Subtraction", emoji: "➖" },
  { value: "multiplication", label: "Multiplication", emoji: "✖️" },
  { value: "division", label: "Division", emoji: "➗" },
  { value: "fractions", label: "Fractions", emoji: "🍕" },
  { value: "money", label: "Money", emoji: "💰" },
];

function generateProblem(topic, difficulty) {
  const max = Math.min(difficulty * 3 + 5, 50);
  const a = Math.floor(Math.random() * max) + 1;
  const b = Math.floor(Math.random() * max) + 1;

  switch (topic) {
    case "addition":
      return { question: `${a} + ${b}`, answer: a + b, a, b, operation: "+" };
    case "subtraction": {
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      return { question: `${big} - ${small}`, answer: big - small, a: big, b: small, operation: "-" };
    }
    case "multiplication": {
      const m1 = Math.floor(Math.random() * (difficulty + 3)) + 1;
      const m2 = Math.floor(Math.random() * (difficulty + 3)) + 1;
      return { question: `${m1} × ${m2}`, answer: m1 * m2, a: m1, b: m2, operation: "×" };
    }
    case "division": {
      const divisor = Math.floor(Math.random() * (difficulty + 2)) + 1;
      const result = Math.floor(Math.random() * (difficulty + 3)) + 1;
      return { question: `${divisor * result} ÷ ${divisor}`, answer: result, a: divisor * result, b: divisor, operation: "÷" };
    }
    case "fractions": {
      const denom = [2, 3, 4, 5, 6, 8][Math.floor(Math.random() * 6)];
      const num = Math.floor(Math.random() * (denom - 1)) + 1;
      return {
        question: `What is ${num}/${denom} of ${denom * 2}?`,
        answer: num * 2,
        a: num,
        b: denom,
        operation: "fraction",
      };
    }
    case "money": {
      const price = parseFloat((Math.random() * difficulty * 2 + 1).toFixed(2));
      const paid = Math.ceil(price);
      return {
        question: `You pay $${paid}.00 for something that costs $${price.toFixed(2)}. What's your change?`,
        answer: parseFloat((paid - price).toFixed(2)),
        a: paid,
        b: price,
        operation: "money",
      };
    }
    default:
      return { question: `${a} + ${b}`, answer: a + b, a, b, operation: "+" };
  }
}

export default function Practice() {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [difficulty, setDifficulty] = useState(3);
  const [problem, setProblem] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [representation, setRepresentation] = useState("concrete"); // concrete | pictorial | abstract

  useEffect(() => {
    if (selectedTopic) {
      generateNew();
    }
  }, [selectedTopic, difficulty]);

  const generateNew = () => {
    setProblem(generateProblem(selectedTopic, difficulty));
    setUserAnswer("");
    setFeedback(null);
    setShowHint(false);
  };

  const checkAnswer = async () => {
    const correct = parseFloat(userAnswer) === problem.answer;

    if (correct) {
      setStreak((s) => s + 1);
      setFeedback({ correct: true, message: getPositiveFeedback() });
      // Adaptive: increase difficulty after 3 correct in a row
      if (streak >= 2 && difficulty < 10) setDifficulty((d) => d + 1);
    } else {
      setStreak(0);
      // Get AI error analysis
      const analysis = await db.integrations.Core.InvokeLLM({
        prompt: `A student with dyscalculia was solving: ${problem.question}
Their answer: ${userAnswer}
Correct answer: ${problem.answer}

Explain in a friendly, supportive way:
1. What might have gone wrong in their thinking
2. A step-by-step way to solve it
3. An alternative strategy they could try

Use growth mindset language. Be encouraging. Keep it simple and clear.`,
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
      if (difficulty > 1) setDifficulty((d) => d - 1);
    }
  };

  const getPositiveFeedback = () => {
    const messages = [
      "Amazing work! You're getting stronger! 💪",
      "That's correct! Your brain is growing! 🧠",
      "Brilliant! Keep up the fantastic work! ⭐",
      "You nailed it! Math superstar! 🌟",
      "Perfect! You're on a roll! 🎯",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const speakProblem = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(problem.question);
    utterance.rate = 0.8;
    synth.speak(utterance);
  };

  if (!selectedTopic) {
    return (
      <div className="space-y-6">
        <Link
          to="/dyscalculia"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <h2 className="text-2xl font-bold mb-2">Practice Zone</h2>
          <p className="text-muted-foreground text-sm">Choose a topic to practice. We'll adapt to your level.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {topics.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedTopic(t.value)}
              className="rounded-2xl bg-card border border-border p-6 text-center hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all"
            >
              <div className="text-3xl mb-3">{t.emoji}</div>
              <p className="font-medium">{t.label}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedTopic(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Topics
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Streak: {streak} 🔥</span>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
            Level {difficulty}
          </span>
        </div>
      </div>

      {/* Representation toggle */}
      <div className="flex gap-2">
        {["concrete", "pictorial", "abstract"].map((r) => (
          <button
            key={r}
            onClick={() => setRepresentation(r)}
            className={cn(
              "text-xs px-4 py-2 rounded-full transition-colors capitalize",
              representation === r
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {problem && (
        <motion.div
          key={problem.question}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border p-6 space-y-6"
        >
          {/* Visual representation */}
          <ProblemVisual problem={problem} representation={representation} />

          {/* Question */}
          <div className="flex items-center justify-center gap-3">
            <h3 className="text-2xl font-bold text-center">{problem.question} = ?</h3>
            <button onClick={speakProblem} className="p-2 rounded-lg hover:bg-muted">
              <Volume2 className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Answer input */}
          <div className="flex gap-3">
            <input
              type="number"
              step="any"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && userAnswer && checkAnswer()}
              placeholder="Your answer..."
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={feedback !== null}
            />
            {!feedback ? (
              <Button
                onClick={checkAnswer}
                disabled={!userAnswer}
                size="lg"
                className="rounded-xl px-6"
              >
                <Check className="h-5 w-5" />
              </Button>
            ) : (
              <Button onClick={generateNew} size="lg" className="rounded-xl px-6">
                <RefreshCw className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Hint */}
          {!feedback && (
            <button
              onClick={() => setShowHint(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Lightbulb className="h-4 w-4" />
              {showHint ? `Hint: The answer is between ${problem.answer - 3} and ${problem.answer + 3}` : "Need a hint?"}
            </button>
          )}

          {/* Feedback */}
          {feedback && <FeedbackPanel feedback={feedback} />}
        </motion.div>
      )}
    </div>
  );
}