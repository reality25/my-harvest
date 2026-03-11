import { ReactNode } from "react";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideNav?: boolean;
}

const AppLayout = ({ children, hideHeader, hideNav }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {!hideHeader && <AppHeader />}
      <main className={`mx-auto max-w-4xl ${!hideNav ? "bottom-nav-safe" : ""}`}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
};

export default AppLayout;
