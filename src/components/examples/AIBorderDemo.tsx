'use client'

import React, { useState, useEffect } from 'react'
import { 
  AIBorderWrapper, 
  ManuscriptBorderWrapper, 
  FrameworkBorderWrapper, 
  SidebarBorderWrapper,
  ToolbarBorderWrapper 
} from '@/components/ai/AIBorderWrapper'

export const AIBorderDemo: React.FC = () => {
  const [aiState, setAiState] = useState<'idle' | 'thinking' | 'generating' | 'analyzing' | 'error'>('idle')
  const [confidence, setConfidence] = useState(0.7)
  const [quality, setQuality] = useState(0.8)
  const [processingSpeed, setProcessingSpeed] = useState(1200)
  const [showDataFlow, setShowDataFlow] = useState(true)

  // Simulate AI activity cycle
  useEffect(() => {
    const cycle = async () => {
      setAiState('thinking')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setAiState('generating')
      setConfidence(0.4)
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      setAiState('analyzing')
      setConfidence(0.8)
      setQuality(0.9)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setAiState('idle')
      setConfidence(0.85)
      await new Promise(resolve => setTimeout(resolve, 4000))
    }

    const interval = setInterval(cycle, 12000)
    cycle() // Start immediately

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">AI Border Effects Demo</h1>
        
        {/* Control Panel */}
        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Controls</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">AI State</label>
              <select 
                value={aiState} 
                onChange={(e) => setAiState(e.target.value as any)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="idle">Idle</option>
                <option value="thinking">Thinking</option>
                <option value="generating">Generating</option>
                <option value="analyzing">Analyzing</option>
                <option value="error">Error</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Confidence: {confidence.toFixed(2)}</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Quality: {quality.toFixed(2)}</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Speed: {processingSpeed}ms</label>
              <input 
                type="range" 
                min="500" 
                max="3000" 
                step="100" 
                value={processingSpeed}
                onChange={(e) => setProcessingSpeed(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={showDataFlow}
                onChange={(e) => setShowDataFlow(e.target.checked)}
                className="mr-2"
              />
              Show Data Flow Visualization
            </label>
          </div>
        </div>

        {/* Main Layout Demo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
          {/* Manuscript Area (60%) */}
          <div className="lg:col-span-2">
            <ManuscriptBorderWrapper
              aiState={aiState}
              confidence={confidence}
              quality={quality}
              processingSpeed={processingSpeed}
              showDataFlow={showDataFlow}
              dataFlowDirection="manuscript-to-framework"
              className="h-full"
              intensity="normal"
            >
              <div className="p-6 h-full bg-white dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Manuscript Surface</h3>
                <div className="space-y-3 text-gray-600 dark:text-gray-300">
                  <p>Neural effects respond to AI processing states</p>
                  <p>Confidence indicators show AI certainty levels</p>
                  <p>Quality resonance reflects suggestion quality</p>
                  <p className="text-sm italic">Click anywhere to trigger context ripples</p>
                </div>
                
                <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                  Current State: <span className="font-mono">{aiState}</span><br/>
                  Confidence: <span className="font-mono">{(confidence * 100).toFixed(0)}%</span><br/>
                  Quality: <span className="font-mono">{(quality * 100).toFixed(0)}%</span>
                </div>
              </div>
            </ManuscriptBorderWrapper>
          </div>

          {/* Framework Area (40%) */}
          <div>
            <FrameworkBorderWrapper
              aiState={aiState}
              showDataFlow={showDataFlow}
              dataFlowDirection="framework-to-manuscript"
              isCollaborating={true}
              syncStatus="active"
              className="h-full"
              intensity="normal"
            >
              <div className="p-6 h-full bg-white dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Framework Surface</h3>
                <div className="space-y-3 text-gray-600 dark:text-gray-300">
                  <p>Data flow visualization</p>
                  <p>Context-aware ripples</p>
                  <p>Collaboration sync indicators</p>
                </div>
                
                <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                  Data Flow: <span className="font-mono">Bidirectional</span><br/>
                  Sync: <span className="font-mono">Active</span>
                </div>
              </div>
            </FrameworkBorderWrapper>
          </div>
        </div>

        {/* Individual Effect Demonstrations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {/* Neural Network Effect */}
          <AIBorderWrapper
            effects={['neural']}
            aiState={aiState}
            className="p-6 bg-white dark:bg-gray-800 rounded-lg"
          >
            <h3 className="font-semibold mb-2">Neural Network Effect</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Pulsing border that responds to AI processing intensity
            </p>
          </AIBorderWrapper>

          {/* Confidence Indicator */}
          <AIBorderWrapper
            effects={['confidence']}
            confidence={confidence}
            className="p-6 bg-white dark:bg-gray-800 rounded-lg"
          >
            <h3 className="font-semibold mb-2">Confidence Indicator</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Circular progress showing AI confidence level
            </p>
          </AIBorderWrapper>

          {/* Data Flow */}
          <AIBorderWrapper
            effects={['dataflow']}
            showDataFlow={showDataFlow}
            dataFlowDirection="bidirectional"
            className="p-6 bg-white dark:bg-gray-800 rounded-lg"
          >
            <h3 className="font-semibold mb-2">Data Flow</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Animated flow lines between surfaces
            </p>
          </AIBorderWrapper>

          {/* Quality Resonance */}
          <AIBorderWrapper
            effects={['resonance']}
            quality={quality}
            className="p-6 bg-white dark:bg-gray-800 rounded-lg"
          >
            <h3 className="font-semibold mb-2">Quality Resonance</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Subtle glow indicating suggestion quality
            </p>
          </AIBorderWrapper>

          {/* Context Ripples */}
          <AIBorderWrapper
            effects={['context']}
            className="p-6 bg-white dark:bg-gray-800 rounded-lg"
            onContextInteraction={(x, y) => console.log(`Ripple at ${x.toFixed(1)}, ${y.toFixed(1)}`)}
          >
            <h3 className="font-semibold mb-2">Context Ripples</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Click anywhere to see contextual awareness ripples
            </p>
          </AIBorderWrapper>

          {/* Sync Indicators */}
          <AIBorderWrapper
            effects={['sync']}
            isCollaborating={true}
            syncStatus="active"
            className="p-6 bg-white dark:bg-gray-800 rounded-lg"
          >
            <h3 className="font-semibold mb-2">Sync Indicators</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Real-time collaboration status
            </p>
          </AIBorderWrapper>
        </div>

        {/* Sidebar and Toolbar Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <SidebarBorderWrapper
            aiState={aiState}
            isCollaborating={true}
            className="p-6 bg-white dark:bg-gray-800 rounded-lg min-h-32"
          >
            <h3 className="font-semibold mb-2">AI Chat Sidebar Style</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Subtle effects for sidebar elements
            </p>
          </SidebarBorderWrapper>

          <ToolbarBorderWrapper
            confidence={confidence}
            quality={quality}
            className="p-6 bg-white dark:bg-gray-800 rounded-lg min-h-32"
          >
            <h3 className="font-semibold mb-2">AI Toolbar Style</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Minimal effects for toolbar components
            </p>
          </ToolbarBorderWrapper>
        </div>

        {/* Legend */}
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">AI State Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Idle - Soft blue glow</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Thinking - Warm yellow pulse</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Generating - Active green</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span>Analyzing - Purple resonance</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Error - Red warning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIBorderDemo