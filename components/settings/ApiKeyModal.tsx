"use client";

import { useState } from "react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApiKeyModal({ isOpen, onClose, onSuccess }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);

  if (!isOpen) return null;

  const handleValidate = async () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: apiKey }),
      });

      const data = await res.json();

      if (!data.valid) {
        setError(data.error || "Invalid API key");
        setValidated(false);
        return;
      }

      setValidated(true);
      setError(null);
    } catch {
      setError("Failed to validate key. Please try again.");
      setValidated(false);
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    if (!validated) {
      setError("Please validate your key first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: apiKey }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save API key");
      }

      setApiKey("");
      setValidated(false);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save API key");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setApiKey("");
    setError(null);
    setValidated(false);
    onClose();
  };

  const handleKeyChange = (value: string) => {
    setApiKey(value);
    setValidated(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800">
          <h2 className="text-xl font-bold text-cyan-300">Add OpenAI API Key</h2>
          <p className="text-sm text-slate-400 mt-1">Enter your OpenAI API key to enable AI chat</p>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {validated && (
            <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-sm">
              API key validated successfully
            </div>
          )}

          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-1">
              API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-cyan-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30"
              placeholder="sk-..."
              autoComplete="off"
            />
          </div>

          <p className="text-xs text-slate-500">
            Get your API key from{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300"
            >
              platform.openai.com/api-keys
            </a>
          </p>
        </div>

        <div className="px-6 py-4 border-t border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800 flex gap-3">
          <button
            onClick={handleClose}
            disabled={loading || validating}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-300 border border-slate-600 hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {!validated ? (
            <button
              onClick={handleValidate}
              disabled={validating || !apiKey.trim()}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validating ? "Validating..." : "Validate"}
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Key"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
