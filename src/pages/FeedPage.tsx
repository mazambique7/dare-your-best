import { motion } from "framer-motion";
import { Flame, Zap } from "lucide-react";
import DailyDare from "@/components/DailyDare";
import DareCard from "@/components/DareCard";

const mockDares = [
  { id: 1, title: "Заговори с незнакомцем", description: "Подойди к случайному человеку в кафе и задай необычный вопрос. Сними реакцию!", category: "Социальное", difficulty: "easy" as const, reward: 100, timeLeft: "23ч", author: "daredevil" },
  { id: 2, title: "Ледяной душ 3 минуты", description: "Запиши полное видео ледяного душа. Без пауз и монтажа.", category: "Физическое", difficulty: "medium" as const, reward: 200, timeLeft: "47ч", author: "iceman" },
  { id: 3, title: "Открытый микрофон", description: "Выступи со стендапом на открытом микрофоне в любом баре города.", category: "Социальное", difficulty: "hard" as const, reward: 300, timeLeft: "71ч", author: "comedian" },
  { id: 4, title: "Пробежка 5км", description: "Пробеги 5 километров и запиши GPS-трек + видео финиша.", category: "Спорт", difficulty: "easy" as const, reward: 100, timeLeft: "23ч" },
  { id: 5, title: "Готовь новое блюдо", description: "Приготовь блюдо кухни, которую никогда не пробовал. Покажи процесс!", category: "Творчество", difficulty: "medium" as const, reward: 200, timeLeft: "47ч", author: "chef_mode" },
];

const FeedPage = () => {
  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="mx-auto max-w-md px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-wide text-foreground">DareLoop</h1>
            <p className="text-sm text-muted-foreground">Прими вызов. Докажи.</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5">
            <Flame className="h-4 w-4 text-streak" />
            <span className="font-display text-lg text-streak">7</span>
          </div>
        </div>

        {/* Daily */}
        <div className="mb-6">
          <DailyDare />
        </div>

        {/* Category pills */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {["Все", "Социальное", "Спорт", "Физическое", "Творчество"].map((cat, i) => (
            <button
              key={cat}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                i === 0
                  ? "gradient-fire text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="flex flex-col gap-3">
          {mockDares.map((dare, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <DareCard {...dare} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
