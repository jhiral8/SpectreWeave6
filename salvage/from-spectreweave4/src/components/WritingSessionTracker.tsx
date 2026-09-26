import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  FileText, 
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';

interface WritingSession {
  id: string;
  projectId: string;
  startTime: string;
  endTime?: string;
  wordsWritten: number;
  duration: number; // in minutes
  productivity: number; // words per minute
  isActive: boolean;
}

interface WritingSessionTrackerProps {
  projectId: string;
  currentWordCount: number;
  onSessionUpdate: (session: WritingSession) => void;
}

export function WritingSessionTracker({ 
  projectId, 
  currentWordCount, 
  onSessionUpdate 
}: WritingSessionTrackerProps) {
  const [session, setSession] = useState<WritingSession | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [initialWordCount, setInitialWordCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing session from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('ghostweave_writing_sessions');
    if (savedSessions) {
      const sessions: WritingSession[] = JSON.parse(savedSessions);
      const activeSession = sessions.find(s => s.projectId === projectId && s.isActive);
      if (activeSession) {
        setSession(activeSession);
        setIsTracking(true);
        setInitialWordCount(currentWordCount - (activeSession.wordsWritten || 0));
        
        // Calculate elapsed time
        const startTime = new Date(activeSession.startTime);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }
    }
  }, [projectId]);

  // Update elapsed time every second when tracking
  useEffect(() => {
    if (isTracking) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking]);

  const startSession = () => {
    const newSession: WritingSession = {
      id: crypto.randomUUID(),
      projectId,
      startTime: new Date().toISOString(),
      wordsWritten: 0,
      duration: 0,
      productivity: 0,
      isActive: true
    };

    setSession(newSession);
    setIsTracking(true);
    setInitialWordCount(currentWordCount);
    setElapsedTime(0);

    // Save to localStorage
    const savedSessions = localStorage.getItem('ghostweave_writing_sessions');
    const sessions: WritingSession[] = savedSessions ? JSON.parse(savedSessions) : [];
    sessions.push(newSession);
    localStorage.setItem('ghostweave_writing_sessions', JSON.stringify(sessions));

    onSessionUpdate(newSession);
  };

  const pauseSession = () => {
    if (!session) return;

    setIsTracking(false);
    const updatedSession = { ...session, isActive: false };
    setSession(updatedSession);

    // Update localStorage
    const savedSessions = localStorage.getItem('ghostweave_writing_sessions');
    const sessions: WritingSession[] = savedSessions ? JSON.parse(savedSessions) : [];
    const updatedSessions = sessions.map(s => 
      s.id === session.id ? updatedSession : s
    );
    localStorage.setItem('ghostweave_writing_sessions', JSON.stringify(updatedSessions));

    onSessionUpdate(updatedSession);
  };

  const resumeSession = () => {
    if (!session) return;

    setIsTracking(true);
    const updatedSession = { ...session, isActive: true };
    setSession(updatedSession);

    // Update localStorage
    const savedSessions = localStorage.getItem('ghostweave_writing_sessions');
    const sessions: WritingSession[] = savedSessions ? JSON.parse(savedSessions) : [];
    const updatedSessions = sessions.map(s => 
      s.id === session.id ? updatedSession : s
    );
    localStorage.setItem('ghostweave_writing_sessions', JSON.stringify(updatedSessions));

    onSessionUpdate(updatedSession);
  };

  const endSession = () => {
    if (!session) return;

    const wordsWritten = currentWordCount - initialWordCount;
    const durationMinutes = Math.round(elapsedTime / 60);
    const productivity = durationMinutes > 0 ? Math.round(wordsWritten / durationMinutes) : 0;

    const endedSession: WritingSession = {
      ...session,
      endTime: new Date().toISOString(),
      wordsWritten,
      duration: durationMinutes,
      productivity,
      isActive: false
    };

    setSession(null);
    setIsTracking(false);
    setElapsedTime(0);

    // Update localStorage
    const savedSessions = localStorage.getItem('ghostweave_writing_sessions');
    const sessions: WritingSession[] = savedSessions ? JSON.parse(savedSessions) : [];
    const updatedSessions = sessions.map(s => 
      s.id === session.id ? endedSession : s
    );
    localStorage.setItem('ghostweave_writing_sessions', JSON.stringify(updatedSessions));

    onSessionUpdate(endedSession);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const wordsWritten = session ? currentWordCount - initialWordCount : 0;
  const durationMinutes = Math.round(elapsedTime / 60);
  const productivity = durationMinutes > 0 ? Math.round(wordsWritten / durationMinutes) : 0;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Writing Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!session ? (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Track your writing progress and productivity
            </p>
            <Button onClick={startSession} className="w-full gap-2">
              <Play className="w-4 h-4" />
              Start Session
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Session Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-semibold">{formatTime(elapsedTime)}</p>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">Words</p>
                <p className="font-semibold">{wordsWritten}</p>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">WPM</p>
                <p className="font-semibold">{productivity}</p>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={isTracking ? 'default' : 'secondary'} className="text-xs">
                  {isTracking ? 'Active' : 'Paused'}
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Session Progress</span>
                <span>{wordsWritten} words written</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((wordsWritten / 1000) * 100, 100)}%`,
                    minWidth: '4px'
                  }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              {isTracking ? (
                <>
                  <Button variant="outline" onClick={pauseSession} className="flex-1 gap-2">
                    <Pause className="w-4 h-4" />
                    Pause
                  </Button>
                  <Button variant="destructive" onClick={endSession} className="flex-1 gap-2">
                    <Square className="w-4 h-4" />
                    End
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={resumeSession} className="flex-1 gap-2">
                    <Play className="w-4 h-4" />
                    Resume
                  </Button>
                  <Button variant="destructive" onClick={endSession} className="flex-1 gap-2">
                    <Square className="w-4 h-4" />
                    End
                  </Button>
                </>
              )}
            </div>

            {/* Session Insights */}
            {wordsWritten > 0 && (
              <div className="pt-3 border-t">
                <h4 className="text-sm font-medium mb-2">Session Insights</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Target className="w-3 h-3 text-blue-500" />
                    <span>Goal: {Math.round(wordsWritten / 100) * 100 + 100} words</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span>Productivity: {productivity} words/minute</span>
                  </div>
                  {productivity > 0 && (
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      <span>
                        {productivity > 50 ? 'Excellent' : productivity > 30 ? 'Good' : 'Steady'} pace
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}