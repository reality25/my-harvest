import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const PUBLIC_PATHS = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/onboarding",
  "/admin/login",
]);

/**
 * Whenever the user is signed in but hasn't finished onboarding, push them
 * into the wizard. The wizard itself is skippable — this gate just makes
 * sure they see it on first sign-in. Once dismissed (or completed), the
 * AuthContext flips `hasCompletedOnboarding` to true and the gate stops
 * redirecting.
 */
const OnboardingGate = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, hasCompletedOnboarding, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (hasCompletedOnboarding) return;
    if (PUBLIC_PATHS.has(location.pathname)) return;
    if (location.pathname.startsWith("/admin")) return;
    navigate("/onboarding", { replace: true });
  }, [isAuthenticated, hasCompletedOnboarding, user, location.pathname, navigate]);

  return <>{children}</>;
};

export default OnboardingGate;
