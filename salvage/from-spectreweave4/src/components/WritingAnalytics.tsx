import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Calendar, 
  Clock, 
  BookOpen, 
  FileText, 
  Zap,
  Award,
  Trophy,
  Star,
  Flame,
  CalendarDays,
  Activity,
  LineChart,
  PieChart,
  BarChart,
  Target as TargetIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  Save,
  RefreshCw
} from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useGenres } from '../hooks/useGenres';

interface WritingGoal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'project';
  target: number;
  current: number;
  unit: 'words' | 'hours' | 'chapters' | 'pages';
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  projectId?: string;
  completed: boolean;
}

interface WritingSession {
  id: string;
  projectId: string;
  startTime: string;
  endTime?: string;
  wordsWritten: number;
  duration: number; // in minutes
  productivity: number; // words per minute
}

interface AnalyticsData {
  totalWords: number;
  totalProjects: number;
  activeProjects: number;
  averageProgress: number;
  writingStreak: number;
  bestDay: { date: string; words: number };
  weeklyAverage: number;
  monthlyAverage: number;
  genreBreakdown: { [key: string]: number };
  productivityTrend: { date: string; words: number }[];
}

export function WritingAnalytics() {
  const { projects, updateProject } = useProjects();
  const { genres } = useGenres();
  const [goals, setGoals] = useState<WritingGoal[]>([]);
  const [sessions, setSessions] = useState<WritingSession[]>([]);
  const [newGoal, setNewGoal] = useState<Partial<WritingGoal>>({});
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('week');

  // Helper function to calculate project progress
  const getProjectProgress = (project: any) => {
    // Calculate progress based on word count vs target length
    const targetLength = project.brief?.targetLength;
    if (!targetLength || !project.wordCount) return 0;
    
    const targetWords = parseInt(targetLength.split('-')[0].replace(/,/g, ''));
    return Math.min(Math.round((project.wordCount / targetWords) * 100), 100);
  };

  // Load goals and sessions from localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem('ghostweave_writing_goals');
    const savedSessions = localStorage.getItem('ghostweave_writing_sessions');
    
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Save goals and sessions to localStorage
  useEffect(() => {
    localStorage.setItem('ghostweave_writing_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('ghostweave_writing_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Calculate analytics data
  const analyticsData = useMemo((): AnalyticsData => {
    const totalWords = projects.reduce((sum, p) => sum + (p.wordCount || 0), 0);
    const activeProjects = projects.filter(p => !p.archived).length;
    const averageProgress = projects.length > 0 
      ? Math.round(projects.reduce((sum, p) => sum + getProjectProgress(p), 0) / projects.length)
      : 0;

    // Calculate genre breakdown
    const genreBreakdown: { [key: string]: number } = {};
    projects.forEach(project => {
      const genre = project.genre || 'general';
      genreBreakdown[genre] = (genreBreakdown[genre] || 0) + (project.wordCount || 0);
    });

    // Calculate productivity trend (last 30 days)
    const productivityTrend = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Calculate words written on this date (simplified - in real app would track daily changes)
      const wordsOnDate = Math.floor(Math.random() * 1000); // Placeholder
      productivityTrend.push({ date: dateStr, words: wordsOnDate });
    }

    // Calculate writing streak (simplified)
    const writingStreak = Math.floor(Math.random() * 15) + 1; // Placeholder

    // Find best day
    const bestDay = productivityTrend.reduce((best, current) => 
      current.words > best.words ? current : best
    );

    // Calculate averages
    const weeklyAverage = Math.round(productivityTrend.slice(-7).reduce((sum, day) => sum + day.words, 0) / 7);
    const monthlyAverage = Math.round(productivityTrend.reduce((sum, day) => sum + day.words, 0) / 30);

    return {
      totalWords,
      totalProjects: projects.length,
      activeProjects,
      averageProgress,
      writingStreak,
      bestDay,
      weeklyAverage,
      monthlyAverage,
      genreBreakdown,
      productivityTrend
    };
  }, [projects]);

  const getWordCountDisplay = (wordCount: number) => {
    if (wordCount < 1000) return `${wordCount} words`;
    if (wordCount < 1000000) return `${(wordCount / 1000).toFixed(1)}k words`;
    return `${(wordCount / 1000000).toFixed(1)}M words`;
  };

  const getGenreIcon = (genre: string) => {
    const icons: { [key: string]: React.ComponentType<any> } = {
      'sci-fi-fantasy': Zap,
      'mystery-thriller': BarChart3,
      'romance': Star,
      'horror': Flame,
      'historical-fiction': BookOpen,
      'general': FileText
    };
    return icons[genre] || FileText;
  };

  const getGenreColor = (genre: string) => {
    const colors: { [key: string]: string } = {
      'sci-fi-fantasy': 'text-blue-500',
      'mystery-thriller': 'text-slate-500',
      'romance': 'text-pink-500',
      'horror': 'text-red-500',
      'historical-fiction': 'text-emerald-500',
      'general': 'text-gray-500'
    };
    return colors[genre] || 'text-gray-500';
  };

  const addGoal = () => {
    if (!newGoal.type || !newGoal.target || !newGoal.title) return;

    const goal: WritingGoal = {
      id: crypto.randomUUID(),
      type: newGoal.type as any,
      target: newGoal.target!,
      current: 0,
      unit: newGoal.unit as any || 'words',
      title: newGoal.title!,
      description: newGoal.description,
      startDate: new Date().toISOString(),
      endDate: newGoal.endDate,
      projectId: newGoal.projectId,
      completed: false
    };

    setGoals([...goals, goal]);
    setNewGoal({});
    setShowGoalForm(false);
  };

  const updateGoal = (goalId: string, updates: Partial<WritingGoal>) => {
    setGoals(goals.map(goal => 
      goal.id === goalId ? { ...goal, ...updates } : goal
    ));
  };

  const deleteGoal = (goalId: string) => {
    setGoals(goals.filter(goal => goal.id !== goalId));
  };

  const startWritingSession = (projectId: string) => {
    const session: WritingSession = {
      id: crypto.randomUUID(),
      projectId,
      startTime: new Date().toISOString(),
      wordsWritten: 0,
      duration: 0,
      productivity: 0
    };
    setSessions([...sessions, session]);
  };

  const endWritingSession = (sessionId: string, wordsWritten: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const endTime = new Date();
    const startTime = new Date(session.startTime);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes
    const productivity = duration > 0 ? Math.round(wordsWritten / duration) : 0;

    const updatedSession = {
      ...session,
      endTime: endTime.toISOString(),
      wordsWritten,
      duration,
      productivity
    };

    setSessions(sessions.map(s => s.id === sessionId ? updatedSession : s));
  };

  const getGoalProgress = (goal: WritingGoal) => {
    return Math.min((goal.current / goal.target) * 100, 100);
  };

  const getGoalStatus = (goal: WritingGoal) => {
    const progress = getGoalProgress(goal);
    if (progress >= 100) return { status: 'completed', color: 'text-green-500', icon: CheckCircle };
    if (progress >= 75) return { status: 'on-track', color: 'text-blue-500', icon: TargetIcon };
    if (progress >= 50) return { status: 'in-progress', color: 'text-yellow-500', icon: AlertCircle };
    return { status: 'behind', color: 'text-red-500', icon: XCircle };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Writing Analytics</h1>
          <p className="text-muted-foreground">Track your progress and achieve your writing goals</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Words</p>
                <p className="text-2xl font-bold">{getWordCountDisplay(analyticsData.totalWords)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Active Projects</p>
                <p className="text-2xl font-bold">{analyticsData.activeProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Avg Progress</p>
                <p className="text-2xl font-bold">{analyticsData.averageProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Writing Streak</p>
                <p className="text-2xl font-bold">{analyticsData.writingStreak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Productivity Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Writing Trend
                </CardTitle>
                <CardDescription>Your daily word count over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant={selectedTimeframe === 'week' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTimeframe('week')}
                      >
                        Week
                      </Button>
                      <Button
                        variant={selectedTimeframe === 'month' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTimeframe('month')}
                      >
                        Month
                      </Button>
                      <Button
                        variant={selectedTimeframe === 'year' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTimeframe('year')}
                      >
                        Year
                      </Button>
                    </div>
                  </div>
                  
                  {/* Simple bar chart */}
                  <div className="h-48 flex items-end gap-1">
                    {analyticsData.productivityTrend.slice(-7).map((day, index) => (
                      <div key={index} className="flex-1 bg-muted rounded-t">
                        <div 
                          className="bg-primary rounded-t transition-all duration-300"
                          style={{ 
                            height: `${Math.min((day.words / 1000) * 100, 100)}%`,
                            minHeight: '4px'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Weekly Average</p>
                      <p className="font-semibold">{analyticsData.weeklyAverage} words/day</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Best Day</p>
                      <p className="font-semibold">{analyticsData.bestDay.words} words</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Genre Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Genre Distribution
                </CardTitle>
                <CardDescription>Words written by genre</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analyticsData.genreBreakdown).map(([genre, words]) => {
                    const percentage = analyticsData.totalWords > 0 
                      ? Math.round((words / analyticsData.totalWords) * 100) 
                      : 0;
                    const GenreIcon = getGenreIcon(genre);
                    
                    return (
                      <div key={genre} className="flex items-center gap-3">
                        <GenreIcon className={`w-4 h-4 ${getGenreColor(genre)}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{genres[genre]?.name || genre}</span>
                            <span className="text-muted-foreground">{percentage}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 mt-1">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Writing Goals</h2>
            <Button onClick={() => setShowGoalForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Goal
            </Button>
          </div>

          {showGoalForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Goal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="goal-title">Goal Title</Label>
                    <Input
                      id="goal-title"
                      value={newGoal.title || ''}
                      onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                      placeholder="e.g., Write 50,000 words this month"
                    />
                  </div>
                  <div>
                    <Label htmlFor="goal-type">Goal Type</Label>
                    <select
                      id="goal-type"
                      value={newGoal.type || ''}
                      onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select type...</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="project">Project-specific</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="goal-target">Target</Label>
                    <Input
                      id="goal-target"
                      type="number"
                      value={newGoal.target || ''}
                      onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) })}
                      placeholder="e.g., 1000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="goal-unit">Unit</Label>
                    <select
                      id="goal-unit"
                      value={newGoal.unit || ''}
                      onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="words">Words</option>
                      <option value="hours">Hours</option>
                      <option value="chapters">Chapters</option>
                      <option value="pages">Pages</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addGoal}>Save Goal</Button>
                  <Button variant="outline" onClick={() => setShowGoalForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => {
              const progress = getGoalProgress(goal);
              const status = getGoalStatus(goal);
              const StatusIcon = status.icon;

              return (
                <Card key={goal.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{goal.title}</CardTitle>
                      <StatusIcon className={`w-4 h-4 ${status.color}`} />
                    </div>
                    <CardDescription>
                      {goal.type} goal: {goal.target} {goal.unit}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{goal.current} / {goal.target} {goal.unit}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={goal.completed ? 'default' : 'secondary'}>
                          {goal.completed ? 'Completed' : `${progress}%`}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateGoal(goal.id, { current: goal.current + 100 })}
                        >
                          +100
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Writing Sessions
              </CardTitle>
              <CardDescription>Track your writing sessions and productivity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No writing sessions yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start a writing session to track your productivity
                    </p>
                    <Button onClick={() => startWritingSession(projects[0]?.id || '')}>
                      Start Session
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.slice(-5).reverse().map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {projects.find(p => p.id === session.projectId)?.title || 'Unknown Project'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.startTime).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{session.wordsWritten} words</p>
                          <p className="text-sm text-muted-foreground">
                            {session.duration} min • {session.productivity} wpm
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Project Progress
              </CardTitle>
              <CardDescription>Detailed progress for each project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project) => {
                  const progress = getProjectProgress(project);
                  const GenreIcon = getGenreIcon(project.genre);
                  
                  return (
                    <div key={project.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getGenreColor(project.genre).replace('text-', 'from-').replace('-500', '-500 to-600')} rounded-lg flex items-center justify-center`}>
                        <GenreIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{project.title}</h3>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{getWordCountDisplay(project.wordCount || 0)}</p>
                        <p className="text-sm text-muted-foreground">{progress}% complete</p>
                      </div>
                      <div className="w-32">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}