import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock,
  Zap, ThumbsUp, ThumbsDown, Loader2, Play, Image
} from "lucide-react";
import api from "@/lib/api";

const statusConfig = {
  approved: {
    label: "Засчитано",
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20",
  },
  rejected: {
    label: "Не засчитано",
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/20",
  },
  pending: {
    label: "На голосовании",
    icon: Clock,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
  },
};

const difficultyColor: Record<string, string> = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-primary",
};

const filters = [
  { label: "Все", value: "" },
  { label: "Засчитаны", value: "approved" },
  { label: "На голосовании", value: "pending" },
  { label: "Не засчитаны", value: "rejected" },
];

const PAGE_SIZE = 20;

const HistoryPage = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("");

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["history", activeFilter],
      queryFn: ({ pageParam = 0 }) =>
        api.getMyHistory({
          status: activeFilter || undefined,
          offset: pageParam,
          limit: PAGE_SIZE,
        }),
      getNextPageParam: (lastPage, allPages) => {
        const loaded = allPages.reduce((s, p) => s + (p.history?.length ?? 0), 0);
        if (!lastPage.history || lastPage.history.length < PAGE_SIZE) return undefined;
        return loaded;
      },
      initialPageParam: 0,
    });

  const entries = data?.pages.flatMap((p) => p.history ?? []) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="mx-auto max-w-md px-4">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl tracking-wide text-foreground">
              Мои вызовы
            </h1>
            {total > 0 && (
              <p className="text-sm text-muted-foreground">Всего: {total}</p>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === f.value
                  ? "gradient-fire text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-muted-foreground">Не удалось загрузить историю</p>
          </div>
        ) : entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-16 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <Zap className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="font-display text-xl text-muted-foreground">
              {activeFilter ? "Вызовов нет" : "Ты ещё не выполнял вызовов"}
            </p>
            {!activeFilter && (
              <button
                onClick={() => navigate("/")}
                className="gradient-fire rounded-xl px-6 py-3 font-display text-sm tracking-wider text-primary-foreground shadow-glow"
              >
                ПРИНЯТЬ ПЕРВЫЙ ВЫЗОВ
              </button>
            )}
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry: any, i: number) => {
              const status = statusConfig[entry.status as keyof typeof statusConfig] ?? statusConfig.pending;
              const StatusIcon = status.icon;
              const isMedia = entry.media_url;
              const isVideo = isMedia && (entry.media_url.endsWith(".mp4") || entry.media_url.endsWith(".mov") || entry.media_url.endsWith(".webm"));

              return (
                <motion.div
                  key={`${entry.dare_id}-${i}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  onClick={() => navigate(`/dare/${entry.dare_id}`)}
                  className="cursor-pointer rounded-xl border border-border bg-card overflow-hidden transition-colors hover:border-primary/30"
                >
                  {/* Media preview strip */}
                  {isMedia && (
                    <div className="relative h-28 w-full bg-muted overflow-hidden">
                      {isVideo ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                          <Play className="h-8 w-8 text-foreground" />
                        </div>
                      ) : (
                        <img
                          src={entry.media_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                      <div className={`absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.bg} ${status.color} ${status.border} border backdrop-blur-sm`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </div>
                    </div>
                  )}

                  <div className="p-4">
                    {/* Status badge (if no media) */}
                    {!isMedia && (
                      <div className={`mb-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.color} ${status.border}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </div>
                    )}

                    {/* Title & meta */}
                    <h3 className="mb-1 font-display text-lg tracking-wide text-foreground line-clamp-1">
                      {entry.dare_title}
                    </h3>
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-secondary px-2 py-0.5">{entry.category}</span>
                      <span className={`font-medium ${difficultyColor[entry.difficulty] ?? "text-foreground"}`}>
                        {entry.difficulty === "easy" ? "Лёгкий" : entry.difficulty === "medium" ? "Средний" : "Хард"}
                      </span>
                      <span>·</span>
                      <span>{new Date(entry.submitted_at).toLocaleDateString("ru-RU")}</span>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-success">
                          <ThumbsUp className="h-3.5 w-3.5" /> {entry.votes_yes}
                        </span>
                        <span className="flex items-center gap-1 text-destructive">
                          <ThumbsDown className="h-3.5 w-3.5" /> {entry.votes_no}
                        </span>
                      </div>
                      {entry.status === "approved" && entry.points > 0 && (
                        <span className="flex items-center gap-1 font-display text-base font-semibold text-streak">
                          <Zap className="h-4 w-4" />+{entry.points}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Load more */}
            <div className="py-4 text-center">
              {isFetchingNextPage ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
              ) : hasNextPage ? (
                <button
                  onClick={() => fetchNextPage()}
                  className="rounded-full bg-secondary px-6 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-muted"
                >
                  Загрузить ещё
                </button>
              ) : entries.length > 0 ? (
                <p className="text-xs text-muted-foreground">Это все твои вызовы 🔥</p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
