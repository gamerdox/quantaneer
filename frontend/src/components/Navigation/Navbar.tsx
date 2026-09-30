import React, { useState } from "react";
import {
  Atom,
  BookOpen,
  Layers,
  FlaskConical,
  Award,
  Sparkles,
  TrendingUp,
  GraduationCap,
  Flame,
  Zap,
  User,
  LogOut,
  Settings,
  ShieldCheck
} from "lucide-react";
import { AuthModal } from "./AuthModal";
import { SettingsModal } from "./SettingsModal";

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: any;
  onUserUpdate: (user: any) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onUserUpdate,
  onLogout,
}) => {
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const navLinks = [
    { id: "home", label: "Home", icon: Atom },
    { id: "learn", label: "Curriculum", icon: BookOpen },
    { id: "simulator", label: "Simulator", icon: Layers },
    { id: "labs", label: "Labs", icon: FlaskConical },
    { id: "practice", label: "Practice", icon: Award },
    { id: "ai-tutor", label: "AI Tutor", icon: Sparkles },
    { id: "progress", label: "Analytics", icon: TrendingUp },
    { id: "instructor", label: "Instructor", icon: GraduationCap },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 border-b border-purple-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div
              onClick={() => onSelectTab("home")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform">
                <Atom className="w-5 h-5 text-white animate-spin-slow" />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-wider text-slate-900 font-mono flex items-center gap-1.5">
                  QUANTANEER
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold border border-purple-200">
                    AI
                  </span>
                </span>
                <span className="text-[9px] text-slate-500 font-mono block -mt-0.5">
                  SIH26140 • Smart Education
                </span>
              </div>
            </div>

            {/* Navigation Links for Desktop */}
            <nav className="hidden xl:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-purple-100 text-purple-800 border border-purple-200 shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-purple-700" : "text-slate-500"}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* User Profile, Stats & Settings */}
            <div className="flex items-center gap-3">
              {/* Gamification Stats Pill */}
              <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono">
                <span className="flex items-center gap-1 text-purple-700 font-bold">
                  <Zap className="w-3.5 h-3.5 fill-current text-purple-600" />
                  {currentUser?.xp ?? 150} XP
                </span>
                <span className="flex items-center gap-1 text-amber-600 font-bold">
                  <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
                  {currentUser?.streak_days ?? 3}d
                </span>
                <span className="text-[11px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold">
                  Lvl {currentUser?.level ?? 2}
                </span>
              </div>

              {/* Settings Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                title="AI Copilot & Gemini Settings"
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Profile or Sign In Button */}
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 pl-2 pr-3 py-1 rounded-xl">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {currentUser.name ? currentUser.name[0].toUpperCase() : "Q"}
                    </div>
                    <div className="text-left hidden md:block">
                      <span className="text-xs font-bold text-slate-800 block leading-tight truncate max-w-[100px]">
                        {currentUser.name}
                      </span>
                      <span className="text-[9px] font-mono text-purple-700 font-bold uppercase block leading-none">
                        {currentUser.role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => {
          onUserUpdate(user);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

export default Navbar;
