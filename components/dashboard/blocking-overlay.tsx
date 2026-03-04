'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCcw, Lock, Brain } from 'lucide-react';

const SENTENCES = [
  "I am choosing to focus on my goal right now.",
  "Distractions are temporary, focus is permanent.",
  "I have control over my browsing habits.",
  "My work is more valuable than this distraction.",
  "I will breathe and return to my priority."
];

export function BlockingOverlay({ isSessionActive, forceBlock = false, onDismiss }: { isSessionActive: boolean; forceBlock?: boolean; onDismiss?: () => void }) {
  const [targetSentence, setTargetSentence] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isEmergencyUnlocked, setIsEmergencyUnlocked] = useState(false);
  const [isDistractionDetected, setIsDistractionDetected] = useState(false);

  useEffect(() => {
    if (!isSessionActive) {
      setIsEmergencyUnlocked(false);
      setUserInput("");
      setIsDistractionDetected(false);
      return;
    }

    if (forceBlock) {
      setIsDistractionDetected(true);
      setTargetSentence(SENTENCES[Math.floor(Math.random() * SENTENCES.length)]);
      return;
    }

    // SIMULATION: In a real extension, background.js would send a message.
    // Here we simulate it by checking referrer or common cues.
    const checkDistraction = () => {
      const referrer = document.referrer?.toLowerCase() || '';
      const isBadSite = referrer.includes('youtube') ||
        referrer.includes('twitter') ||
        referrer.includes('instagram') ||
        referrer.includes('facebook');

      if (isBadSite) {
        setIsDistractionDetected(true);
        setTargetSentence(SENTENCES[Math.floor(Math.random() * SENTENCES.length)]);
      }
    };

    const interval = setInterval(checkDistraction, 5000);
    return () => clearInterval(interval);
  }, [isSessionActive, forceBlock]);

  const isMatched = userInput === targetSentence;

  const handleResume = () => {
    if (isMatched) {
      setIsEmergencyUnlocked(true);
      setIsDistractionDetected(false);
      if (onDismiss) onDismiss();
    }
  };

  if (!isSessionActive || isEmergencyUnlocked || (!isDistractionDetected && !forceBlock)) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-2xl animate-in fade-in duration-700">
      <div className="max-w-xl w-full p-10 text-center space-y-10">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-primary/30 blur-[120px] rounded-full animate-pulse" />
          <div className="relative bg-black/40 border border-white/10 p-8 rounded-[3rem] backdrop-blur-md">
            <Brain className="w-24 h-24 text-primary mx-auto animate-pulse" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-5xl font-black text-white tracking-tightest uppercase leading-none">
            FOCUS GUARD <br /> ACTIVATED
          </h2>
          <p className="text-primary text-lg font-black uppercase tracking-[0.3em]">
            You are in your study session, resume
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 space-y-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50 pointer-events-none" />

          <div className="space-y-4 relative">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Type the consciousness verification</p>
            <p className="text-2xl font-bold text-white leading-relaxed select-none">
              "{targetSentence}"
            </p>
          </div>

          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Verify your intent..."
            className="w-full bg-black/60 border-2 border-white/10 rounded-2xl p-6 text-white text-center text-xl font-medium focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-800"
            autoFocus
          />

          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-black uppercase tracking-widest px-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isMatched ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
              {isMatched ? 'Pattern Matched' : 'Awaiting Match'}
            </div>
            <div className="flex items-center gap-1">
              ACCURACY: <span className={isMatched ? 'text-green-500' : 'text-primary'}>{isMatched ? '100%' : '0%'}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-6">
          <button
            onClick={handleResume}
            disabled={!isMatched}
            className={`w-full flex items-center justify-center gap-4 py-6 rounded-full font-black text-xl transition-all active:scale-95 shadow-2xl overflow-hidden relative group
              ${isMatched
                ? 'bg-primary text-primary-foreground hover:shadow-primary/40 scale-105'
                : 'bg-white/5 text-gray-700 border border-white/5 cursor-not-allowed'}`}
          >
            <ShieldAlert className="w-6 h-6" />
            RESUME STUDY SESSION
          </button>

          <button
            onClick={() => {
              setIsEmergencyUnlocked(true);
              setIsDistractionDetected(false);
              if (onDismiss) onDismiss();
            }}
            className="text-gray-500 text-xs hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto font-black uppercase tracking-widest py-2"
          >
            <Lock className="w-3 h-3" />
            Emergency Override
          </button>
        </div>
      </div>
    </div>
  );
}
