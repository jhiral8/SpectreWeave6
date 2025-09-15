/**
 * Consistency Analyzer Component
 * 
 * Real-time consistency scoring and feedback for character appearances
 */

'use client'

import { useState, useEffect } from 'react'
import { X, TrendingUp, AlertTriangle, CheckCircle, Eye, RefreshCw, BarChart3, Camera } from 'lucide-react'
import type { CharacterProfile, CharacterAppearance, ConsistencyValidationResult } from '@/lib/ai/characterLock'

interface ConsistencyAnalyzerProps {
  character: CharacterProfile
  onClose: () => void
  onUpdate: () => void
}

export function ConsistencyAnalyzer({ character, onClose, onUpdate }: ConsistencyAnalyzerProps) {
  const [appearances, setAppearances] = useState<CharacterAppearance[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedAppearance, setSelectedAppearance] = useState<CharacterAppearance | null>(null)
  const [validationResult, setValidationResult] = useState<ConsistencyValidationResult | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    consistent: 0,
    averageScore: 0,
    recentTrend: 0
  })
  const [view, setView] = useState<'overview' | 'appearances' | 'analysis'>('overview')

  useEffect(() => {
    loadAppearances()
  }, [character.id])

  const loadAppearances = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/characters/validate?characterId=${character.id}&limit=20`)
      const data = await response.json()
      
      if (data.success) {
        setAppearances(data.appearances)
        setStats(data.statistics)
      } else {
        console.error('Failed to load appearances:', data.error)
      }
    } catch (error) {
      console.error('Error loading appearances:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeAppearance = async (appearance: CharacterAppearance) => {
    try {
      setAnalyzing(true)
      setSelectedAppearance(appearance)
      
      const response = await fetch('/api/characters/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          imageUrl: appearance.imageUrl,
          promptUsed: appearance.promptUsed
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setValidationResult(data.validation)
        setView('analysis')
      } else {
        alert('Failed to analyze appearance: ' + data.error)
      }
    } catch (error) {
      console.error('Error analyzing appearance:', error)
      alert('Failed to analyze appearance')
    } finally {
      setAnalyzing(false)
    }
  }

  const getConsistencyColor = (score: number) => {
    if (score >= 0.8) return 'text-emerald-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConsistencyBg = (score: number) => {
    if (score >= 0.8) return 'bg-emerald-100 dark:bg-emerald-900/20'
    if (score >= 0.6) return 'bg-yellow-100 dark:bg-yellow-900/20'
    return 'bg-red-100 dark:bg-red-900/20'
  }

  const formatScore = (score: number) => Math.round(score * 100)

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--primary]"></div>
          <span className="ml-2">Loading consistency data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-heading font-bold">Consistency Analysis</h2>
          <p className="text-[--muted-foreground]">{character.name}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-[--border] overflow-hidden">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'appearances', label: 'Appearances', icon: Camera },
              { id: 'analysis', label: 'Analysis', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm ${
                    view === tab.id 
                      ? 'bg-[--primary] text-[--primary-foreground]' 
                      : 'bg-[--background] hover:bg-[--muted]/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[--muted]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {view === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border border-[--border] rounded-xl bg-[--card]">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-[--muted-foreground]">Total Appearances</div>
            </div>
            
            <div className="p-4 border border-[--border] rounded-xl bg-[--card]">
              <div className="text-2xl font-bold text-emerald-600">{stats.consistent}</div>
              <div className="text-sm text-[--muted-foreground]">Consistent</div>
            </div>
            
            <div className="p-4 border border-[--border] rounded-xl bg-[--card]">
              <div className={`text-2xl font-bold ${getConsistencyColor(stats.averageScore)}`}>
                {formatScore(stats.averageScore)}%
              </div>
              <div className="text-sm text-[--muted-foreground]">Average Score</div>
            </div>
            
            <div className="p-4 border border-[--border] rounded-xl bg-[--card]">
              <div className={`text-2xl font-bold ${getConsistencyColor(stats.recentTrend)}`}>
                {formatScore(stats.recentTrend)}%
              </div>
              <div className="text-sm text-[--muted-foreground]">Recent Trend</div>
            </div>
          </div>

          {/* Consistency Timeline */}
          {appearances.length > 0 && (
            <div className="border border-[--border] rounded-xl p-6 bg-[--card]">
              <h3 className="text-lg font-semibold mb-4">Consistency Over Time</h3>
              <div className="space-y-2">
                {appearances.slice(0, 10).map((appearance, index) => (
                  <div key={appearance.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[--muted]" />
                    <img 
                      src={appearance.imageUrl} 
                      alt={`Appearance ${index + 1}`}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Page {appearance.pageId || 'N/A'}</div>
                      <div className="text-xs text-[--muted-foreground]">
                        {new Date(appearance.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${getConsistencyBg(appearance.consistencyScore)}`}>
                      <span className={getConsistencyColor(appearance.consistencyScore)}>
                        {formatScore(appearance.consistencyScore)}%
                      </span>
                    </div>
                    <button
                      onClick={() => analyzeAppearance(appearance)}
                      className="p-2 rounded hover:bg-[--muted]/50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Character Profile Summary */}
          <div className="border border-[--border] rounded-xl p-6 bg-[--card]">
            <h3 className="text-lg font-semibold mb-4">Character Profile</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Physical Traits</h4>
                <div className="space-y-1 text-sm text-[--muted-foreground]">
                  {character.physicalTraits?.hairColor && (
                    <div>Hair: {character.physicalTraits.hairColor} {character.physicalTraits.hairStyle}</div>
                  )}
                  {character.physicalTraits?.eyeColor && (
                    <div>Eyes: {character.physicalTraits.eyeColor}</div>
                  )}
                  {character.physicalTraits?.height && (
                    <div>Height: {character.physicalTraits.height}</div>
                  )}
                  {character.physicalTraits?.clothing?.primary_outfit && (
                    <div>Outfit: {character.physicalTraits.clothing.primary_outfit}</div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Personality Traits</h4>
                <div className="flex flex-wrap gap-1">
                  {character.personalityTraits?.primary?.slice(0, 5).map((trait, index) => (
                    <span 
                      key={index}
                      className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appearances Tab */}
      {view === 'appearances' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">All Appearances ({appearances.length})</h3>
            <button
              onClick={loadAppearances}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 border border-[--border] rounded-md hover:bg-[--muted]/50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {appearances.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-[--border] rounded-xl">
              <Camera className="w-12 h-12 mx-auto mb-4 text-[--muted-foreground]" />
              <h3 className="text-lg font-semibold mb-2">No Appearances Yet</h3>
              <p className="text-[--muted-foreground]">
                Character appearances will appear here after generating images
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appearances.map((appearance) => (
                <div key={appearance.id} className="border border-[--border] rounded-xl bg-[--card] overflow-hidden">
                  <img
                    src={appearance.imageUrl}
                    alt="Character appearance"
                    className="w-full h-40 object-cover"
                  />
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">
                        Page {appearance.pageId || 'N/A'}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${getConsistencyBg(appearance.consistencyScore)}`}>
                        <span className={getConsistencyColor(appearance.consistencyScore)}>
                          {formatScore(appearance.consistencyScore)}%
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-[--muted-foreground] line-clamp-2 mb-3">
                      {appearance.promptUsed}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-[--muted-foreground]">
                        {new Date(appearance.createdAt).toLocaleDateString()}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {appearance.validated ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        )}
                        
                        <button
                          onClick={() => analyzeAppearance(appearance)}
                          disabled={analyzing}
                          className="p-1 rounded hover:bg-[--muted]/50 transition-colors disabled:opacity-50"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analysis Tab */}
      {view === 'analysis' && validationResult && selectedAppearance && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <img
              src={selectedAppearance.imageUrl}
              alt="Selected appearance"
              className="w-24 h-24 rounded-lg object-cover"
            />
            
            <div>
              <h3 className="text-lg font-semibold">Analysis Results</h3>
              <p className="text-[--muted-foreground]">
                Page {selectedAppearance.pageId || 'N/A'} • {new Date(selectedAppearance.createdAt).toLocaleDateString()}
              </p>
              
              <div className="flex items-center gap-2 mt-2">
                {validationResult.isConsistent ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-semibold ${getConsistencyColor(validationResult.overallScore)}`}>
                  {formatScore(validationResult.overallScore)}% Overall Consistency
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="border border-[--border] rounded-xl p-6 bg-[--card]">
            <h4 className="font-semibold mb-4">Similarity Breakdown</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(validationResult.breakdown).map(([aspect, score]) => (
                <div key={aspect} className="text-center">
                  <div className={`text-lg font-bold ${getConsistencyColor(score)}`}>
                    {formatScore(score)}%
                  </div>
                  <div className="text-sm text-[--muted-foreground] capitalize">
                    {aspect.replace('_', ' ')}
                  </div>
                  <div className="w-full bg-[--muted] rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${
                        score >= 0.8 ? 'bg-emerald-500' :
                        score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${score * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          {validationResult.issues.length > 0 && (
            <div className="border border-[--border] rounded-xl p-6 bg-[--card]">
              <h4 className="font-semibold mb-4">Identified Issues</h4>
              
              <div className="space-y-3">
                {validationResult.issues.map((issue, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    issue.severity === 'high' ? 'bg-red-50 dark:bg-red-900/20' :
                    issue.severity === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                    'bg-blue-50 dark:bg-blue-900/20'
                  }`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                        issue.severity === 'high' ? 'text-red-600' :
                        issue.severity === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                      
                      <div className="flex-1">
                        <div className="font-medium">{issue.description}</div>
                        <div className="text-sm text-[--muted-foreground] mt-1">
                          {issue.suggestion}
                        </div>
                        <div className="text-xs text-[--muted-foreground] mt-2">
                          Confidence: {formatScore(issue.confidence)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {validationResult.recommendations.length > 0 && (
            <div className="border border-[--border] rounded-xl p-6 bg-[--card]">
              <h4 className="font-semibold mb-4">Recommendations</h4>
              
              <div className="space-y-2">
                {validationResult.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <span className="text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {analyzing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[--background] rounded-xl p-6 border border-[--border]">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[--primary]"></div>
              <span>Analyzing consistency...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}