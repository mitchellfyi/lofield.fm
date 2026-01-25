"use client";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="max-w-2xl w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800">
          <h2 className="text-xl font-bold text-cyan-300">How to Use LoField Music Lab</h2>
        </div>

        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">Getting Started</h3>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm">
              <li>Click &ldquo;Init Audio&rdquo; to initialize the audio engine</li>
              <li>Type your prompt in the chat (e.g., &ldquo;make a lofi beat at 90bpm&rdquo;)</li>
              <li>The AI will generate Tone.js code for you</li>
              <li>Click &ldquo;Play&rdquo; to hear your beat</li>
              <li>Modify the code or chat again to iterate</li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">Example Prompts</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="pl-4 border-l-2 border-cyan-500/30">
                &ldquo;Create a minimal techno beat at 128 bpm&rdquo;
              </li>
              <li className="pl-4 border-l-2 border-cyan-500/30">
                &ldquo;Make a relaxed lofi beat with piano&rdquo;
              </li>
              <li className="pl-4 border-l-2 border-cyan-500/30">
                &ldquo;Add a hi-hat pattern to the current beat&rdquo;
              </li>
              <li className="pl-4 border-l-2 border-cyan-500/30">
                &ldquo;Slow down the tempo to 85 bpm&rdquo;
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">Tips</h3>
            <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
              <li>You can edit the code directly in the editor</li>
              <li>Watch the console for events and errors</li>
              <li>Valid code requires Tone.js API calls and Transport.start()</li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-cyan-500/30 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-sm text-sm font-semibold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white transition-all duration-200 shadow-lg shadow-cyan-500/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
