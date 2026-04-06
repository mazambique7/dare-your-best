import { motion } from "framer-motion";
import { Award, Lock, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface BadgeItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "dares" | "streak" | "social";
  threshold: number;
  unlocked: boolean;
  progress: number;
}

const categoryLabels: Record<string, string> = {
  dares: "Вызовы",
  streak: "Стрик",
  social: "Социальное",
};

const AchievementsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: () => api.getAchievements(),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const badges: BadgeItem[] = data?.badges ?? [];
  const total = data?.total ?? 0;
  const unlocked = data?.unlocked ?? 0;

  const grouped = badges.reduce((acc, b) => {
    (acc[b.category] ??= []).push(b);
    return acc;
  }, {} as Record<string, BadgeItem[]>);

  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="mx-auto max-w-md px-4">
        <h1 className="mb-1 font-display text-3xl tracking-wide text-foreground">Достижения</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Открыто {unlocked} из {total}
        </p>

        <Progress value={(unlocked / Math.max(total, 1)) * 100} className="mb-6 h-2" />

        {(["dares", "streak", "social"] as const).map((cat) => {
          const items = grouped[cat];
          if (!items?.length) return null;
          return (
            <div key={cat} className="mb-6">
              <h2 className="mb-3 flex items-center gap-2 font-display text-lg tracking-wider text-foreground">
                <Award className="h-4 w-4 text-primary" />
                {categoryLabels[cat]}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {items.map((badge, i) => {
                  const pct = Math.min((badge.progress / badge.threshold) * 100, 100);
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`relative flex flex-col items-center rounded-xl border p-3 text-center transition-all ${
                        badge.unlocked
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-card opacity-60"
                      }`}
                    >
                      <span className="mb-1 text-2xl">{badge.icon}</span>
                      {!badge.unlocked && (
                        <Lock className="absolute right-1.5 top-1.5 h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-[11px] font-medium leading-tight text-foreground">
                        {badge.title}
                      </span>
                      <span className="mt-0.5 text-[9px] text-muted-foreground leading-tight">
                        {badge.description}
                      </span>
                      {!badge.unlocked && (
                        <div className="mt-1.5 w-full">
                          <Progress value={pct} className="h-1" />
                          <span className="mt-0.5 block text-[8px] text-muted-foreground">
                            {badge.progress}/{badge.threshold}
                          </span>
                        </div>
                      )}
                      {badge.unlocked && (
                        <Badge variant="default" className="mt-1.5 px-1.5 py-0 text-[8px]">
                          ✓
                        </Badge>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsPage;
