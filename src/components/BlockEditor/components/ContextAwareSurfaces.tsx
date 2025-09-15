'use client'

import React from 'react'
import { useDualEditor } from '../context/SplitEditorContext'
import { ManuscriptSurface } from './ManuscriptSurface'
import { FrameworkSurface } from './FrameworkSurface'

export const DualSurfaceView = React.memo(() => {
  const { 
    manuscriptEditor,
    frameworkEditor,
    manuscriptBorder,
    frameworkBorder,
    frameworkManager,
    editorRef
  } = useDualEditor()

  return (
    <div className="relative h-full flex gap-3 sm:gap-4 lg:gap-12 justify-center items-stretch p-2 sm:p-3 lg:p-6 transition-[gap,padding] duration-200">
      <FrameworkSurface
        editor={frameworkEditor}
        borderClasses={frameworkBorder.getFrameworkClasses()}
        cssVariables={frameworkBorder.getCSSVariables()}
        showToolbar={true}
        toolbarPosition="external"
        onFrameworkSelect={(framework) => frameworkManager.applyFramework(framework)}
        onClearFramework={frameworkManager.clearFramework}
        activeFramework={frameworkManager.activeFramework}
      />
      
      <ManuscriptSurface
        editor={manuscriptEditor}
        editorRef={editorRef}
        borderClasses={manuscriptBorder.getManuscriptClasses()}
        cssVariables={manuscriptBorder.getCSSVariables()}
      />
    </div>
  )
})

export const SingleManuscriptView = React.memo(() => {
  const { 
    manuscriptEditor,
    manuscriptBorder,
    editorRef
  } = useDualEditor()

  return (
    <div className="relative h-full flex justify-center p-3 lg:p-4 transition-[padding] duration-200">
      <ManuscriptSurface
        editor={manuscriptEditor}
        editorRef={editorRef}
        borderClasses={manuscriptBorder.getManuscriptClasses()}
        cssVariables={manuscriptBorder.getCSSVariables()}
        fullWidth={true}
      />
    </div>
  )
})

export const SingleFrameworkView = React.memo(() => {
  const { 
    frameworkEditor,
    frameworkBorder,
    frameworkManager
  } = useDualEditor()

  return (
    <FrameworkSurface
      editor={frameworkEditor}
      borderClasses={frameworkBorder.getFrameworkClasses()}
      cssVariables={frameworkBorder.getCSSVariables()}
      fullWidth={true}
      showToolbar={true}
      toolbarPosition="absolute"
      onFrameworkSelect={(framework) => frameworkManager.applyFramework(framework)}
      onClearFramework={frameworkManager.clearFramework}
      activeFramework={frameworkManager.activeFramework}
    />
  )
})

DualSurfaceView.displayName = 'DualSurfaceView'
SingleManuscriptView.displayName = 'SingleManuscriptView'
SingleFrameworkView.displayName = 'SingleFrameworkView'