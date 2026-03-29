import { motion } from "framer-motion";
import { Flame, Clock, Zap, Shield, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

const DareCard = ({ title, description, category, difficulty, reward, timeLeft, author }: DareCardProps) => {
  const diff = difficultyConfig[difficulty];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className="gradient-card rounded-xl border border-border p-4 shadow-card"
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
        <button className="gradient-fire flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 active:scale-95">
          Принять <ChevronRight className="h-4 w-4" />
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
