import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import DailyDare from "@/components/DailyDare";
import DareCard from "@/components/DareCard";
import api from "@/lib/api";

const categories = ["Все", "Социальное", "Спорт", "Физическое", "Творчество", "Экстрим"];

const FeedPage = () => {
  const [activeCategory, setActiveCategory] = useState("Все");
  const { user } = useAuth();

  const { data: dares = [], isLoading, error } = useQuery({
    queryKey: ["dares", activeCategory],
    queryFn: () =>
      api.getDares(activeCategory === "Все" ? undefined : { category: activeCategory }),
  });

  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="mx-auto max-w-md px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-wide text-foreground">DareLoop</h1>
            <p className="text-sm text-muted-foreground">Прими вызов. Докажи.</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5">
            <Flame className="h-4 w-4 text-streak" />
            <span className="font-display text-lg text-streak">{user?.streak ?? 0}</span>
          </div>
        </div>

        {/* Daily */}
        <div className="mb-6">
          <DailyDare />
        </div>

        {/* Category pills */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "gradient-fire text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-muted-foreground">Не удалось загрузить вызовы</p>
            <p className="mt-1 text-xs text-muted-foreground">{(error as Error).message}</p>
          </div>
        ) : dares.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-muted-foreground">Пока нет вызовов в этой категории</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {dares.map((dare: any, i: number) => (
              <motion.div
                key={dare.id ?? i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <DareCard
                  id={dare.id}
                  title={dare.title}
                  description={dare.description}
                  category={dare.category}
                  difficulty={dare.difficulty ?? "easy"}
                  reward={dare.reward ?? (dare.difficulty === "hard" ? 300 : dare.difficulty === "medium" ? 200 : 100)}
                  timeLeft={dare.time_left}
                  author={dare.author?.username ?? dare.author_username}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
