import { motion } from "framer-motion";
import { CheckCircle, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function FeedbackPanel({ feedback }) {
  const [expandedStep, setExpandedStep] = useState(false);

  if (feedback.correct) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-green-50 border border-green-200 p-5 flex items-center gap-4"
      >
        <CheckCircle className="h-8 w-8 text-green-600 shrink-0" />
        <div>
          <p className="font-semibold text-green-800">{feedback.message}</p>
        </div>
      </motion.div>
    );
  }

  const { analysis } = feedback;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-amber-50 border border-amber-200 p-5 space-y-4"
    >
      {/* Encouragement */}
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-amber-800">{analysis?.encouragement || "Great effort! Let's learn from this."}</p>
          <p className="text-sm text-amber-700 mt-1">{analysis?.what_happened}</p>
        </div>
      </div>

      {/* Step by step (collapsible) */}
      <button
        onClick={() => setExpandedStep(!expandedStep)}
        className="flex items-center gap-2 text-sm font-medium text-amber-800 hover:text-amber-900"
      >
        {expandedStep ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        Show step-by-step solution
      </button>

      {expandedStep && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="pl-4 border-l-2 border-amber-300 space-y-3"
        >
          <div>
            <p className="text-sm font-medium text-amber-800">Step by step:</p>
            <p className="text-sm text-amber-700 whitespace-pre-wrap">{analysis?.step_by_step}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">Try another way:</p>
            <p className="text-sm text-amber-700">{analysis?.alternative_strategy}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}