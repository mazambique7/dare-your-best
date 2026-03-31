import { motion } from "framer-motion";
import { Flame, Calendar, TrendingUp, Zap, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const StreakPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const streak = user?.streak ?? 0;
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  // Calculate which days of current week are completed based on streak
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const mondayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const completed = days.map((_, i) => i <= mondayIndex && i >= mondayIndex - Math.min(streak - 1, mondayIndex));

  const streakMultiplier = streak >= 30 ? "×3.0" : streak >= 14 ? "×2.0" : streak >= 7 ? "×1.5" : "×1.0";

  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="mx-auto max-w-md px-4">
        <h1 className="mb-1 font-display text-3xl tracking-wide text-foreground">Стрик</h1>
        <p className="mb-6 text-sm text-muted-foreground">Не сломай цепочку</p>

        {/* Big streak counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="relative mb-4">
            <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-primary/30 bg-primary/5">
              <div className="text-center">
                <Flame className="mx-auto mb-1 h-8 w-8 text-primary" />
                <span className="font-display text-6xl text-gradient-fire">{streak}</span>
              </div>
            </div>
            <div className="absolute inset-0 animate-pulse-glow rounded-full" />
          </div>
          <span className="font-display text-lg tracking-wider text-muted-foreground">ДНЕЙ ПОДРЯД</span>
        </motion.div>

        {/* Week view */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 rounded-xl border border-border bg-card p-4"
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            Эта неделя
          </div>
          <div className="flex justify-between">
            {days.map((day, i) => (
              <div key={day} className="flex flex-col items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{day}</span>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                    completed[i]
                      ? "gradient-fire text-primary-foreground"
                      : "border border-border bg-secondary text-muted-foreground"
                  }`}
                >
                  {completed[i] ? <Flame className="h-4 w-4" /> : "—"}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: TrendingUp, label: "Текущий стрик", value: `${streak} ${streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}`, color: "text-streak" },
            { icon: Zap, label: "Бонус за стрик", value: streakMultiplier, color: "text-primary" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="gradient-card rounded-xl border border-border p-4"
            >
              <stat.icon className={`mb-2 h-5 w-5 ${stat.color}`} />
              <div className="font-display text-xl text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StreakPage;
