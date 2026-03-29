import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Video, Users, ChevronRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const slides = [
  {
    icon: Flame,
    title: "ПРИМИ ВЫЗОВ",
    description: "Выбирай челленджи из ленты или создавай свои. Лёгкие, средние, хардкорные — для каждого уровня.",
    color: "from-primary to-orange-500",
  },
  {
    icon: Video,
    title: "СНИМИ ДОКАЗАТЕЛЬСТВО",
    description: "Запиши видео выполнения и загрузи. Никаких отмазок — только реальные действия.",
    color: "from-purple-500 to-primary",
  },
  {
    icon: Users,
    title: "ПОЛУЧИ ОЦЕНКУ",
    description: "Сообщество голосует за твоё видео. Набери голоса — получи очки и сохрани стрик.",
    color: "from-primary to-pink-500",
  },
  {
    icon: Trophy,
    title: "СТАНЬ ЛЕГЕНДОЙ",
    description: "Поднимайся в таблице лидеров, держи стрик и доказывай, что ты не из робких.",
    color: "from-streak to-primary",
  },
];

const OnboardingPage = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const slide = slides[current];
  const isLast = current === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem("dareloop_onboarded", "true");
      navigate("/auth");
    } else {
      setCurrent(current + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("dareloop_onboarded", "true");
    navigate("/auth");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between px-6 py-12" style={{ background: "linear-gradient(180deg, hsl(240 10% 8%), hsl(240 10% 4%))" }}>
      {/* Skip */}
      <div className="w-full max-w-sm text-right">
        <button onClick={handleSkip} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Пропустить
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center text-center"
        >
          <div className={`mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br ${slide.color} shadow-glow`}>
            <slide.icon className="h-14 w-14 text-primary-foreground" />
          </div>
          <h2 className="mb-4 font-display text-4xl tracking-wide text-foreground">{slide.title}</h2>
          <p className="max-w-xs text-base leading-relaxed text-muted-foreground">{slide.description}</p>
        </motion.div>
      </AnimatePresence>

      {/* Bottom */}
      <div className="w-full max-w-sm">
        {/* Dots */}
        <div className="mb-6 flex justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "w-8 gradient-fire" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          className="w-full gradient-fire rounded-xl py-4 font-display text-lg tracking-wider text-primary-foreground shadow-glow flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
        >
          {isLast ? (
            <>
              <Zap className="h-5 w-5" /> НАЧАТЬ
            </>
          ) : (
            <>
              ДАЛЕЕ <ChevronRight className="h-5 w-5" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default OnboardingPage;
