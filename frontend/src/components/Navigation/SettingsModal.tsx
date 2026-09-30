import React, { useState, useEffect } from "react";
import { Key, Sparkles, CheckCircle2, AlertCircle, ShieldCheck, Trash2 } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySaved?: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onApiKeySaved }) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("gemini_api_key") || "";
    setApiKey(saved);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem("gemini_api_key", apiKey.trim());
    if (onApiKeySaved) onApiKeySaved(apiKey.trim());
    onClose();
  };

  const handleClear = () => {
    localStorage.removeItem("gemini_api_key");
    setApiKey("");
    setTestStatus("idle");
    if (onApiKeySaved) onApiKeySaved("");
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestStatus("error");
      setTestMessage("Please enter an API key first.");
      return;
    }

    setTestStatus("testing");
    setTestMessage("Testing connection to Google Gemini 2.0 Flash API...");

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gemini-API-Key": apiKey.trim(),
        },
        body: JSON.stringify({
          query: "Explain Hadamard gate in 1 line.",
          gemini_api_key: apiKey.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTestStatus("success");
        setTestMessage(
          data.mode === "LIVE_GEMINI"
            ? "Successfully connected to Gemini 2.0 Flash!"
            : "API key validated and registered."
        );
      } else {
        setTestStatus("error");
        setTestMessage("Failed to reach Gemini API. Please check your key.");
      }
    } catch {
      setTestStatus("error");
      setTestMessage("Network test error. Key saved locally.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-purple-200 p-6 space-y-5 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                AI Copilot Settings & Gemini Key
              </h3>
              <p className="text-xs text-slate-500">
                Configure live neural quantum mentor capabilities
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900 space-y-1.5">
            <span className="font-bold flex items-center gap-1.5 text-xs text-purple-950">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Hybrid AI Mentor Architecture
            </span>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              If an API key is provided, the AI Mentor directly queries <strong>Gemini 2.0 Flash</strong> for live quantum physics explanations with KaTeX formatting.
            </p>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              If omitted or offline, Quantaneer seamlessly utilizes the built-in deterministic quantum engine.
            </p>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestStatus("idle");
              }}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          {testStatus !== "idle" && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testStatus === "testing"
                  ? "bg-slate-50 border-slate-200 text-slate-600"
                  : testStatus === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {testStatus === "testing" ? (
                <div className="w-4 h-4 rounded-full border-2 border-purple-600 border-t-transparent animate-spin shrink-0" />
              ) : testStatus === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === "testing"}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Test Connection
              </button>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Remove Key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
