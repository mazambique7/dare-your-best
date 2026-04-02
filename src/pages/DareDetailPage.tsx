import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ThumbsUp, ThumbsDown, Zap, Shield,
  Play, Share2, MessageCircle, Send, MoreVertical, Loader2,
  Upload, Video, X, CheckCircle2, Camera, Image
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const difficultyConfig = {
  easy: { label: "Лёгкий", color: "text-success", bg: "bg-success/10" },
  medium: { label: "Средний", color: "text-warning", bg: "bg-warning/10" },
  hard: { label: "Хард", color: "text-primary", bg: "bg-primary/10" },
};

const DareDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const dareId = Number(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [userVote, setUserVote] = useState<"yes" | "no" | null>(null);
  const [commentText, setCommentText] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ─── Queries ───────────────────────────────────
  const { data: dare, isLoading: dareLoading, error: dareError } = useQuery({
    queryKey: ["dare", dareId],
    queryFn: () => api.getDare(dareId),
    enabled: !!dareId,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions", dareId],
    queryFn: () => api.getSubmissions(dareId),
    enabled: !!dareId,
  });

  const sub = submissions[0]; // Show first submission

  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ["comments", sub?.id],
    queryFn: () => api.getComments(sub.id),
    enabled: !!sub?.id,
  });

  // ─── Mutations ─────────────────────────────────
  const voteMutation = useMutation({
    mutationFn: ({ submissionId, type }: { submissionId: number; type: "yes" | "no" }) =>
      api.vote(submissionId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions", dareId] });
    },
    onError: (err: Error) => {
      toast({ title: "Ошибка голосования", description: err.message, variant: "destructive" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ submissionId, text }: { submissionId: number; text: string }) =>
      api.addComment(submissionId, text),
    onSuccess: () => {
      setCommentText("");
      refetchComments();
    },
    onError: (err: Error) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  // Submit video mutation
  const submitMutation = useMutation({
    mutationFn: (file: File) => api.submitDare(dareId, file),
    onSuccess: () => {
      toast({ title: "Доказательство загружено!", description: "Ожидай голосования сообщества" });
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ["submissions", dareId] });
    },
    onError: (err: Error) => {
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
      setUploadProgress(0);
    },
  });

  const isVideo = (file: File) => file.type.startsWith("video/");
  const isImage = (file: File) => file.type.startsWith("image/");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isVideo(file) && !isImage(file)) {
      toast({ title: "Неподдерживаемый формат", description: "Загрузи фото или видео (mp4, mov, webm, jpg, png)", variant: "destructive" });
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "Файл слишком большой", description: "Максимум 100 МБ", variant: "destructive" });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    setUploadProgress(10);
    // Simulate progress while uploading
    const interval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 8, 90));
    }, 300);
    submitMutation.mutate(selectedFile, {
      onSettled: () => clearInterval(interval),
    });
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleVote = (type: "yes" | "no") => {
    if (!sub) return;
    if (userVote === type) {
      setUserVote(null);
      return;
    }
    setUserVote(type);
    voteMutation.mutate({ submissionId: sub.id, type });
  };

  const handleComment = () => {
    if (!commentText.trim() || !sub) return;
    commentMutation.mutate({ submissionId: sub.id, text: commentText });
  };

  // ─── Loading / Error ──────────────────────────
  if (dareLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (dareError || !dare) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">Не удалось загрузить вызов</p>
        <button onClick={() => navigate(-1)} className="text-primary hover:underline">
          ← Назад
        </button>
      </div>
    );
  }

  const diff = difficultyConfig[dare.difficulty as keyof typeof difficultyConfig] ?? difficultyConfig.easy;
  const votesYes = sub?.votes_yes ?? sub?.votesYes ?? 0;
  const votesNo = sub?.votes_no ?? sub?.votesNo ?? 0;
  const totalVotes = votesYes + votesNo;
  const yesPercent = totalVotes > 0 ? Math.round((votesYes / totalVotes) * 100) : 50;

  const visibleComments = showAllComments ? comments : comments.slice(0, 3);

  return (
    <div className="min-h-screen pb-24">
      {/* Video player area */}
      <div className="relative aspect-[9/12] w-full max-h-[60vh] bg-card overflow-hidden">
        {sub?.media_url ? (
          <video
            src={sub.media_url}
            controls
            className="absolute inset-0 h-full w-full object-cover"
            playsInline
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-muted/20 to-card">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/80 backdrop-blur-sm">
                <Play className="h-8 w-8 text-foreground ml-1" />
              </div>
              <p className="text-sm text-muted-foreground">
                {sub ? "Видео-доказательство" : "Пока нет доказательств"}
              </p>
            </div>
          </div>
        )}

        {/* Top bar */}
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

        {/* Submitter info */}
        {sub && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/80 to-transparent p-4 pt-12">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-display text-lg text-foreground">
                {(sub.user?.username ?? sub.username ?? "?")[0].toUpperCase()}
              </div>
              <div>
                <span className="text-sm font-medium text-foreground">
                  @{sub.user?.username ?? sub.username ?? "—"}
                </span>
                <p className="text-xs text-muted-foreground">
                  {sub.created_at ? new Date(sub.created_at).toLocaleDateString("ru-RU") : ""}
                </p>
              </div>
            </div>
          </div>
        )}
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
              <Zap className="h-3.5 w-3.5" />+{dare.reward ?? difficultyConfig[dare.difficulty as keyof typeof difficultyConfig]?.label === "Хард" ? 300 : dare.difficulty === "medium" ? 200 : 100}
            </span>
          </div>

          <h1 className="mb-2 font-display text-2xl tracking-wide text-foreground">{dare.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{dare.description}</p>

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            {dare.author?.username && <span>от @{dare.author.username}</span>}
            {dare.created_at && (
              <>
                <span>·</span>
                <span>{new Date(dare.created_at).toLocaleDateString("ru-RU")}</span>
              </>
            )}
          </div>
        </div>

        {/* Voting section — only if submission exists */}
        {sub && (
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
                <ThumbsUp className="h-4 w-4" /> {votesYes} ({yesPercent}%)
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <ThumbsDown className="h-4 w-4" /> {votesNo} ({100 - yesPercent}%)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleVote("yes")}
                disabled={voteMutation.isPending}
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
                disabled={voteMutation.isPending}
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
        )}

        {/* Comments section */}
        {sub && (
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
                  disabled={!commentText.trim() || commentMutation.isPending}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-primary transition-colors disabled:text-muted-foreground"
                >
                  {commentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Comments list */}
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {visibleComments.map((comment: any, i: number) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">
                      {(comment.user?.username ?? comment.username ?? "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          @{comment.user?.username ?? comment.username ?? "—"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {comment.created_at ? new Date(comment.created_at).toLocaleDateString("ru-RU") : ""}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm leading-relaxed text-secondary-foreground">{comment.text}</p>
                      <div className="mt-1 flex items-center gap-3">
                        <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                          <ThumbsUp className="h-3 w-3" /> {comment.likes ?? 0}
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
        )}

        {/* Upload section — show when user can submit */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4 rounded-xl border border-border bg-card p-4"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!selectedFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-8 transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Camera className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-display text-sm tracking-wider text-foreground">
                  {sub ? "ЗАГРУЗИТЬ ЕЩЁ" : "ЗАГРУЗИТЬ ДОКАЗАТЕЛЬСТВО"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Фото или видео до 100 МБ
                </p>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              {/* Preview */}
              <div className="relative overflow-hidden rounded-lg">
                {selectedFile && isVideo(selectedFile) ? (
                  <video
                    src={previewUrl!}
                    className="h-48 w-full rounded-lg object-cover"
                    playsInline
                    muted
                    autoPlay
                    loop
                  />
                ) : (
                  <img
                    src={previewUrl!}
                    alt="Превью"
                    className="h-48 w-full rounded-lg object-cover"
                  />
                )}
                <button
                  onClick={clearSelection}
                  disabled={submitMutation.isPending}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-colors hover:bg-background"
                >
                  <X className="h-4 w-4 text-foreground" />
                </button>
                <div className="absolute bottom-2 left-2 rounded-lg bg-background/80 px-2 py-1 backdrop-blur-sm">
                  <span className="text-xs text-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} МБ
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              {submitMutation.isPending && (
                <div className="space-y-1">
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      className="h-full rounded-full gradient-fire"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-center text-xs text-muted-foreground">Загружаю... {uploadProgress}%</p>
                </div>
              )}

              {/* Upload button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleUpload}
                disabled={submitMutation.isPending}
                className="flex w-full items-center justify-center gap-2 gradient-fire rounded-xl py-3 font-display text-sm tracking-wider text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {submitMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    ОТПРАВИТЬ НА ПРОВЕРКУ
                  </>
                )}
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DareDetailPage;
