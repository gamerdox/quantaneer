import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Activity,
  Search,
  Sparkles,
  Send,
  BookOpen,
  BrainCircuit
} from "lucide-react";
import { MathRenderer } from "../Common/MathRenderer";

export const InstructorView: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // AI Instructor Copilot state
  const [aiDiagnostic, setAiDiagnostic] = useState<any>(null);
  const [loadingAiDiagnostic, setLoadingAiDiagnostic] = useState<boolean>(false);
  const [aiStudentPlan, setAiStudentPlan] = useState<any>(null);
  const [loadingStudentPlan, setLoadingStudentPlan] = useState<boolean>(false);

  // AI Instructor Chat Assistant
  const [aiQuery, setAiQuery] = useState<string>("");
  const [aiChatMessages, setAiChatMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([
    {
      sender: "ai",
      text: "Welcome, Dr. Radhika Sen! I am your AI Instructor Copilot. I analyze student circuit submissions, quiz attempts, and learning bottlenecks. Ask me to diagnose struggling students, generate tailored quiz questions, or draft lesson interventions.",
    },
  ]);
  const [loadingChat, setLoadingChat] = useState<boolean>(false);

  const fetchOverview = () => {
    fetch("/api/instructor/overview")
      .then((r) => r.json())
      .then((data) => {
        setOverview(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleOpenStudent = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setAiStudentPlan(null);
    try {
      const res = await fetch(`/api/instructor/students/${studentId}`);
      if (res.ok) {
        const d = await res.json();
        setStudentDetail(d);
      }
    } catch {}
  };

  const handleRunAiCohortDiagnostics = async () => {
    setLoadingAiDiagnostic(true);
    try {
      const res = await fetch("/api/instructor/ai/cohort-analysis", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setAiDiagnostic(data.diagnostic);
      }
    } catch {} finally {
      setLoadingAiDiagnostic(false);
    }
  };

  const handleGenerateStudentPlan = async (studentId: string) => {
    setLoadingStudentPlan(true);
    try {
      const res = await fetch(`/api/instructor/ai/student-intervention?student_id=${studentId}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setAiStudentPlan(data.intervention_plan);
      }
    } catch {} finally {
      setLoadingStudentPlan(false);
    }
  };

  const handleSendAiInstructorChat = async (presetText?: string) => {
    const textToSend = presetText || aiQuery;
    if (!textToSend.trim()) return;

    setAiChatMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    if (!presetText) setAiQuery("");
    setLoadingChat(true);

    try {
      const res = await fetch("/api/instructor/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: textToSend }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiChatMessages((prev) => [...prev, { sender: "ai", text: data.answer }]);
      }
    } catch {} finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Instructor Analytics & AI Pedagogical Copilot
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Live learning telemetry, SQL-aggregated student mastery, and active AI Instructor diagnostics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAiCohortDiagnostics}
            disabled={loadingAiDiagnostic}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {loadingAiDiagnostic ? "Generating..." : "Run AI Cohort Diagnostics"}
          </button>

          <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 font-bold">
            Instructor: <strong>Prof. Radhika Sen</strong>
          </div>
        </div>
      </div>

      {/* Cohort Overview Metrics */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-200 bg-white/90 shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-mono font-semibold text-slate-500">Enrolled Students</span>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {overview.class_metrics.total_students} Learners
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-200 bg-white/90 shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-mono font-semibold text-slate-500">Avg Course Progress</span>
            <div className="text-2xl font-bold text-purple-700 font-mono">
              {overview.class_metrics.avg_class_progress_percent}%
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-200 bg-white/90 shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-mono font-semibold text-slate-500">Avg Quiz Accuracy</span>
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              {overview.class_metrics.avg_quiz_accuracy}%
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-200 bg-white/90 shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-mono font-semibold text-slate-500">Simulations Run</span>
            <div className="text-2xl font-bold text-amber-600 font-mono">
              {overview.class_metrics.total_simulations_run} Total
            </div>
          </div>
        </div>
      )}

      {/* AI Cohort Diagnostics Banner (Generated by AI Instructor) */}
      {aiDiagnostic && (
        <div className="glass-panel p-6 rounded-2xl border border-purple-200 bg-purple-50/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-purple-200 pb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-purple-700" />
              <h3 className="text-sm font-bold text-purple-950">
                AI Instructor Generated Pedagogical Diagnostic
              </h3>
            </div>
            <button
              onClick={() => setAiDiagnostic(null)}
              className="text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
            >
              ✕ Dismiss
            </button>
          </div>

          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
            <p className="font-bold text-slate-900 mb-2">{aiDiagnostic.executive_summary}</p>
            <p className="text-purple-900 font-medium">{aiDiagnostic.primary_bottleneck}</p>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-mono uppercase text-slate-600 font-bold block">
              Automated Action Interventions:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {aiDiagnostic.recommended_interventions.map((item: any, i: number) => (
                <div key={i} className="p-3.5 rounded-xl bg-white border border-purple-200 space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{item.action}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      item.priority === "High" ? "bg-rose-100 text-rose-800" : "bg-purple-100 text-purple-800"
                    }`}>
                      {item.priority} Priority
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{item.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Student Roster & Cohort Weak Concepts Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Student Roster Table */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Student Cohort Roster ({overview?.students?.length || 0})
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Click student for AI intervention plan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                  <th className="pb-2">Student Name</th>
                  <th className="pb-2">Progress</th>
                  <th className="pb-2">Mastery</th>
                  <th className="pb-2">Challenges</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview?.students?.map((s: any) => (
                  <tr
                    key={s.id}
                    className="hover:bg-purple-50/50 transition-colors cursor-pointer"
                    onClick={() => handleOpenStudent(s.id)}
                  >
                    <td className="py-3 font-bold text-slate-900">
                      <div>{s.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{s.email}</div>
                    </td>
                    <td className="py-3 text-purple-700 font-bold">{s.lessons_done} / 13 Lessons</td>
                    <td className="py-3 text-slate-800 font-bold">{s.avg_mastery}%</td>
                    <td className="py-3 text-amber-600 font-bold">{s.challenges_done} Passed</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 text-purple-600 font-bold hover:underline flex items-center gap-1">
                      <span>View Plan</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cohort Weak Concepts Heatmap */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Dynamic Concept Difficulty Heatmap
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live SQL-calculated difficulty from quiz attempts:
            </p>
          </div>

          <div className="space-y-3">
            {overview?.weak_concepts?.map((c: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900">{c.concept}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      c.severity === "High"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {c.severity} Difficulty
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Class Average: {c.class_avg_mastery}%</span>
                  <span className="text-slate-700 font-bold">{c.struggling_students} Learners</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive AI Instructor Chat Assistant */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">
              AI Instructor Interactive Teaching Assistant
            </h3>
          </div>
          <span className="text-[11px] font-mono text-purple-700 font-bold">
            Pedagogical Copilot Engine
          </span>
        </div>

        {/* Quick prompt buttons for teachers */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            "Which students need intervention this week?",
            "Draft a 2-question quiz on Bell states and entanglement",
            "How can I explain phase kickback intuitively?"
          ].map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSendAiInstructorChat(prompt)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-purple-700 hover:bg-purple-50 hover:border-purple-200 font-medium cursor-pointer transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat message stream */}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {aiChatMessages.map((msg, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-purple-50 border border-purple-200 text-purple-950 ml-8 font-medium shadow-xs"
                  : "bg-slate-50 border border-slate-200 text-slate-800 mr-8 shadow-xs"
              }`}
            >
              <MathRenderer content={msg.text} />
            </div>
          ))}
          {loadingChat && (
            <div className="text-xs text-slate-500 animate-pulse flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-spin" />
              AI Instructor analyzing pedagogical curriculum...
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendAiInstructorChat()}
            placeholder="Ask AI Instructor for cohort analysis, lesson ideas, or quiz generation..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-inner"
          />
          <button
            onClick={() => handleSendAiInstructorChat()}
            disabled={loadingChat || !aiQuery.trim()}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-purple-500/20 disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Individual Student Drilldown Modal with AI Remedial Generator */}
      {selectedStudentId && studentDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-purple-200 p-6 space-y-5 bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Student Drilldown: {studentDetail.student.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{studentDetail.student.email}</p>
              </div>
              <button
                onClick={() => setSelectedStudentId(null)}
                className="text-slate-400 hover:text-slate-800 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Total XP</span>
                <span className="font-bold text-purple-700 text-sm">{studentDetail.student.xp}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Level</span>
                <span className="font-bold text-indigo-700 text-sm">{studentDetail.student.level}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Active Streak</span>
                <span className="font-bold text-amber-600 text-sm">{studentDetail.student.streak_days} Days</span>
              </div>
            </div>

            {/* AI Remedial Action Plan Button */}
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-purple-950">AI Personalized Remedial Plan</span>
                </div>
                <button
                  onClick={() => handleGenerateStudentPlan(studentDetail.student.id)}
                  disabled={loadingStudentPlan}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-sm transition-colors"
                >
                  {loadingStudentPlan ? "Generating..." : "Generate AI Plan"}
                </button>
              </div>

              {aiStudentPlan && (
                <div className="space-y-2 text-xs text-slate-800 pt-2 border-t border-purple-200 leading-relaxed">
                  <p className="font-bold text-purple-900">{aiStudentPlan.diagnosis}</p>
                  <div className="space-y-1 pl-2">
                    {aiStudentPlan.remedial_steps.map((st: string, idx: number) => (
                      <div key={idx} className="text-slate-700 font-medium">• {st}</div>
                    ))}
                  </div>
                  <p className="text-[11px] text-emerald-700 italic pt-1 font-medium">
                    "{aiStudentPlan.encouragement_message}"
                  </p>
                </div>
              )}
            </div>

            {/* Completed Lessons */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                Curriculum Mastery Progress:
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {studentDetail.learning_progress.map((lp: any) => (
                  <div
                    key={lp.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <span className="text-slate-800 font-medium">{lp.title}</span>
                    <span className="font-mono text-emerald-600 font-bold">{lp.mastery_percent}% Mastery</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedStudentId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorView;
