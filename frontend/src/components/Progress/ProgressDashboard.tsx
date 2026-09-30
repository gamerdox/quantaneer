import React, { useState, useEffect } from "react";
import { TrendingUp, Trophy, Flame, Zap, Shield, Sparkles, Award, CheckCircle2, ChevronRight, Activity, Network } from "lucide-react";

export const ProgressDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<string>("national");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/progress/dashboard").then((r) => r.json()),
      fetch(`/api/progress/leaderboard?category=${activeLeaderboardTab}`).then((r) => r.json()),
      fetch("/api/progress/badges").then((r) => r.json()),
    ])
      .then(([dash, lb, bdg]) => {
        setDashboardData(dash);
        if (lb.leaderboard) setLeaderboard(lb.leaderboard);
        if (bdg.badges) setBadges(bdg.badges);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeLeaderboardTab]);

  return (
    <div className="space-y-6">
      {/* Header & Student Summary Banner */}
      {dashboardData && (
        <div className="glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-purple-500/25">
              {dashboardData.user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{dashboardData.user.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-mono font-bold">
                  Level {dashboardData.user.level}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{dashboardData.user.email}</p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold flex items-center gap-1 justify-center">
                <Zap className="w-3.5 h-3.5 text-purple-600" /> Total XP
              </span>
              <span className="text-xl font-mono font-bold text-purple-700">
                {dashboardData.user.xp}
              </span>
            </div>

            <div className="text-center">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold flex items-center gap-1 justify-center">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Streak
              </span>
              <span className="text-xl font-mono font-bold text-amber-600">
                {dashboardData.user.streak_days} Days
              </span>
            </div>

            <div className="text-center">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold flex items-center gap-1 justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Mastery
              </span>
              <span className="text-xl font-mono font-bold text-emerald-600">
                {dashboardData.stats.average_mastery}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Next Action Banner */}
      {dashboardData && (
        <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] uppercase font-mono text-purple-700 font-bold block">
                Recommended Next Step
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                {dashboardData.recommended_next_action}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Weak Topics + Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Analytics & Concept Mastery */}
        <div className="lg:col-span-8 space-y-6">
          {/* Concept Mastery Breakdown */}
          <div className="glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              Learning Concepts Mastery
            </h3>

            {dashboardData?.concept_mastery && (
              <div className="space-y-3">
                {dashboardData.concept_mastery.map((item: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{item.concept}</span>
                      <span className="font-mono font-bold text-purple-700">{item.mastery_percent}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${item.mastery_percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leaderboard Table */}
          <div className="glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  National Quantum Leaderboard
                </h3>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                {["national", "university", "batch"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveLeaderboardTab(tab)}
                    className={`px-3 py-1 rounded-lg capitalize font-bold transition-colors cursor-pointer ${
                      activeLeaderboardTab === tab
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 bg-slate-100"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <th className="pb-2">Rank</th>
                    <th className="pb-2">Student</th>
                    <th className="pb-2">Institution</th>
                    <th className="pb-2">Level</th>
                    <th className="pb-2">Total XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboard.map((item, idx) => (
                    <tr key={idx} className="hover:bg-purple-50/40 transition-colors">
                      <td className="py-2.5 font-bold text-slate-900">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </td>
                      <td className="py-2.5 font-bold text-slate-900">{item.name}</td>
                      <td className="py-2.5 text-slate-600">{item.institution}</td>
                      <td className="py-2.5 text-purple-700 font-bold">Lvl {item.level}</td>
                      <td className="py-2.5 text-slate-900 font-bold">{item.xp} XP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Badges & Credentials */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Award className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Earned Credentials & Badges ({badges.filter((b) => b.unlocked).length}/{badges.length})
              </h3>
            </div>

            <div className="space-y-3">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                    b.unlocked
                      ? "bg-purple-50/70 border-purple-200 text-slate-800"
                      : "bg-slate-50 border-slate-200 opacity-60 text-slate-500"
                  }`}
                >
                  <div className="text-2xl">{b.icon || "🎖️"}</div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{b.name}</h4>
                    <p className="text-[11px] text-slate-500">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
