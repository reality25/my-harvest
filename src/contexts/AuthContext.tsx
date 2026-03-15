import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { getCurrentUser, setCurrentUser, type User } from "@/lib/dataService";
import { supabase } from "@/services/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (email: string, password: string, name: string) => { success: boolean; error?: string };
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStore<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(`harvest_${key}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setStore<T>(key: string, data: T[]) {
  localStorage.setItem(`harvest_${key}`, JSON.stringify(data));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function supabaseUserToLocal(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, string> }): User {
  const meta = supabaseUser.user_metadata ?? {};
  const name = meta.full_name ?? meta.name ?? supabaseUser.email?.split("@")[0] ?? "User";
  return {
    id: supabaseUser.id,
    name,
    email: supabaseUser.email ?? "",
    role: "farmer",
    location: "",
    avatar: meta.avatar_url ?? name.charAt(0).toUpperCase(),
    farmingActivities: [],
    bio: "",
    followers: 0,
    following: 0,
    postsCount: 0,
    createdAt: new Date().toISOString(),
    suspended: false,
  };
}

/** Pages where we should NOT auto-redirect after OAuth callback */
const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/admin/login"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getCurrentUser);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem("harvest_onboarding_complete") === "true";
  });
  const hasHandledOAuth = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = user !== null;

  /** Centralised handler: set local user + decide redirect */
  const handleSupabaseUser = useCallback((supabaseUser: { id: string; email?: string; user_metadata?: Record<string, string> }, isNewSession: boolean) => {
    const localUser = supabaseUserToLocal(supabaseUser);
    setCurrentUser(localUser);
    setUser(localUser);
    const onboarded = localStorage.getItem(`harvest_onboarded_${localUser.id}`);
    const isOnboarded = onboarded === "true";
    setHasCompletedOnboarding(isOnboarded);

    // Only redirect when coming back from an OAuth callback or landing on auth pages
    if (isNewSession && AUTH_PAGES.some((p) => location.pathname.startsWith(p))) {
      if (localUser.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (!isOnboarded) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    // 1. Set up listener FIRST (per Supabase best practices)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user && !hasHandledOAuth.current) {
        hasHandledOAuth.current = true;
        handleSupabaseUser(session.user, true);
        setIsLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // Silent refresh — update user without redirect
        handleSupabaseUser(session.user, false);
      } else if (event === "SIGNED_OUT") {
        hasHandledOAuth.current = false;
        setCurrentUser(null);
        setUser(null);
        setHasCompletedOnboarding(false);
        setIsLoading(false);
      }
    });

    // 2. Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleSupabaseUser(session.user, false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [handleSupabaseUser]);

  const login = useCallback((email: string, password: string) => {
    const users = getStore<User & { password: string }>("users");
    const found = users.find((u) => u.email === email);
    if (!found) return { success: false, error: "No account found with this email" };
    if (found.password !== password) return { success: false, error: "Incorrect password" };
    if (found.suspended) return { success: false, error: "This account has been suspended" };
    const { password: _, ...safeUser } = found;
    setCurrentUser(safeUser);
    setUser(safeUser);
    const onboarded = localStorage.getItem(`harvest_onboarded_${safeUser.id}`);
    setHasCompletedOnboarding(onboarded === "true");
    return { success: true };
  }, []);

  const signup = useCallback((email: string, password: string, name: string) => {
    const users = getStore<User & { password: string }>("users");
    if (users.find((u) => u.email === email)) {
      return { success: false, error: "An account with this email already exists" };
    }
    const newUser: User & { password: string } = {
      id: generateId(),
      name,
      email,
      password,
      role: "farmer",
      location: "",
      avatar: name.charAt(0).toUpperCase(),
      farmingActivities: [],
      bio: "",
      followers: 0,
      following: 0,
      postsCount: 0,
      createdAt: new Date().toISOString(),
      suspended: false,
    };
    users.push(newUser);
    setStore("users", users);
    const { password: _, ...safeUser } = newUser;
    setCurrentUser(safeUser);
    setUser(safeUser);
    setHasCompletedOnboarding(false);
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUser(null);
    setHasCompletedOnboarding(false);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      setCurrentUser(updated);
      const users = getStore<User & { password?: string }>("users");
      const idx = users.findIndex((u) => u.id === updated.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updates };
        setStore("users", users);
      }
      return updated;
    });
  }, []);

  const setOnboardingComplete = useCallback(() => {
    setHasCompletedOnboarding(true);
    localStorage.setItem("harvest_onboarding_complete", "true");
    if (user) {
      localStorage.setItem(`harvest_onboarded_${user.id}`, "true");
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        signup,
        logout,
        updateUser,
        hasCompletedOnboarding,
        setOnboardingComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
