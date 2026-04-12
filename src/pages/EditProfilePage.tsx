import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Camera, Loader2, CheckCircle2, Eye, EyeOff
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);

  const avatarMutation = useMutation({
    mutationFn: (file: File) => api.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      refreshUser();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, any>) => api.updateUser(data),
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success("Профиль обновлён");
    },
    onError: (err: Error) => toast.error(err.message || "Ошибка сохранения"),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Максимум 5 МБ");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    // Upload avatar first if changed
    if (avatarFile) {
      await avatarMutation.mutateAsync(avatarFile);
    }

    const data: Record<string, any> = {};
    if (firstName !== user?.first_name) data.first_name = firstName;
    if (lastName !== user?.last_name) data.last_name = lastName;
    if (username !== user?.username) data.username = username;
    if (city !== user?.city) data.city = city;
    if (phone !== user?.phone) data.phone = phone;
    if (newPassword) {
      data.current_password = currentPassword;
      data.new_password = newPassword;
    }

    if (Object.keys(data).length > 0) {
      updateMutation.mutate(data);
    } else if (avatarFile) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success("Аватар обновлён");
    } else {
      toast.info("Нет изменений");
    }
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.username ||
    "?";

  const isPending = updateMutation.isPending || avatarMutation.isPending;

  return (
    <div className="min-h-screen pb-24 pt-4">
      <div className="mx-auto max-w-md px-4">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-3xl tracking-wide text-foreground">
            Редактировать
          </h1>
        </div>

        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="relative">
            <div
              className="relative cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview || user?.avatar ? (
                <img
                  src={avatarPreview || user!.avatar}
                  alt=""
                  className="h-24 w-24 rounded-full object-cover ring-2 ring-primary/50"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary font-display text-4xl text-foreground ring-2 ring-primary/50">
                  {(displayName[0] || "?").toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full gradient-fire shadow-glow">
                <Camera className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Нажми на фото чтобы сменить
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col gap-4"
        >
          {/* Name row */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Имя и фамилия
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Имя"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Фамилия"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Username
            </label>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
              className={inputClass}
            />
          </div>

          {/* City */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Город
            </label>
            <input
              type="text"
              placeholder="Москва"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Телефон
            </label>
            <input
              type="tel"
              placeholder="+7 999 000 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Password change */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Сменить пароль
            </p>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type={showCurrentPw ? "text" : "password"}
                  placeholder="Текущий пароль"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  placeholder="Новый пароль (мин. 6 символов)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Save button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={isPending}
            className="mt-2 flex w-full items-center justify-center gap-2 gradient-fire rounded-xl py-3.5 font-display text-lg tracking-wider text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : saved ? (
              <>
                <CheckCircle2 className="h-5 w-5" /> СОХРАНЕНО
              </>
            ) : (
              "СОХРАНИТЬ"
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default EditProfilePage;
