import { motion } from "framer-motion";
import { Flame, Clock, Zap, Shield, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";

interface DareCardProps {
  id?: number;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  reward: number;
  timeLeft?: string;
  author?: string;
}

const difficultyConfig = {
  easy: { label: "Лёгкий", color: "text-success", bg: "bg-success/10", border: "border-success/20" },
  medium: { label: "Средний", color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
  hard: { label: "Хард", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
};

const DareCard = ({ id, title, description, category, difficulty, reward, timeLeft, author }: DareCardProps) => {
  const diff = difficultyConfig[difficulty];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id || accepting) return;
    setAccepting(true);
    try {
      await api.acceptDare(id);
      toast.success("Вызов принят!");
      queryClient.invalidateQueries({ queryKey: ["dares"] });
      navigate(`/dare/${id}`);
    } catch (err: any) {
      toast.error(err.message || "Не удалось принять вызов");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/dare/${id || 1}`)}
      className="gradient-card cursor-pointer rounded-xl border border-border p-4 shadow-card"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          {category}
        </span>
        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${diff.color} ${diff.bg} border ${diff.border}`}>
          {difficulty === "hard" && <Shield className="h-3 w-3" />}
          {diff.label}
        </span>
      </div>

      <h3 className="mb-1 font-display text-xl tracking-wide text-foreground">{title}</h3>
      <p className="mb-3 text-sm leading-relaxed text-muted-foreground line-clamp-2">{description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-sm font-semibold text-streak">
            <Zap className="h-4 w-4" />+{reward}
          </span>
          {timeLeft && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />{timeLeft}
            </span>
          )}
        </div>
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="gradient-fire flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Принять <ChevronRight className="h-4 w-4" /></>}
        </button>
      </div>

      {author && (
        <div className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
          от @{author}
        </div>
      )}
    </motion.div>
  );
};

export default DareCard;
