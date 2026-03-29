import { motion } from "framer-motion";
import { Flame, Clock, Star } from "lucide-react";

const DailyDare = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl border border-primary/30 p-5 shadow-glow"
      style={{ background: "linear-gradient(145deg, hsl(350 100% 62% / 0.15), hsl(240 8% 10%))" }}
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
          Сделай 50 отжиманий в парке
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Сними видео-доказательство и получи двойные очки. Только сегодня!
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-sm font-bold text-streak">
              <Flame className="h-4 w-4" />+400
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />16:42:30
            </span>
          </div>
          <button className="animate-pulse-glow gradient-fire rounded-xl px-5 py-2.5 font-display text-sm tracking-wider text-primary-foreground transition-transform hover:scale-105 active:scale-95">
            ПРИНЯТЬ
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DailyDare;
