'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { 
  FileText, 
  TrendingUp, 
  Bot, 
  Target,
  Plus,
  BarChart3,
  Settings,
  ExternalLink,
  Clock,
  CheckCircle2,
  Circle,
  PlayCircle
} from 'lucide-react'

interface Project {
  id: string
  title: string
  updated_at: string
  status?: string
}

interface StatsCardProps {
  title: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
}

const StatsCard = ({ title, value, change, trend = 'neutral', icon: Icon }: StatsCardProps) => {
  return (
    <div className="rounded-xl border border-[--border] bg-[--card] p-6 hover:shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[--muted-foreground] font-medium">{title}</p>
          <p className="text-2xl font-bold text-[--foreground] mt-1">{value}</p>
          {change && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${
              trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
              trend === 'down' ? 'text-red-600 dark:text-red-400' :
              'text-[--muted-foreground]'
            }`}>
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {change}
            </p>
          )}
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-br from-[#8ec5ff]/10 via-[#b39fff]/10 to-[#ff9ecf]/10">
          <Icon className="w-5 h-5 text-[--foreground]" />
        </div>
      </div>
    </div>
  )
}

interface ProjectCardProps {
  project: Project
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-[--border] hover:bg-[--muted]/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] flex items-center justify-center text-white text-sm font-bold">
          {project.title.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-medium text-[--foreground]">{project.title}</h3>
          <p className="text-sm text-[--muted-foreground]">Updated {formatDate(project.updated_at)}</p>
        </div>
      </div>
      <Link 
        href={`/portal/projects/${project.id}`}
        className="text-sm text-[--primary] hover:text-[--primary]/80 font-medium flex items-center gap-1"
      >
        Open <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  )
}

interface ProgressBarProps {
  label: string
  current: number
  target: number
  color: string
}

const ProgressBar = ({ label, current, target, color }: ProgressBarProps) => {
  const percentage = Math.min((current / target) * 100, 100)
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-[--foreground]">{label}</span>
        <span className="text-sm text-[--muted-foreground]">{current}/{target}</span>
      </div>
      <div className="w-full bg-[--muted] rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default function PortalDashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Get recent projects
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, title, updated_at, status')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(3)
        
        setProjects(projectsData || [])
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [])


  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-[--muted] rounded w-1/3" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-[--muted] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-[--foreground]">
              Dashboard
            </h1>
            <p className="text-[--muted-foreground] mt-1">
              Your creative workspace overview
            </p>
          </div>
          <div className="flex gap-2">
            <Link 
              href="/portal/projects"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-[--card] border border-[--border] hover:bg-[--muted]/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Link>
            <Link 
              href="/portal/analytics"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] text-white hover:opacity-90 transition-opacity"
            >
              <BarChart3 className="w-4 h-4" />
              View Analytics
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Words This Week"
            value="2,847"
            change="+12% from last week"
            trend="up"
            icon={FileText}
          />
          <StatsCard
            title="Active Projects"
            value={projects.length.toString()}
            change="2 in progress"
            trend="neutral"
            icon={Target}
          />
          <StatsCard
            title="AI Interactions"
            value="23"
            change="+8 today"
            trend="up"
            icon={Bot}
          />
          <StatsCard
            title="Completion Rate"
            value="87%"
            change="+5% this month"
            trend="up"
            icon={TrendingUp}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Projects */}
            <div className="rounded-xl border border-[--border] bg-[--card] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[--foreground]">Recent Projects</h2>
                <Link 
                  href="/portal/projects"
                  className="text-sm text-[--primary] hover:text-[--primary]/80 font-medium"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))
                ) : (
                  <div className="text-center py-8 text-[--muted-foreground]">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No projects yet. Create your first project to get started!</p>
                    <Link 
                      href="/portal/projects"
                      className="inline-flex items-center gap-2 mt-3 text-sm text-[--primary] hover:text-[--primary]/80"
                    >
                      <Plus className="w-4 h-4" />
                      Create Project
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Writing Progress */}
            <div className="rounded-xl border border-[--border] bg-[--card] p-6">
              <h2 className="text-xl font-semibold text-[--foreground] mb-6">Writing Progress</h2>
              <div className="space-y-6">
                <ProgressBar
                  label="Daily Goal"
                  current={847}
                  target={1000}
                  color="bg-gradient-to-r from-emerald-500 to-emerald-600"
                />
                <ProgressBar
                  label="Weekly Goal"
                  current={2847}
                  target={5000}
                  color="bg-gradient-to-r from-blue-500 to-blue-600"
                />
                <ProgressBar
                  label="Monthly Goal"
                  current={8234}
                  target={15000}
                  color="bg-gradient-to-r from-purple-500 to-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Today's Focus */}
            <div className="rounded-xl border border-[--border] bg-[--card] p-6">
              <h2 className="text-xl font-semibold text-[--foreground] mb-4">Today's Focus</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm text-[--muted-foreground] line-through">Review Chapter 3</span>
                </div>
                <div className="flex items-center gap-3">
                  <PlayCircle className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-[--foreground]">Write 1,000 words</span>
                </div>
                <div className="flex items-center gap-3">
                  <Circle className="w-5 h-5 text-[--muted-foreground]" />
                  <span className="text-sm text-[--muted-foreground]">Plan Chapter 5</span>
                </div>
              </div>
            </div>

            {/* AI Writing Assistant */}
            <div className="rounded-xl border border-[--border] bg-[--card] p-6">
              <h2 className="text-xl font-semibold text-[--foreground] mb-4">AI Writing Assistant</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[--muted-foreground]">Today's Interactions</span>
                  <span className="text-lg font-semibold text-[--foreground]">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[--muted-foreground]">Words Generated</span>
                  <span className="text-lg font-semibold text-[--foreground]">342</span>
                </div>
                <Link 
                  href="/portal/agents"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] text-white hover:opacity-90 transition-opacity"
                >
                  <Bot className="w-4 h-4" />
                  Launch AI Assistant
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border border-[--border] bg-[--card] p-6">
              <h2 className="text-xl font-semibold text-[--foreground] mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[--foreground] truncate">Document saved</p>
                    <p className="text-xs text-[--muted-foreground]">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[--foreground] truncate">AI suggestion applied</p>
                    <p className="text-xs text-[--muted-foreground]">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[--foreground] truncate">New project created</p>
                    <p className="text-xs text-[--muted-foreground]">1 hour ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}