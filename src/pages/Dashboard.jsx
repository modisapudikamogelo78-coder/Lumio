import { Link } from "react-router-dom";
import { BookOpen, Calculator, Brain, Zap, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";

const modules = [
  {
    title: "Dyslexia Support",
    description: "Turn text into vivid visuals. Upload homework, get images and audio that bring words to life.",
    icon: BookOpen,
    path: "/dyslexia",
    gradient: "from-violet-500 to-purple-600",
    available: true,
  },
  {
    title: "Dyscalculia Support",
    description: "Math made visual and tactile. Interactive manipulatives, step-by-step guidance, real-world contexts.",
    icon: Calculator,
    path: "/dyscalculia",
    gradient: "from-blue-500 to-cyan-500",
    available: true,
  },
  {
    title: "Autism Support",
    description: "Social stories, routine builders, and sensory-friendly learning tools.",
    icon: Brain,
    path: "/autism",
    gradient: "from-emerald-500 to-teal-500",
    available: true,
  },
  {
    title: "ADHD Support",
    description: "Focus-friendly learning with gamification, timers, and bite-sized lessons.",
    icon: Zap,
    path: "/adhd",
    gradient: "from-amber-500 to-orange-500",
    available: true,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  useEffect(() => {
    const synth = window.speechSynthesis;
    // Wait a moment for the page to settle, then greet
    const timer = setTimeout(() => {
      synth.cancel();
      const greeting = new SpeechSynthesisUtterance(
        "Hey there! I'm Lumio — think of me as your learning companion, your creative thinking partner, and your biggest fan all rolled into one. " +
        "Whatever you're working on today, we're going to figure it out together — at your pace, in your way. " +
        "So take a breath, pick a module, and let's make something click."
      );
      greeting.rate = 0.88;
      greeting.pitch = 1.08;
      synth.speak(greeting);
    }, 800);
    return () => { clearTimeout(timer); synth.cancel(); };
  }, []);
  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 md:p-12"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Welcome to Lumio</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Learning, your way.
          </h1>
          <p className="text-muted-foreground max-w-lg text-base leading-relaxed">
            Lumio transforms how you learn by adapting to your unique needs.
            Choose a learning module below to get started.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-5 -bottom-10 h-32 w-32 rounded-full bg-secondary/10 blur-3xl" />
      </motion.div>

      {/* Modules */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {modules.map((mod) => (
          <motion.div key={mod.title} variants={item}>
            {mod.available ? (
              <Link to={mod.path} className="block group">
                <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 h-full transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${mod.gradient} mb-4`}>
                    <mod.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{mod.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {mod.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                    Start learning <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ) : (
              <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 h-full opacity-60">
                <div className="absolute top-4 right-4 text-xs font-medium bg-muted px-3 py-1 rounded-full text-muted-foreground">
                  Coming Soon
                </div>
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${mod.gradient} mb-4 opacity-50`}>
                  <mod.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{mod.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {mod.description}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}