"use client";

interface SaveAsModalProps {
  isOpen: boolean;
  name: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}

export function SaveAsModal({
  isOpen,
  name,
  onNameChange,
  onSave,
  onClose,
  saving,
}: SaveAsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800">
          <h2 className="text-xl font-bold text-cyan-300">Save Track</h2>
        </div>
        <div className="p-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Track Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter track name..."
            className="w-full px-4 py-3 bg-slate-700 border border-cyan-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) onSave();
              if (e.key === "Escape") onClose();
            }}
          />
        </div>
        <div className="px-6 py-4 border-t border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!name.trim() || saving}
            className="px-6 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
