import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, Gamepad2, ShoppingCart, BarChart3, ArrowRight } from "lucide-react";

const features = [
  {
    title: "Diagnostic Assessment",
    description: "Discover your specific math strengths and areas to grow. We'll personalize everything for you.",
    icon: Target,
    path: "/dyscalculia/diagnostic",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Practice Zone",
    description: "Interactive, multi-sensory math exercises that adapt to your level in real-time.",
    icon: Gamepad2,
    path: "/dyscalculia/practice",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    title: "Real-World Math",
    description: "Apply math to cooking, shopping, budgeting, and more. Choose what interests you!",
    icon: ShoppingCart,
    path: "/dyscalculia/real-world",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    title: "My Progress",
    description: "Track your growth, see what you've mastered, and celebrate your wins.",
    icon: BarChart3,
    path: "/dyscalculia/progress",
    gradient: "from-amber-500 to-orange-500",
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

export default function DyscalculiaHome() {
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dyscalculia Support</h1>
        <p className="text-muted-foreground max-w-lg leading-relaxed">
          Math made visual, tactile, and fun. Learn at your own pace with tools built for how your mind works.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {features.map((feat) => (
          <motion.div key={feat.title} variants={item}>
            <Link to={feat.path} className="block group">
              <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 h-full transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feat.gradient} mb-4`}>
                  <feat.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {feat.description}
                </p>
                <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                  Start <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}