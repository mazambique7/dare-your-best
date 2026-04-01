import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Loader2, RefreshCw } from "lucide-react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import DailyDare from "@/components/DailyDare";
import DareCard from "@/components/DareCard";
import api from "@/lib/api";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

const categories = ["Все", "Социальное", "Спорт", "Физическое", "Творчество", "Экстрим"];
const PAGE_SIZE = 10;

const FeedPage = () => {
  const [activeCategory, setActiveCategory] = useState("Все");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["dares", activeCategory],
    queryFn: ({ pageParam = 0 }) =>
      api.getDares({
        ...(activeCategory !== "Все" ? { category: activeCategory } : {}),
        offset: pageParam,
        limit: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return allPages.flat().length;
    },
    initialPageParam: 0,
  });

  const dares = data?.pages.flat() ?? [];

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["dares", activeCategory] });
    await queryClient.invalidateQueries({ queryKey: ["daily-dare"] });
    await refetch();
  }, [queryClient, activeCategory, refetch]);

  const { pullDistance, isRefreshing, onTouchStart, onTouchMove, onTouchEnd } =
    usePullToRefresh({ onRefresh: handleRefresh });

  return (
    <div
      className="min-h-screen pb-24 pt-4"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance > 0 ? pullDistance : 0 }}
      >
        <motion.div
          animate={{ rotate: isRefreshing ? 360 : (pullDistance / 80) * 360 }}
          transition={isRefreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { duration: 0 }}
        >
          <RefreshCw className={`h-6 w-6 ${pullDistance >= 80 || isRefreshing ? "text-primary" : "text-muted-foreground"}`} />
        </motion.div>
      </div>

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
                transition={{ delay: Math.min(i * 0.05, 0.5) }}
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

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="py-4">
              {isFetchingNextPage && (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              {!hasNextPage && dares.length > 0 && (
                <p className="text-center text-xs text-muted-foreground">Вы просмотрели все вызовы 🔥</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
