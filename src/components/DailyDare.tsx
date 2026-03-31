import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Clock, Star, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

const DailyDare = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ["daily-dare"],
    queryFn: () => api.getDailyDare(),
  });

  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (data?.remaining_secs) setRemaining(data.remaining_secs);
  }, [data?.remaining_secs]);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [remaining]);

  const fmt = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-primary/30 p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data?.dare) return null;

  const dare = data.dare;
  const reward = dare.reward ?? (dare.difficulty === "hard" ? 300 : dare.difficulty === "medium" ? 200 : 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl border border-primary/30 p-5 shadow-glow cursor-pointer"
      style={{ background: "linear-gradient(145deg, hsl(350 100% 62% / 0.15), hsl(240 8% 10%))" }}
      onClick={() => navigate(`/dare/${dare.id}`)}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-streak/10 blur-xl" />

      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <div className="gradient-fire flex h-8 w-8 items-center justify-center rounded-lg">
            <Star className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-sm tracking-widest text-primary">ВЫЗОВ ДНЯ</span>
        </div>

        <h2 className="mb-2 font-display text-2xl tracking-wide text-foreground">
          {dare.title}
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {dare.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-sm font-bold text-streak">
              <Flame className="h-4 w-4" />+{reward}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />{fmt(remaining)}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              api.acceptDare(dare.id).then(() => navigate(`/dare/${dare.id}`));
            }}
            className="animate-pulse-glow gradient-fire rounded-xl px-5 py-2.5 font-display text-sm tracking-wider text-primary-foreground transition-transform hover:scale-105 active:scale-95"
          >
            ПРИНЯТЬ
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DailyDare;
