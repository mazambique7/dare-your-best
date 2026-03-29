import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ThumbsUp, ThumbsDown, Clock, Zap, Shield, Flame,
  Play, Pause, Share2, Flag, MessageCircle, Send, User, MoreVertical
} from "lucide-react";

// Mock data — will be replaced with API calls
const mockDare = {
  id: 1,
  title: "Заговори с незнакомцем",
  description: "Подойди к случайному человеку в кафе и задай необычный вопрос. Сними реакцию! Видео должно быть не менее 30 секунд. Лицо собеседника можно заблюрить.",
  category: "Социальное",
  difficulty: "easy" as const,
  reward: 100,
  author: { username: "daredevil", points: 4200, streak: 23 },
  createdAt: "2 часа назад",
  submission: {
    id: 1,
    mediaUrl: "",
    status: "pending" as const,
    votesYes: 7,
    votesNo: 2,
    createdAt: "45 мин назад",
    user: { username: "brave_one", avatar: "" },
  },
};

const mockComments = [
  { id: 1, user: "iceman", text: "Огонь! Реакция незнакомца — бесценно 😂", time: "30 мин назад", likes: 5 },
  { id: 2, user: "chef_mode", text: "Я бы так не смог, респект!", time: "20 мин назад", likes: 3 },
  { id: 3, user: "runner_x", text: "Засчитано однозначно 🔥", time: "10 мин назад", likes: 8 },
  { id: 4, user: "comedian", text: "В следующий раз попробуй в метро, вообще хардкор будет", time: "5 мин назад", likes: 1 },
];

const difficultyConfig = {
  easy: { label: "Лёгкий", color: "text-success", bg: "bg-success/10" },
  medium: { label: "Средний", color: "text-warning", bg: "bg-warning/10" },
  hard: { label: "Хард", color: "text-primary", bg: "bg-primary/10" },
};

const DareDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [userVote, setUserVote] = useState<"yes" | "no" | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(mockComments);
  const [showAllComments, setShowAllComments] = useState(false);

  const dare = mockDare;
  const diff = difficultyConfig[dare.difficulty];
  const sub = dare.submission;
  const totalVotes = sub.votesYes + sub.votesNo;
  const yesPercent = totalVotes > 0 ? Math.round((sub.votesYes / totalVotes) * 100) : 50;

  const handleVote = (type: "yes" | "no") => {
    if (userVote === type) {
      setUserVote(null);
    } else {
      setUserVote(type);
    }
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    setComments([
      ...comments,
      { id: Date.now(), user: "you", text: commentText, time: "Только что", likes: 0 },
    ]);
    setCommentText("");
  };

  const visibleComments = showAllComments ? comments : comments.slice(0, 3);

  return (
    <div className="min-h-screen pb-24">
      {/* Video player area */}
      <div className="relative aspect-[9/12] w-full max-h-[60vh] bg-card overflow-hidden">
        {/* Placeholder for video */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-muted/20 to-card">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/80 backdrop-blur-sm">
              <Play className="h-8 w-8 text-foreground ml-1" />
            </div>
            <p className="text-sm text-muted-foreground">Видео-доказательство</p>
          </div>
        </div>

        {/* Top bar overlay */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between bg-gradient-to-b from-background/80 to-transparent p-4 pt-6">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/80 backdrop-blur-sm"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/80 backdrop-blur-sm">
              <Share2 className="h-4 w-4 text-foreground" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/80 backdrop-blur-sm">
              <MoreVertical className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* Submitter info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/80 to-transparent p-4 pt-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-display text-lg text-foreground">
              {sub.user.username[0].toUpperCase()}
            </div>
            <div>
              <span className="text-sm font-medium text-foreground">@{sub.user.username}</span>
              <p className="text-xs text-muted-foreground">{sub.createdAt}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-md px-4">
        {/* Dare info */}
        <div className="py-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {dare.category}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${diff.color} ${diff.bg}`}>
              {diff.label}
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold text-streak">
              <Zap className="h-3.5 w-3.5" />+{dare.reward}
            </span>
          </div>

          <h1 className="mb-2 font-display text-2xl tracking-wide text-foreground">{dare.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{dare.description}</p>

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>от @{dare.author.username}</span>
            <span>·</span>
            <span>{dare.createdAt}</span>
          </div>
        </div>

        {/* Voting section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 rounded-xl border border-border bg-card p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-sm tracking-wider text-foreground">ГОЛОСОВАНИЕ</span>
            <span className="text-xs text-muted-foreground">{totalVotes} голосов</span>
          </div>

          {/* Vote bar */}
          <div className="mb-4 h-3 overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${yesPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-success"
            />
          </div>

          <div className="mb-4 flex justify-between text-sm">
            <span className="flex items-center gap-1 text-success">
              <ThumbsUp className="h-4 w-4" /> {sub.votesYes} ({yesPercent}%)
            </span>
            <span className="flex items-center gap-1 text-destructive">
              <ThumbsDown className="h-4 w-4" /> {sub.votesNo} ({100 - yesPercent}%)
            </span>
          </div>

          {/* Vote buttons */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVote("yes")}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 font-display text-sm tracking-wider transition-all ${
                userVote === "yes"
                  ? "bg-success text-primary-foreground shadow-lg"
                  : "border border-success/30 bg-success/10 text-success hover:bg-success/20"
              }`}
            >
              <ThumbsUp className="h-5 w-5" /> ЗАСЧИТАНО
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVote("no")}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 font-display text-sm tracking-wider transition-all ${
                userVote === "no"
                  ? "bg-destructive text-primary-foreground shadow-lg"
                  : "border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
              }`}
            >
              <ThumbsDown className="h-5 w-5" /> НЕ СЧИТАЕТСЯ
            </motion.button>
          </div>
        </motion.div>

        {/* Comments section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <span className="font-display text-sm tracking-wider text-foreground">
              КОММЕНТАРИИ ({comments.length})
            </span>
          </div>

          {/* Comment input */}
          <div className="mb-4 flex gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-sm text-foreground">
              Y
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                placeholder="Написать комментарий..."
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-primary transition-colors disabled:text-muted-foreground"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Comments list */}
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {visibleComments.map((comment, i) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-2.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">
                    {comment.user[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">@{comment.user}</span>
                      <span className="text-[10px] text-muted-foreground">{comment.time}</span>
                    </div>
                    <p className="mt-0.5 text-sm leading-relaxed text-secondary-foreground">{comment.text}</p>
                    <div className="mt-1 flex items-center gap-3">
                      <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                        <ThumbsUp className="h-3 w-3" /> {comment.likes}
                      </button>
                      <button className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                        Ответить
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {comments.length > 3 && !showAllComments && (
            <button
              onClick={() => setShowAllComments(true)}
              className="mt-3 w-full text-center text-sm font-medium text-primary hover:underline"
            >
              Показать все {comments.length} комментариев
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DareDetailPage;
