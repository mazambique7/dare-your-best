import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import PageTransition from "@/components/PageTransition";
import FeedPage from "./pages/FeedPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import StreakPage from "./pages/StreakPage";
import AchievementsPage from "./pages/AchievementsPage";
import CreateDarePage from "./pages/CreateDarePage";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import DareDetailPage from "./pages/DareDetailPage";
import HistoryPage from "./pages/HistoryPage";
import EditProfilePage from "./pages/EditProfilePage";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

const hasOnboarded = () => localStorage.getItem("dareloop_onboarded") === "true";

const AppLayout = () => {
  const location = useLocation();
  const hideNav = ["/auth", "/onboarding"].includes(location.pathname);
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/onboarding" element={<PageTransition><OnboardingPage /></PageTransition>} />
          <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
          <Route path="/" element={<OnboardingGuard><PageTransition><FeedPage /></PageTransition></OnboardingGuard>} />
          <Route path="/leaderboard" element={<OnboardingGuard><PageTransition><LeaderboardPage /></PageTransition></OnboardingGuard>} />
          <Route path="/profile" element={<OnboardingGuard><PageTransition><ProfilePage /></PageTransition></OnboardingGuard>} />
          <Route path="/profile/edit" element={<OnboardingGuard><PageTransition><EditProfilePage /></PageTransition></OnboardingGuard>} />
          <Route path="/streak" element={<OnboardingGuard><PageTransition><StreakPage /></PageTransition></OnboardingGuard>} />
          <Route path="/create" element={<OnboardingGuard><PageTransition><CreateDarePage /></PageTransition></OnboardingGuard>} />
          <Route path="/achievements" element={<OnboardingGuard><PageTransition><AchievementsPage /></PageTransition></OnboardingGuard>} />
          <Route path="/history" element={<OnboardingGuard><PageTransition><HistoryPage /></PageTransition></OnboardingGuard>} />
          <Route path="/dare/:id" element={<OnboardingGuard><PageTransition><DareDetailPage /></PageTransition></OnboardingGuard>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
      {!hideNav && <BottomNav />}
    </>
  );
};

const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  if (!hasOnboarded()) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
