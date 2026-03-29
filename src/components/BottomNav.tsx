import { Flame, Trophy, User, Compass, Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { icon: Compass, label: "Лента", path: "/" },
  { icon: Trophy, label: "Топ", path: "/leaderboard" },
  { icon: Plus, label: "", path: "/create", isCenter: true },
  { icon: Flame, label: "Стрик", path: "/streak" },
  { icon: User, label: "Профиль", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg pb-safe">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="gradient-fire -mt-6 flex h-14 w-14 items-center justify-center rounded-full shadow-glow transition-transform hover:scale-105 active:scale-95"
              >
                <Icon className="h-7 w-7 text-primary-foreground" />
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
