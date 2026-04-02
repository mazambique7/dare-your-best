import { motion } from "framer-motion";
import { Flame, Zap, Trophy, Settings, ChevronRight, Crown, LogOut, Loader2, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import NotificationToggle from "@/components/NotificationToggle";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.getMe(),
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
      navigator.clipboard.writeText(user.ref_code);
      toast.success("Код скопирован!");
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
            <div className="mb-1 text-xs font-medium text-primary">Реферальный код</div>
            <div className="flex items-center justify-between">
              <span className="font-display text-xl tracking-widest text-foreground">{user.ref_code}</span>
              <button onClick={handleCopyRef} className="rounded-lg bg-primary/20 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/30">
                Копировать
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Друг получит бонус, ты — +200 очков</p>
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
