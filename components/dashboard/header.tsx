'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Settings, Clock } from 'lucide-react';

export function Header() {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Logo and Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">FG</span>
            </div>
            <h1 className="text-xl font-bold text-foreground hidden sm:block">FocusGuard</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Focus Active</span>
          </div>
        </div>

        {/* Right: Timer and Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-card text-sm font-mono text-foreground">
            <Clock className="h-4 w-4 text-accent" />
            <span>12:34</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="text-foreground hover:bg-card"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-foreground hover:bg-card"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
