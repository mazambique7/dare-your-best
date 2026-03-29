import { motion } from "framer-motion";
import { Flame, Zap, Trophy, Settings, ChevronRight, Crown, Shield } from "lucide-react";

const ProfilePage = () => {
  const user = {
    username: "daredevil",
    firstName: "Алексей",
    lastName: "К.",
    city: "Москва",
    points: 4200,
    streak: 23,
    completedDares: 47,
    activeDares: 2,
    isPro: true,
    refCode: "DARE8X4Q",
  };

  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="mx-auto max-w-md px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-3xl tracking-wide text-foreground">Профиль</h1>
          <button className="rounded-lg bg-secondary p-2 text-muted-foreground transition-colors hover:text-foreground">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Avatar + info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-4"
        >
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary font-display text-3xl text-foreground ring-2 ring-primary/50">
              {user.firstName[0]}
            </div>
            {user.isPro && (
              <div className="absolute -bottom-1 -right-1 gradient-fire flex h-6 w-6 items-center justify-center rounded-full">
                <Crown className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl text-foreground">@{user.username}</h2>
              {user.isPro && (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">PRO</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{user.firstName} {user.lastName} · {user.city}</p>
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { icon: Zap, value: user.points.toLocaleString(), label: "Очки", color: "text-streak" },
            { icon: Flame, value: user.streak, label: "Стрик", color: "text-primary" },
            { icon: Trophy, value: user.completedDares, label: "Выполнено", color: "text-success" },
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

        {/* Ref code */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4"
        >
          <div className="mb-1 text-xs font-medium text-primary">Реферальный код</div>
          <div className="flex items-center justify-between">
            <span className="font-display text-xl tracking-widest text-foreground">{user.refCode}</span>
            <button className="rounded-lg bg-primary/20 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/30">
              Копировать
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Друг получит бонус, ты — +200 очков</p>
        </motion.div>

        {/* Menu items */}
        <div className="flex flex-col gap-2">
          {[
            { label: "Активные вызовы", value: `${user.activeDares}/3` },
            { label: "Мои вызовы", value: "" },
            { label: "Подписка Pro", value: "Активна" },
            { label: "Выйти", value: "", danger: true },
          ].map((item) => (
            <button
              key={item.label}
              className={`flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary ${
                (item as any).danger ? "text-destructive" : "text-foreground"
              }`}
            >
              <span className="text-sm font-medium">{item.label}</span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {item.value && <span>{item.value}</span>}
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
