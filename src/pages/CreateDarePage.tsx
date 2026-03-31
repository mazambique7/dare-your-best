import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Shield, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

const categories = ["Социальное", "Спорт", "Физическое", "Творчество", "Экстрим"];
const difficulties = [
  { value: "easy", label: "Лёгкий", reward: 100, desc: "24 часа" },
  { value: "medium", label: "Средний", reward: 200, desc: "48 часов" },
  { value: "hard", label: "Хард", reward: 300, desc: "72 часа · PRO" },
];

const CreateDarePage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDiff, setSelectedDiff] = useState("easy");
  const [selectedCat, setSelectedCat] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      api.createDare({
        title,
        description,
        category: selectedCat,
        difficulty: selectedDiff,
      }),
    onSuccess: () => {
      toast.success("Вызов создан!");
      navigate("/");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Ошибка при создании");
    },
  });

  const canSubmit = title.trim() && description.trim() && selectedCat;

  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="mx-auto max-w-md px-4">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>

        <h1 className="mb-1 font-display text-3xl tracking-wide text-foreground">Создать вызов</h1>
        <p className="mb-6 text-sm text-muted-foreground">Брось вызов сообществу</p>

        <div className="flex flex-col gap-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Название</label>
            <input
              type="text"
              placeholder="Что нужно сделать?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Описание</label>
            <textarea
              rows={3}
              placeholder="Подробности и правила..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Категория</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedCat === cat
                      ? "gradient-fire text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Сложность</label>
            <div className="flex flex-col gap-2">
              {difficulties.map((diff) => (
                <button
                  key={diff.value}
                  onClick={() => setSelectedDiff(diff.value)}
                  className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                    selectedDiff === diff.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {diff.value === "hard" && <Shield className="h-5 w-5 text-primary" />}
                    <div>
                      <div className="text-sm font-medium text-foreground">{diff.label}</div>
                      <div className="text-xs text-muted-foreground">{diff.desc}</div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 font-display text-lg text-streak">
                    <Zap className="h-4 w-4" />+{diff.reward}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit || createMutation.isPending}
            className="gradient-fire w-full rounded-xl py-3.5 font-display text-lg tracking-wider text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createMutation.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
            СОЗДАТЬ ВЫЗОВ
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default CreateDarePage;
