import React, { useState, useEffect } from "react";
import {
  BookOpen,
  CheckCircle,
  ArrowRight,
  Play,
  Sparkles,
  Check,
  HelpCircle,
  AlertCircle,
  Calendar,
  ListTodo,
  Award,
  CheckSquare,
  Square
} from "lucide-react";
import { Gate } from "../../quantum/engine";
import { MathRenderer } from "../Common/MathRenderer";

interface Lesson {
  id: string;
  order: number;
  title: string;
  category: string;
  summary: string;
  interactive_component: string;
  starter_circuit: Gate[];
  xp_reward: number;
  is_completed: boolean;
  mastery_percent: number;
}

interface RoadmapTopic {
  id: string;
  title: string;
  category: string;
  description: string;
  level: string;
  is_completed: boolean;
  order_idx: number;
}

interface LearnCurriculumProps {
  onOpenInSimulator: (qubits: number, gates: Gate[]) => void;
}

export const LearnCurriculum: React.FC<LearnCurriculumProps> = ({ onOpenInSimulator }) => {
  const [activeTab, setActiveTab] = useState<"modules" | "roadmap">("modules");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [roadmapTopics, setRoadmapTopics] = useState<RoadmapTopic[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string>("superposition");
  const [activeLessonDetail, setActiveLessonDetail] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizFeedback, setQuizFeedback] = useState<any>(null);

  // Fetch all lessons from backend
  const loadLessons = async () => {
    try {
      const res = await fetch("/api/learn/lessons");
      if (res.ok) {
        const data = await res.json();
        setLessons(data.lessons);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  // Fetch guided roadmap with persistent checklist
  const loadRoadmap = async () => {
    try {
      const res = await fetch("/api/learn/roadmap?user_id=user_default");
      if (res.ok) {
        const data = await res.json();
        const items = data.roadmap || data.topics || [];
        setRoadmapTopics(items);
      }
    } catch {
      // fallback
    }
  };

  const loadLessonDetail = async (id: string) => {
    setSelectedQuizAnswer(null);
    setQuizSubmitted(false);
    setQuizFeedback(null);
    try {
      const res = await fetch(`/api/learn/lessons/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveLessonDetail(data.lesson);
      }
    } catch {
      // Handle error
    }
  };

  useEffect(() => {
    loadLessons();
    loadRoadmap();
  }, []);

  useEffect(() => {
    if (activeLessonId) {
      loadLessonDetail(activeLessonId);
    }
  }, [activeLessonId]);

  // Toggle persistent checkbox in roadmap
  const handleToggleRoadmapTopic = async (topicId: string, currentCompleted: boolean) => {
    const newCompleted = !currentCompleted;
    // Optimistic UI update
    setRoadmapTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, is_completed: newCompleted } : t))
    );

    try {
      await fetch("/api/learn/roadmap/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "user_default",
          item_id: topicId,
          topic_id: topicId,
          is_completed: newCompleted,
          completed: newCompleted,
        }),
      });
      // Also update lessons state if IDs match
      setLessons((prev) =>
        prev.map((l) => (l.id === topicId ? { ...l, is_completed: newCompleted } : l))
      );
    } catch {
      // Revert if failed
      loadRoadmap();
    }
  };

  const handleQuizSubmit = async () => {
    if (selectedQuizAnswer === null || !activeLessonDetail?.quiz) return;
    setQuizSubmitted(true);
    const q = activeLessonDetail.quiz;
    const isCorrect = selectedQuizAnswer === q.correct_index;

    try {
      await fetch("/api/practice/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_id: q.id,
          selected_index: selectedQuizAnswer,
        }),
      });
      await fetch("/api/learn/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson_id: activeLessonId,
          completed: true,
          mastery_percent: isCorrect ? 100.0 : 75.0,
        }),
      });
      loadLessons();
      loadRoadmap();
    } catch {}

    setQuizFeedback({
      isCorrect,
      explanation: q.explanation,
    });
  };

  const completedRoadmapCount = roadmapTopics.filter((t) => t.is_completed).length;
  const roadmapPercent = roadmapTopics.length > 0 ? Math.round((completedRoadmapCount / roadmapTopics.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header with Tab Switching */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-100 bg-white/95 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Interactive Quantum Curriculum & Roadmap
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Structured learning pathway from qubits and superposition to Bell states, algorithms, and cryptography.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Progress */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("modules")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === "modules"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Curriculum Modules
            </button>
            <button
              onClick={() => setActiveTab("roadmap")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "roadmap"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              Roadmap Planner ({roadmapPercent}%)
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Detailed Curriculum Modules */}
      {activeTab === "modules" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: 13 Roadmap Modules List */}
          <div className="lg:col-span-4 glass-panel p-4 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-2 max-h-[720px] overflow-y-auto">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                13 Curriculum Modules
              </span>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                {lessons.filter((l) => l.is_completed).length}/{lessons.length} Done
              </span>
            </div>

            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => setActiveLessonId(lesson.id)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                  activeLessonId === lesson.id
                    ? "bg-purple-50/70 border-purple-400 shadow-sm"
                    : "bg-white border-slate-200 hover:border-purple-200"
                }`}
              >
                <div className="mt-0.5">
                  {lesson.is_completed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[9px] font-mono text-slate-500 font-bold">
                      {lesson.order}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <h4 className={`font-bold truncate ${activeLessonId === lesson.id ? "text-purple-900" : "text-slate-800"}`}>
                      {lesson.title}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    {lesson.category} • +{lesson.xp_reward} XP
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Right Column: Detailed Lesson Viewer */}
          <div className="lg:col-span-8 glass-panel p-6 sm:p-8 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-6">
            {activeLessonDetail ? (
              <>
                {/* Lesson Title & Try in Simulator Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-purple-700 font-bold">
                      Module {activeLessonDetail.order} • {activeLessonDetail.category}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                      {activeLessonDetail.title}
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      onOpenInSimulator(
                        activeLessonDetail.starter_circuit.length > 1 ? 2 : 1,
                        activeLessonDetail.starter_circuit
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 hover:scale-[1.02] transition-transform cursor-pointer shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Open Circuit in Simulator
                  </button>
                </div>

                {/* Lesson Markdown & KaTeX Equations */}
                <div className="space-y-4">
                  <MathRenderer
                    content={activeLessonDetail.content_markdown}
                    className="text-slate-800 leading-relaxed text-sm"
                  />
                </div>

                {/* Checkpoint Quiz */}
                {activeLessonDetail.quiz && (
                  <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        Module Checkpoint Quiz
                      </h3>
                      <span className="text-[11px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        Difficulty: {activeLessonDetail.quiz.difficulty || "standard"}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <MathRenderer
                        content={activeLessonDetail.quiz.question}
                        className="text-sm font-semibold text-slate-800"
                      />
                    </div>

                    {/* Quiz Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeLessonDetail.quiz.options.map((optionText: string, idx: number) => {
                        const isSelected = selectedQuizAnswer === idx;
                        let optionStyle = "border-slate-200 bg-white hover:border-purple-300 text-slate-800";

                        if (quizSubmitted) {
                          if (idx === activeLessonDetail.quiz.correct_index) {
                            optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                          } else if (isSelected) {
                            optionStyle = "border-rose-500 bg-rose-50 text-rose-900";
                          }
                        } else if (isSelected) {
                          optionStyle = "border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-sm";
                        }

                        return (
                          <button
                            key={idx}
                            disabled={quizSubmitted}
                            onClick={() => setSelectedQuizAnswer(idx)}
                            className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-center gap-3 cursor-pointer ${optionStyle}`}
                          >
                            <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <MathRenderer content={optionText} className="flex-1 text-xs" />
                          </button>
                        );
                      })}
                    </div>

                    {/* Submit Quiz Button */}
                    {!quizSubmitted ? (
                      <div className="flex justify-end pt-2">
                        <button
                          disabled={selectedQuizAnswer === null}
                          onClick={handleQuizSubmit}
                          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:pointer-events-none text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                        >
                          Submit Answer
                        </button>
                      </div>
                    ) : (
                      <div className={`p-4 rounded-xl border ${quizFeedback?.isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                        <div className="flex items-center gap-2">
                          {quizFeedback?.isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                          )}
                          <span className={`text-sm font-bold ${quizFeedback?.isCorrect ? "text-emerald-900" : "text-rose-900"}`}>
                            {quizFeedback?.isCorrect ? "Correct! +30 XP awarded." : "Incorrect Answer"}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-700">
                          <strong className="block text-slate-900 mb-1">Explanation:</strong>
                          <MathRenderer content={quizFeedback?.explanation || ""} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center text-slate-400">Loading module details...</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Guided Interactive Study Roadmap Planner */}
      {activeTab === "roadmap" && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-purple-100 bg-white/95 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Quantum Learning Pathway & Self-Paced Checklist
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Check off milestones as you master core concepts. State is automatically saved to your persistent profile.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-700 block">
                  {completedRoadmapCount} of {roadmapTopics.length} Milestones Complete
                </span>
                <span className="text-[11px] font-mono text-purple-700 font-bold">
                  {roadmapPercent}% Mastery
                </span>
              </div>
              <div className="w-28 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${roadmapPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Roadmap Milestones Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roadmapTopics.map((topic, idx) => {
              const isDone = topic.is_completed;
              return (
                <div
                  key={topic.id}
                  onClick={() => handleToggleRoadmapTopic(topic.id, isDone)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isDone
                      ? "bg-purple-50/70 border-purple-300 shadow-sm"
                      : "bg-white border-slate-200 hover:border-purple-300 hover:shadow-sm"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded">
                        Step {idx + 1} • {topic.level || "Standard"}
                      </span>
                      {isDone ? (
                        <CheckSquare className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400 hover:text-purple-600 transition-colors" />
                      )}
                    </div>

                    <h4 className={`text-sm font-bold ${isDone ? "text-purple-950 line-through opacity-85" : "text-slate-900"}`}>
                      {topic.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {topic.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">{topic.category}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab("modules");
                        setActiveLessonId(topic.id);
                      }}
                      className="text-purple-600 font-bold hover:underline"
                    >
                      Study Topic →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnCurriculum;
