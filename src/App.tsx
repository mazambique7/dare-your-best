import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import FeedPage from "./pages/FeedPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import StreakPage from "./pages/StreakPage";
import CreateDarePage from "./pages/CreateDarePage";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import DareDetailPage from "./pages/DareDetailPage";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

const hasOnboarded = () => localStorage.getItem("dareloop_onboarded") === "true";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const hideNav = ["/auth", "/onboarding"].includes(location.pathname);
  return (
    <>
      {children}
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
          <AppLayout>
            <Routes>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<OnboardingGuard><FeedPage /></OnboardingGuard>} />
              <Route path="/leaderboard" element={<OnboardingGuard><LeaderboardPage /></OnboardingGuard>} />
              <Route path="/profile" element={<OnboardingGuard><ProfilePage /></OnboardingGuard>} />
              <Route path="/streak" element={<OnboardingGuard><StreakPage /></OnboardingGuard>} />
              <Route path="/create" element={<OnboardingGuard><CreateDarePage /></OnboardingGuard>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
