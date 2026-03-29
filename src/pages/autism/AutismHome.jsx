import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageSquare, ListChecks, Waves, Users, Heart, BookOpen, Star, ArrowRight, Sparkles
} from "lucide-react";

const features = [
  {
    title: "Communication Support",
    description: "AAC tools, script library, tone checker, and quick phrases for any situation.",
    icon: MessageSquare,
    path: "/autism/communication",
    gradient: "from-emerald-500 to-teal-500",
    available: true,
  },
  {
    title: "Executive Function",
    description: "Visual task breakdown, time blindness helpers, routines, and transition warnings.",
    icon: ListChecks,
    path: "/autism/executive-function",
    gradient: "from-blue-500 to-indigo-500",
    available: true,
  },
  {
    title: "Sensory Regulation",
    description: "Sensory profile, energy tracking, regulation strategies, and meltdown early warning.",
    icon: Waves,
    path: "/autism/sensory",
    gradient: "from-violet-500 to-purple-500",
    available: true,
  },
  {
    title: "Social Navigation",
    description: "Decode NT culture, social story creator, boundary scripts, and event prep.",
    icon: Users,
    path: "/autism/social",
    gradient: "from-pink-500 to-rose-500",
    available: true,
  },
  {
    title: "Well-Being",
    description: "Autistic burnout tracking, anxiety support, and peer community access.",
    icon: Heart,
    path: "/autism/wellbeing",
    gradient: "from-amber-500 to-orange-500",
    available: false,
  },
  {
    title: "Education & Advocacy",
    description: "Accommodation request generator, rights info, and academic support.",
    icon: BookOpen,
    path: "/autism/advocacy",
    gradient: "from-cyan-500 to-sky-500",
    available: false,
  },
  {
    title: "Special Interests",
    description: "Deep-dive learning tools, community finding, and portfolio creation.",
    icon: Star,
    path: "/autism/interests",
    gradient: "from-lime-500 to-green-500",
    available: false,
  },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function AutismHome() {
  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-8 md:p-12"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Autism Support</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Built for you, by design.
          </h1>
          <p className="text-muted-foreground max-w-xl text-base leading-relaxed">
            These tools are designed with and for autistic people — supporting communication,
            regulation, and daily life on your terms, without judgment.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {features.map((feat) => (
          <motion.div key={feat.title} variants={item}>
            {feat.available ? (
              <Link to={feat.path} className="block group">
                <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 h-full transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feat.gradient} mb-4`}>
                    <feat.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{feat.description}</p>
                  <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                    Open <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ) : (
              <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 h-full opacity-55">
                <div className="absolute top-4 right-4 text-xs font-medium bg-muted px-3 py-1 rounded-full text-muted-foreground">
                  Coming Soon
                </div>
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feat.gradient} mb-4 opacity-50`}>
                  <feat.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}