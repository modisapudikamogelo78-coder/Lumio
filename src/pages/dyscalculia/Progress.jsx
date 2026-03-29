const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, Loader2 } from "lucide-react";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const topicEmojis = {
  number_sense: "🔢",
  addition: "➕",
  subtraction: "➖",
  multiplication: "✖️",
  division: "➗",
  fractions: "🍕",
  decimals: "📐",
  measurement: "📏",
  money: "💰",
  time: "⏰",
};

export default function Progress() {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const data = await db.entities.MathProgress.list("-updated_date");
    setProgress(data);
    setLoading(false);
  };

  const overallMastery = progress.length
    ? Math.round(progress.reduce((sum, p) => sum + (p.mastery_level || 0), 0) / progress.length)
    : 0;

  return (
    <div className="space-y-6">
      <Link
        to="/dyscalculia"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div>
        <h2 className="text-2xl font-bold mb-2">My Progress</h2>
        <p className="text-muted-foreground text-sm">Track your growth and celebrate every win!</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : progress.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">No progress yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Take the diagnostic assessment or practice some problems to see your progress here.
          </p>
          <Link
            to="/dyscalculia/diagnostic"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Take diagnostic <TrendingUp className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Overall */}
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Overall Mastery</p>
            <div className="text-5xl font-bold text-primary mb-3">{overallMastery}%</div>
            <div className="w-full max-w-xs mx-auto h-3 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallMastery}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-primary"
              />
            </div>
          </div>

          {/* Topic breakdown */}
          <div className="space-y-3">
            {progress.map((p) => (
              <div key={p.id} className="rounded-xl bg-card border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{topicEmojis[p.topic] || "📚"}</span>
                    <div>
                      <p className="font-medium capitalize">{(p.topic || "").replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.total_correct || 0}/{p.total_problems_attempted || 0} correct • Level {p.current_difficulty || 1}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-sm font-bold",
                    (p.mastery_level || 0) >= 80 ? "text-green-600" : (p.mastery_level || 0) >= 50 ? "text-amber-500" : "text-red-400"
                  )}>
                    {p.mastery_level || 0}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      (p.mastery_level || 0) >= 80 ? "bg-green-500" : (p.mastery_level || 0) >= 50 ? "bg-amber-500" : "bg-red-400"
                    )}
                    style={{ width: `${p.mastery_level || 0}%` }}
                  />
                </div>
                {p.struggles && p.struggles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.struggles.map((s, i) => (
                      <span key={i} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}