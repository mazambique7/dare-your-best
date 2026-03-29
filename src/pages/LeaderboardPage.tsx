import { motion } from "framer-motion";
import { Trophy, Flame, Medal, TrendingUp } from "lucide-react";

const mockUsers = [
  { rank: 1, username: "daredevil", points: 4200, streak: 23, city: "Москва" },
  { rank: 2, username: "iceman", points: 3800, streak: 18, city: "Москва" },
  { rank: 3, username: "chef_mode", points: 3100, streak: 15, city: "Москва" },
  { rank: 4, username: "comedian", points: 2900, streak: 12, city: "Москва" },
  { rank: 5, username: "runner_x", points: 2600, streak: 9, city: "Москва" },
  { rank: 6, username: "brave_one", points: 2100, streak: 7, city: "Москва" },
  { rank: 7, username: "nightowl", points: 1800, streak: 5, city: "Москва" },
  { rank: 8, username: "flash_dare", points: 1500, streak: 4, city: "Москва" },
  { rank: 9, username: "wild_card", points: 1200, streak: 3, city: "Москва" },
  { rank: 10, username: "newbie_hero", points: 800, streak: 1, city: "Москва" },
];

const rankStyles: Record<number, string> = {
  1: "text-streak border-streak/30 bg-streak/10",
  2: "text-muted-foreground border-muted/30 bg-muted/10",
  3: "text-warning border-warning/30 bg-warning/10",
};

const LeaderboardPage = () => {
  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="mx-auto max-w-md px-4">
        <h1 className="mb-1 font-display text-3xl tracking-wide text-foreground">Лидерборд</h1>
        <p className="mb-5 text-sm text-muted-foreground">Топ игроков твоего города</p>

        <div className="mb-5 flex gap-2">
          {["Неделя", "Всё время"].map((period, i) => (
            <button
              key={period}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                i === 0 ? "gradient-fire text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Top 3 podium */}
        <div className="mb-6 flex items-end justify-center gap-3">
          {[mockUsers[1], mockUsers[0], mockUsers[2]].map((user, i) => {
            const heights = ["h-24", "h-32", "h-20"];
            const sizes = ["text-lg", "text-2xl", "text-lg"];
            return (
              <motion.div
                key={user.rank}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center"
              >
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-foreground font-display text-xl">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="mb-1 text-xs font-medium text-foreground">@{user.username}</span>
                <div className={`${heights[i]} w-20 rounded-t-xl gradient-card border border-border flex flex-col items-center justify-center`}>
                  <span className={`font-display ${sizes[i]} text-gradient-fire`}>{user.rank}</span>
                  <span className="text-xs text-muted-foreground">{user.points}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Rest of leaderboard */}
        <div className="flex flex-col gap-2">
          {mockUsers.slice(3).map((user, i) => (
            <motion.div
              key={user.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <span className="w-6 text-center font-display text-lg text-muted-foreground">{user.rank}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-medium text-foreground">
                {user.username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">@{user.username}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{user.points} pts</span>
                  <span className="flex items-center gap-0.5 text-xs text-streak">
                    <Flame className="h-3 w-3" />{user.streak}
                  </span>
                </div>
              </div>
              <TrendingUp className="h-4 w-4 text-success" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
