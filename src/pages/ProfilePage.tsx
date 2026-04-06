import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, Trophy, Settings, ChevronRight, Crown, LogOut, Loader2, Users, Gift, Share2, Copy, CheckCircle2, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import NotificationToggle from "@/components/NotificationToggle";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showReferrals, setShowReferrals] = useState(false);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.getMe(),
  });

  const { data: refStats } = useQuery({
    queryKey: ["my-referrals"],
    queryFn: () => api.getMyReferrals(),
    enabled: !!user,
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch {
      toast.error("Не удалось выйти");
    }
  };

  const handleCopyRef = () => {
    if (user?.ref_code) {
      navigator.clipboard.writeText(`https://dareloop.ru/join?ref=${user.ref_code}`);
      setCopied(true);
      toast.success("Ссылка скопирована!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!user?.ref_code) return;
    const shareData = {
      title: "DareLoop — вызовы для смелых",
      text: `Присоединяйся к DareLoop! Используй мой реферальный код: ${user.ref_code}`,
      url: `https://dareloop.ru/join?ref=${user.ref_code}`,
    };
    try {
      await navigator.share(shareData);
    } catch {
      handleCopyRef();
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-muted-foreground">Не удалось загрузить профиль</p>
          <button onClick={() => navigate("/auth")} className="mt-3 text-sm text-primary">Войти</button>
        </div>
      </div>
    );
  }

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;

  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="mx-auto max-w-md px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-3xl tracking-wide text-foreground">Профиль</h1>
          <button className="rounded-lg bg-secondary p-2 text-muted-foreground transition-colors hover:text-foreground">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-4"
        >
          <div className="relative">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/50" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary font-display text-3xl text-foreground ring-2 ring-primary/50">
                {(displayName[0] || "?").toUpperCase()}
              </div>
            )}
            {user.is_pro && (
              <div className="absolute -bottom-1 -right-1 gradient-fire flex h-6 w-6 items-center justify-center rounded-full">
                <Crown className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl text-foreground">@{user.username}</h2>
              {user.is_pro && (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">PRO</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{displayName} · {user.city || "—"}</p>
          </div>
        </motion.div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { icon: Zap, value: (user.points ?? 0).toLocaleString(), label: "Очки", color: "text-streak" },
            { icon: Flame, value: user.streak ?? 0, label: "Стрик", color: "text-primary" },
            { icon: Trophy, value: user.completed_dares ?? 0, label: "Выполнено", color: "text-success" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="gradient-card rounded-xl border border-border p-3 text-center"
            >
              <stat.icon className={`mx-auto mb-1 h-5 w-5 ${stat.color}`} />
              <div className="font-display text-2xl text-foreground">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {user.ref_code && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <span className="font-display text-sm tracking-wider text-foreground">РЕФЕРАЛЫ</span>
              </div>
              {refStats && (
                <span className="text-xs text-muted-foreground">
                  +{refStats.total_earned} очков заработано
                </span>
              )}
            </div>

            {/* Stats row */}
            {refStats && (
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
                  <div className="font-display text-xl text-foreground">{refStats.total_referrals}</div>
                  <div className="text-[10px] text-muted-foreground">Приглашено</div>
                </div>
                <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
                  <div className="font-display text-xl text-streak">{refStats.total_earned}</div>
                  <div className="text-[10px] text-muted-foreground">Очки</div>
                </div>
              </div>
            )}

            {/* Ref code */}
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2">
              <span className="flex-1 font-mono text-sm tracking-widest text-foreground">{user.ref_code}</span>
              <button onClick={handleCopyRef} className="rounded-md bg-primary/20 p-1.5 text-primary transition-colors hover:bg-primary/30">
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
              <button onClick={handleShare} className="rounded-md bg-primary/20 p-1.5 text-primary transition-colors hover:bg-primary/30">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Ты: +200 очков за регистрацию + 100 за первый вызов друга. Друг: +100 очков
            </p>

            {/* Referral list */}
            {refStats && refStats.referrals.length > 0 && (
              <>
                <button
                  onClick={() => setShowReferrals(!showReferrals)}
                  className="mb-2 flex w-full items-center justify-between text-xs text-primary"
                >
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Приглашённые ({refStats.referrals.length})
                  </span>
                  <ChevronRight className={`h-3 w-3 transition-transform ${showReferrals ? "rotate-90" : ""}`} />
                </button>
                <AnimatePresence>
                  {showReferrals && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="flex flex-col gap-2 overflow-hidden"
                    >
                      {refStats.referrals.map((ref) => (
                        <div key={ref.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground">
                              {ref.username[0].toUpperCase()}
                            </div>
                            <div>
                              <span className="text-sm text-foreground">@{ref.username}</span>
                              <p className="text-[10px] text-muted-foreground">{ref.joined_at}</p>
                            </div>
                          </div>
                          {ref.bonus_paid ? (
                            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] text-success">+300</span>
                          ) : (
                            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] text-warning">+200</span>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        )}

        <NotificationToggle />

        <div className="mt-2 flex flex-col gap-2">
          {[
            { label: "Активные вызовы", value: `${user.active_dares ?? 0}/3` },
            { label: "Мои вызовы", value: "" },
          ].map((item) => (
            <button
              key={item.label}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left text-foreground transition-colors hover:bg-secondary"
            >
              <span className="text-sm font-medium">{item.label}</span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {item.value && <span>{item.value}</span>}
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left text-destructive transition-colors hover:bg-secondary"
          >
            <span className="text-sm font-medium">Выйти</span>
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
