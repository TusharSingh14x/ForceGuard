'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

export function SessionControls() {
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(754); // 12:34
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startSession = (duration: number) => {
    setSelectedDuration(duration);
    setSeconds(duration * 60);
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setSeconds(754);
    setSelectedDuration(null);
  };

  const progress = selectedDuration
    ? (1 - seconds / (selectedDuration * 60)) * 100
    : 0;

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
      {/* Timer Display */}
      <Card className="p-6 md:p-8 backdrop-blur-sm border-border/50 lg:col-span-2">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {isActive ? 'Focus Session Active' : 'Ready to Focus?'}
          </h3>
          <div className="mb-6">
            <div className="text-6xl md:text-7xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
              {formatTime(seconds)}
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedDuration
                ? `${selectedDuration} minute session`
                : 'Select a duration to start'}
            </p>
          </div>

          {/* Progress Bar */}
          {selectedDuration && (
            <div className="mb-6">
              <div className="h-2 bg-card rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{progress.toFixed(0)}% Complete</p>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2 justify-center flex-wrap">
            {!isActive && !selectedDuration && (
              <>
                <Button
                  onClick={() => startSession(30)}
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  30 min
                </Button>
                <Button
                  onClick={() => startSession(60)}
                  className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  60 min
                </Button>
                <Button
                  onClick={() => startSession(90)}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  90 min
                </Button>
              </>
            )}

            {selectedDuration && (
              <>
                <Button
                  onClick={handlePause}
                  variant={isActive ? 'default' : 'secondary'}
                  className={
                    isActive
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }
                >
                  {isActive ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-border text-foreground hover:bg-card"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <Card className="p-4 md:p-6 backdrop-blur-sm border-border/50">
        <h4 className="text-sm font-semibold text-foreground mb-3">Today's Sessions</h4>
        <div className="space-y-2">
          {[
            { time: '9:00-9:30', duration: '30 min' },
            { time: '10:15-11:15', duration: '60 min' },
            { time: '2:00-2:45', duration: '45 min' },
          ].map((session, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{session.time}</span>
              <span className="font-medium text-foreground">{session.duration}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Streak Info */}
      <Card className="p-4 md:p-6 backdrop-blur-sm border-border/50">
        <h4 className="text-sm font-semibold text-foreground mb-3">Current Streak</h4>
        <div className="space-y-3">
          <div>
            <p className="text-3xl font-bold text-foreground mb-1">5 Days</p>
            <p className="text-xs text-muted-foreground">Keep it going!</p>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-sm ${
                  i < 5 ? 'bg-gradient-to-r from-purple-500 to-cyan-500' : 'bg-card'
                }`}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
