import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function speak(text) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.88;
  window.speechSynthesis.speak(u);
}

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return now;
}

export default function TimeAnchor() {
  const now = useNow();
  const [alarmInput, setAlarmInput] = useState("");
  const [alarmLabel, setAlarmLabel] = useState("");
  const [alarms, setAlarms] = useState([]);
  const [alertsOn, setAlertsOn] = useState(true);
  const firedRef = useRef({});

  const startHour = 6, endHour = 23;
  const totalMinutes = (endHour - startHour) * 60;
  const elapsedMinutes = Math.max(0, Math.min((now.getHours() - startHour) * 60 + now.getMinutes(), totalMinutes));
  const dayProgress = elapsedMinutes / totalMinutes;

  useEffect(() => {
    if (!alertsOn) return;
    alarms.forEach((alarm) => {
      const [h, m] = alarm.time.split(":").map(Number);
      const fiveKey = `${alarm.id}-5`;
      const oneKey = `${alarm.id}-1`;
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const alarmMins = h * 60 + m;
      const diff = alarmMins - nowMins;
      if (diff === 5 && !firedRef.current[fiveKey]) { firedRef.current[fiveKey] = true; speak(`5 minutes until ${alarm.label || "your alarm"}.`); }
      if (diff === 1 && !firedRef.current[oneKey]) { firedRef.current[oneKey] = true; speak(`1 minute until ${alarm.label || "your alarm"}.`); }
      if (diff <= 0 && diff > -1 && !firedRef.current[alarm.id]) { firedRef.current[alarm.id] = true; speak(`It's time${alarm.label ? " for " + alarm.label : ""}!`); }
    });
  }, [now, alarms, alertsOn]);

  const addAlarm = () => {
    if (!alarmInput) return;
    setAlarms((prev) => [...prev, { id: Date.now().toString(), time: alarmInput, label: alarmLabel }]);
    setAlarmInput(""); setAlarmLabel("");
  };

  const dateStr = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <Link to="/adhd" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div>
        <h2 className="text-2xl font-bold mb-1">Time Anchor</h2>
        <p className="text-muted-foreground text-sm">Time, made visible. So it feels real.</p>
      </div>

      <div className="rounded-2xl bg-card border border-border p-8 text-center space-y-1">
        <p className="text-6xl font-bold tabular-nums tracking-tight">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
        <p className="text-sm text-muted-foreground">{dateStr}</p>
      </div>

      <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Day progress</span>
          <span className="text-muted-foreground">{Math.round(dayProgress * 100)}% of your day</span>
        </div>
        <div className="relative w-full h-5 rounded-full bg-muted overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
            initial={false} animate={{ width: `${dayProgress * 100}%` }} transition={{ duration: 1 }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-medium">Transition alerts</p>
          <button onClick={() => setAlertsOn(!alertsOn)}
            className={cn("flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors",
              alertsOn ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
            {alertsOn ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            {alertsOn ? "On" : "Off"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Spoken warnings at 5 min and 1 min before each alarm.</p>
        <div className="flex gap-2">
          <input type="time" value={alarmInput} onChange={(e) => setAlarmInput(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <input value={alarmLabel} onChange={(e) => setAlarmLabel(e.target.value)} placeholder="Label (optional)"
            className="flex-1 px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <Button onClick={addAlarm} disabled={!alarmInput} className="rounded-xl">Add</Button>
        </div>
        {alarms.length > 0 && (
          <div className="space-y-2">
            {alarms.map((alarm) => (
              <div key={alarm.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/50">
                <div>
                  <span className="font-semibold tabular-nums">{alarm.time}</span>
                  {alarm.label && <span className="text-sm text-muted-foreground ml-2">{alarm.label}</span>}
                </div>
                <button onClick={() => setAlarms((p) => p.filter((a) => a.id !== alarm.id))} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}