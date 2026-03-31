import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const rankStyles: Record<number, string> = {
  1: "text-streak border-streak/30 bg-streak/10",
  2: "text-muted-foreground border-muted/30 bg-muted/10",
  3: "text-warning border-warning/30 bg-warning/10",
};

const periods = [
  { label: "Неделя", value: "week" as const },
  { label: "Всё время", value: "all" as const },
];

const LeaderboardPage = () => {
  const [period, setPeriod] = useState<"week" | "all">("week");

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: () => api.getLeaderboard({ period }),
  });

  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="mx-auto max-w-md px-4">
        <h1 className="mb-1 font-display text-3xl tracking-wide text-foreground">Лидерборд</h1>
        <p className="mb-5 text-sm text-muted-foreground">Топ игроков твоего города</p>

        <div className="mb-5 flex gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                period === p.value ? "gradient-fire text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-muted-foreground">Не удалось загрузить лидерборд</p>
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-muted-foreground">Пока нет данных</p>
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {users.length >= 3 && (
              <div className="mb-6 flex items-end justify-center gap-3">
                {[users[1], users[0], users[2]].map((user: any, i: number) => {
                  const heights = ["h-24", "h-32", "h-20"];
                  const sizes = ["text-lg", "text-2xl", "text-lg"];
                  const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
                  return (
                    <motion.div
                      key={user.username}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="flex flex-col items-center"
                    >
                      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-foreground font-display text-xl">
                        {(user.username || "?")[0].toUpperCase()}
                      </div>
                      <span className="mb-1 text-xs font-medium text-foreground">@{user.username}</span>
                      <div className={`${heights[i]} w-20 rounded-t-xl gradient-card border border-border flex flex-col items-center justify-center`}>
                        <span className={`font-display ${sizes[i]} text-gradient-fire`}>{rank}</span>
                        <span className="text-xs text-muted-foreground">{user.points}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Rest */}
            <div className="flex flex-col gap-2">
              {users.slice(3).map((user: any, i: number) => (
                <motion.div
                  key={user.username}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <span className="w-6 text-center font-display text-lg text-muted-foreground">{i + 4}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-medium text-foreground">
                    {(user.username || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">@{user.username}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{user.points} pts</span>
                      {user.streak > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-streak">
                          <Flame className="h-3 w-3" />{user.streak}
                        </span>
                      )}
                    </div>
                  </div>
                  <TrendingUp className="h-4 w-4 text-success" />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
