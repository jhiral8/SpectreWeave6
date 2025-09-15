'use client'

import React from 'react'
import { useManuscriptBorderEffects, useFrameworkBorderEffects } from '@/hooks/useAIBorderEffects'

/**
 * Test component to demonstrate AI border effects are working
 * This component shows the border effects without any background colors
 */
export const AIBorderTest: React.FC = () => {
  // Test manuscript border effects
  const manuscriptBorder = useManuscriptBorderEffects({ 
    quality: 'high',
    intensity: 0.8 
  })
  
  // Test framework border effects
  const frameworkBorder = useFrameworkBorderEffects({ 
    confidence: 0.9,
    isDataFlowing: true 
  })

  return (
    <div className="p-8 bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-8 text-center">
        AI Border Effects Test
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Manuscript Border Test */}
        <div 
          className={`h-96 p-6 ${manuscriptBorder.getManuscriptClasses()}`}
          style={manuscriptBorder.getCSSVariables()}
        >
          <div className="surface-label absolute top-4 left-4 z-50">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              Manuscript Surface
            </span>
          </div>
          
          <div className="pt-8 h-full flex flex-col justify-center">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Neural Network Border
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              This surface uses neural network activity borders with quality indicators.
              You should see a subtle blue glow around the border.
            </p>
            <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                <strong>Current State:</strong><br />
                Quality: {manuscriptBorder.borderState.quality}<br />
                Intensity: {manuscriptBorder.borderState.intensity}<br />
                Activity: {manuscriptBorder.borderState.activity}
              </p>
            </div>
          </div>
        </div>
        
        {/* Framework Border Test */}
        <div 
          className={`h-96 p-6 ${frameworkBorder.getFrameworkClasses()}`}
          style={frameworkBorder.getCSSVariables()}
        >
          <div className="surface-label absolute top-4 left-4 z-50">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              Framework Surface
            </span>
          </div>
          
          <div className="pt-8 h-full flex flex-col justify-center">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Confidence Visualization Border
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              This surface uses confidence level borders with data flow effects.
              You should see a colorful gradient border with flowing animations.
            </p>
            <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                <strong>Current State:</strong><br />
                Confidence: {Math.round(frameworkBorder.borderState.confidence * 100)}%<br />
                Data Flowing: {frameworkBorder.borderState.isDataFlowing ? 'Yes' : 'No'}<br />
                Activity: {frameworkBorder.borderState.activity}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Control Panel */}
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Test Controls
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manuscript Controls */}
          <div>
            <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
              Manuscript Border
            </h4>
            <div className="space-y-3">
              <button
                onClick={() => manuscriptBorder.setBorderActivity('thinking')}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Set Thinking State
              </button>
              <button
                onClick={() => manuscriptBorder.setBorderActivity('generating')}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Set Generating State
              </button>
              <button
                onClick={() => manuscriptBorder.setBorderActivity('idle')}
                className="w-full px-4 py-2 bg-neutral-500 text-white rounded-lg hover:bg-neutral-600 transition-colors"
              >
                Set Idle State
              </button>
            </div>
          </div>
          
          {/* Framework Controls */}
          <div>
            <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">
              Framework Border
            </h4>
            <div className="space-y-3">
              <button
                onClick={() => frameworkBorder.setBorderConfidence(0.9)}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                High Confidence (90%)
              </button>
              <button
                onClick={() => frameworkBorder.setBorderConfidence(0.5)}
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Medium Confidence (50%)
              </button>
              <button
                onClick={() => frameworkBorder.setDataFlowing(!frameworkBorder.borderState.isDataFlowing)}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Toggle Data Flow
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Debugging Information */}
      <div className="max-w-4xl mx-auto mt-6 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          Debug Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Manuscript Classes:</strong>
            <code className="block mt-1 p-2 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">
              {manuscriptBorder.getManuscriptClasses()}
            </code>
          </div>
          <div>
            <strong>Framework Classes:</strong>
            <code className="block mt-1 p-2 bg-neutral-200 dark:bg-neutral-700 rounded text-xs">
              {frameworkBorder.getFrameworkClasses()}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIBorderTest