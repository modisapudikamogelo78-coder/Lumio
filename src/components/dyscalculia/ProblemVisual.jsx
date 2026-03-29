import { motion } from "framer-motion";

function ConcreteView({ problem }) {
  const { a, b, operation } = problem;
  const maxDots = 30;
  const displayA = Math.min(a, maxDots);
  const displayB = Math.min(b, maxDots);

  if (operation === "fraction") {
    const parts = Array.from({ length: b }, (_, i) => i < a);
    return (
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {parts.map((filled, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className={`h-10 w-10 rounded-lg ${filled ? "bg-primary" : "bg-muted"} border border-border`}
          />
        ))}
      </div>
    );
  }

  if (operation === "money") {
    return (
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {Array.from({ length: Math.min(Math.ceil(a), 10) }, (_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.06 }}
            className="h-12 w-12 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center text-green-700 font-bold text-sm"
          >
            $1
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      <div className="flex flex-wrap gap-1.5 justify-center max-w-[200px]">
        {Array.from({ length: displayA }, (_, i) => (
          <motion.div
            key={`a-${i}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="h-6 w-6 rounded-full bg-primary"
          />
        ))}
      </div>
      <span className="text-2xl font-bold text-muted-foreground">
        {operation}
      </span>
      <div className="flex flex-wrap gap-1.5 justify-center max-w-[200px]">
        {Array.from({ length: displayB }, (_, i) => (
          <motion.div
            key={`b-${i}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.03 + 0.2 }}
            className="h-6 w-6 rounded-full bg-secondary"
          />
        ))}
      </div>
    </div>
  );
}

function PictorialView({ problem }) {
  const { a, b, operation } = problem;

  if (operation === "fraction") {
    return (
      <div className="flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="h-32 w-32">
          {Array.from({ length: b }, (_, i) => {
            const angle = (360 / b) * i;
            const nextAngle = (360 / b) * (i + 1);
            const x1 = 60 + 50 * Math.cos((Math.PI * angle) / 180);
            const y1 = 60 + 50 * Math.sin((Math.PI * angle) / 180);
            const x2 = 60 + 50 * Math.cos((Math.PI * nextAngle) / 180);
            const y2 = 60 + 50 * Math.sin((Math.PI * nextAngle) / 180);
            const largeArc = nextAngle - angle > 180 ? 1 : 0;
            return (
              <motion.path
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                d={`M60,60 L${x1},${y1} A50,50 0 ${largeArc},1 ${x2},${y2} Z`}
                fill={i < a ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      </div>
    );
  }

  // Number line
  const maxVal = Math.max(a, b, (a || 0) + (b || 0)) + 3;
  return (
    <div className="px-4">
      <svg viewBox={`0 0 ${maxVal * 20 + 40} 60`} className="w-full h-16">
        <line x1="10" y1="40" x2={maxVal * 20 + 10} y2="40" stroke="hsl(var(--border))" strokeWidth="2" />
        {Array.from({ length: maxVal + 1 }, (_, i) => (
          <g key={i}>
            <line x1={i * 20 + 10} y1="35" x2={i * 20 + 10} y2="45" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
            <text x={i * 20 + 10} y="55" textAnchor="middle" className="text-xs fill-muted-foreground">{i}</text>
          </g>
        ))}
        <motion.circle
          initial={{ cx: 10 }}
          animate={{ cx: a * 20 + 10 }}
          transition={{ duration: 0.5 }}
          cy="30" r="6" fill="hsl(var(--primary))"
        />
      </svg>
    </div>
  );
}

function AbstractView({ problem }) {
  return (
    <div className="flex items-center justify-center">
      <div className="text-4xl font-bold tracking-wider text-center">
        <span className="text-primary">{problem.a}</span>
        <span className="text-muted-foreground mx-3">{problem.operation}</span>
        <span className="text-secondary">{problem.b}</span>
      </div>
    </div>
  );
}

export default function ProblemVisual({ problem, representation }) {
  return (
    <div className="min-h-[120px] flex items-center justify-center rounded-xl bg-muted/30 p-4">
      {representation === "concrete" && <ConcreteView problem={problem} />}
      {representation === "pictorial" && <PictorialView problem={problem} />}
      {representation === "abstract" && <AbstractView problem={problem} />}
    </div>
  );
}