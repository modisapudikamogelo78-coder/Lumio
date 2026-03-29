import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Home, BookOpen, Calculator, Brain, Zap, Users, Menu, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/dyslexia", label: "Dyslexia", icon: BookOpen },
  { path: "/dyscalculia", label: "Dyscalculia", icon: Calculator },
  { path: "/autism", label: "Autism", icon: Brain },
  { path: "/adhd", label: "ADHD", icon: Zap },
  { path: "/parent-dashboard", label: "For Parents & Teachers", icon: Users },
];

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-card border-r border-border flex flex-col transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Lumio</h1>
            <p className="text-xs text-muted-foreground">Adaptive Learning</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 m-4 rounded-xl bg-muted/50">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Learning is a journey. Every step forward counts. 💜
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Lumio</span>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}