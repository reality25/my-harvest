import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import Community from "./pages/Community";
import CommunityDetail from "./pages/CommunityDetail";
import Toolkit from "./pages/Toolkit";
import FarmManagement from "./pages/FarmManagement";
import FarmAssistant from "./pages/FarmAssistant";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import SearchPage from "./pages/SearchPage";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Experts from "./pages/Experts";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "@/components/ErrorBoundary";
import { initializeApp } from "@/lib/dataService";

initializeApp();

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary module="App">
              <Routes>
                <Route path="/" element={<ErrorBoundary module="Home"><Index /></ErrorBoundary>} />
                <Route path="/marketplace" element={<ErrorBoundary module="Marketplace"><Marketplace /></ErrorBoundary>} />
                <Route path="/community" element={<ErrorBoundary module="Community"><Community /></ErrorBoundary>} />
                <Route path="/community/:id" element={<ErrorBoundary module="CommunityDetail"><CommunityDetail /></ErrorBoundary>} />
                <Route path="/toolkit" element={<ErrorBoundary module="Toolkit"><Toolkit /></ErrorBoundary>} />
                <Route path="/farm" element={<ErrorBoundary module="FarmManagement"><FarmManagement /></ErrorBoundary>} />
                <Route path="/assistant" element={<ErrorBoundary module="FarmAssistant"><FarmAssistant /></ErrorBoundary>} />
                <Route path="/profile" element={<ErrorBoundary module="Profile"><Profile /></ErrorBoundary>} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/search" element={<ErrorBoundary module="Search"><SearchPage /></ErrorBoundary>} />
                <Route path="/notifications" element={<ErrorBoundary module="Notifications"><Notifications /></ErrorBoundary>} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/experts" element={<ErrorBoundary module="Experts"><Experts /></ErrorBoundary>} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
