import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ background: "linear-gradient(180deg, hsl(240 10% 8%), hsl(240 10% 4%))" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl gradient-fire shadow-glow">
            <Flame className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl tracking-wide text-foreground">DareLoop</h1>
          <p className="mt-1 text-sm text-muted-foreground">Прими вызов. Докажи. Повтори.</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex rounded-xl bg-secondary p-1">
          {[{ label: "Вход", val: true }, { label: "Регистрация", val: false }].map((tab) => (
            <button
              key={tab.label}
              onClick={() => setIsLogin(tab.val)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                isLogin === tab.val
                  ? "gradient-fire text-primary-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Имя"
                  className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Фамилия"
                  className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <input
                type="text"
                placeholder="Username"
                className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <input
                type="tel"
                placeholder="Телефон"
                className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <input
                type="text"
                placeholder="Город"
                className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </>
          )}

          {isLogin && (
            <input
              type="text"
              placeholder="Username или телефон"
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          )}

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Пароль"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {!isLogin && (
            <input
              type="text"
              placeholder="Реферальный код (необязательно)"
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/")}
            className="mt-2 gradient-fire w-full rounded-xl py-3.5 font-display text-lg tracking-wider text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
          >
            {isLogin ? "ВОЙТИ" : "СОЗДАТЬ АККАУНТ"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
