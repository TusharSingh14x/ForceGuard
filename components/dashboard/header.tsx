'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Settings, Clock, Play, Square } from 'lucide-react';

interface HeaderProps {
  isSessionActive: boolean;
  onToggleSession: () => void;
  sessionStartTime: number | null;
}

export function Header({ isSessionActive, onToggleSession, sessionStartTime }: HeaderProps) {
  const [isDark, setIsDark] = useState(true);
  const [elapsedTime, setElapsedTime] = useState('00:00');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive && sessionStartTime) {
      interval = setInterval(() => {
        const seconds = Math.floor((Date.now() - sessionStartTime) / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        setElapsedTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }, 1000);
    } else {
      setElapsedTime('00:00');
    }
    return () => clearInterval(interval);
  }, [isSessionActive, sessionStartTime]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
  return (
    <header className="sticky top-0 z-[60] border-b border-white/5 bg-background/60 backdrop-blur-3xl">
      <div className="max-w-7xl mx-auto flex h-24 items-center justify-between px-8">
        {/* Left: Logo and Status */}
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="relative h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <span className="text-white font-black text-xl italic relative z-10">G</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-[-0.05em] uppercase hidden sm:block leading-none">FocusGuard</h1>
              <div className="hidden lg:flex items-center gap-2 mt-1">
                <div className={`h-1.5 w-1.5 rounded-full ${isSessionActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)] animate-pulse' : 'bg-white/20'}`} />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">{isSessionActive ? 'Guarding Active' : 'Neural Standby'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Timer and Controls */}
        <div className="flex items-center gap-5">
          {isSessionActive && (
            <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-xs font-black font-mono tracking-widest text-primary animate-in fade-in zoom-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-primary blur-md opacity-20" />
                <Clock className="h-4 w-4 relative z-10 animate-pulse" />
              </div>
              <span className="tabular-nums">{elapsedTime}</span>
            </div>
          )}

          <Button
            onClick={onToggleSession}
            className={`rounded-2xl h-12 px-8 font-black uppercase tracking-[0.1em] text-[10px] transition-all duration-500 active:scale-95 shadow-xl ${isSessionActive ? 'bg-white/5 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-transparent' : 'bg-primary text-white hover:shadow-primary/40'}`}
          >
            {isSessionActive ? (
              <>
                <Square className="h-4 w-4 mr-3 fill-current" />
                Terminate Session
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-3 fill-current" />
                Engage Focus
              </>
            )}
          </Button>

          <div className="h-8 w-[1px] bg-white/5 mx-2 hidden sm:block" />

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-xl hover:bg-white/5 h-10 w-10 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-white/5 h-10 w-10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
