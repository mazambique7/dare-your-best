import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { isPushSupported, isSubscribed, subscribeToPush, unsubscribeFromPush, getPermissionState } from "@/lib/push";
import { toast } from "sonner";

const NotificationToggle = () => {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const check = async () => {
      const sup = isPushSupported();
      setSupported(sup);
      if (sup) {
        const [sub, perm] = await Promise.all([isSubscribed(), getPermissionState()]);
        setSubscribed(sub);
        setPermission(perm);
      }
      setLoading(false);
    };
    check();
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
        toast.success("Уведомления отключены");
      } else {
        const sub = await subscribeToPush();
        if (sub) {
          setSubscribed(true);
          toast.success("Уведомления включены! 🔔");
        } else {
          const perm = await getPermissionState();
          setPermission(perm);
          if (perm === "denied") {
            toast.error("Уведомления заблокированы в настройках браузера");
          } else {
            toast.error("Не удалось подписаться на уведомления");
          }
        }
      }
    } catch {
      toast.error("Ошибка при настройке уведомлений");
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 opacity-50">
        <div className="flex items-center gap-3">
          <BellOff className="h-5 w-5 text-muted-foreground" />
          <div>
            <span className="text-sm font-medium text-foreground">Уведомления</span>
            <p className="text-xs text-muted-foreground">Не поддерживаются браузером</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading || permission === "denied"}
      className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary disabled:opacity-60"
    >
      <div className="flex items-center gap-3">
        {subscribed ? (
          <Bell className="h-5 w-5 text-primary" />
        ) : (
          <BellOff className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <span className="text-sm font-medium text-foreground">Push-уведомления</span>
          <p className="text-xs text-muted-foreground">
            {permission === "denied"
              ? "Заблокированы в настройках браузера"
              : subscribed
              ? "Стрик, новые вызовы, голоса"
              : "Напоминания о стрике и новых вызовах"}
          </p>
        </div>
      </div>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <motion.div
          className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
            subscribed ? "bg-primary" : "bg-secondary"
          }`}
          initial={false}
        >
          <motion.div
            className="h-5 w-5 rounded-full bg-foreground shadow-sm"
            animate={{ x: subscribed ? 18 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </motion.div>
      )}
    </button>
  );
};

export default NotificationToggle;
