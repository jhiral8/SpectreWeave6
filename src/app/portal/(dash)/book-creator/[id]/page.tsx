'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Wand2,
  BookOpen,
  Palette,
  Video,
  Settings,
  Play,
  Save,
  Image,
  Users
} from 'lucide-react'
import { BridgeStatus } from '@/components/portal/BridgeStatus'
import { GenerationPipelineWidget } from '@/components/portal/GenerationPipelineWidget'
// import { CharacterManager } from '@/components/characters/CharacterManager' // Temporarily disabled
import type { 
  ChildrensBookProject, 
  BookCreationForm, 
  FamousAuthorStyle,
  BookTheme,
  IllustrationStyle,
  AgeGroup,
  VideoStyle 
} from '@/types/childrens-books'

// Wizard steps configuration
const WIZARD_STEPS = [
  { id: 'setup', title: 'Story Setup', icon: BookOpen, description: 'Define your story concept' },
  { id: 'characters', title: 'Characters', icon: Users, description: 'Manage character consistency' },
  { id: 'author', title: 'Author Style', icon: Wand2, description: 'Choose writing style' },
  { id: 'visual', title: 'Visual Style', icon: Palette, description: 'Select theme & illustrations' },
  { id: 'video', title: 'Video Options', icon: Video, description: 'Add multimedia features' },
  { id: 'settings', title: 'Book Settings', icon: Settings, description: 'Final configuration' }
]

export default function BookCreatorEditPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [book, setBook] = useState<ChildrensBookProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatingImages, setGeneratingImages] = useState(false)
  const [storyGenerated, setStoryGenerated] = useState(false)
  const [completingBook, setCompletingBook] = useState(false)
  const [completionStep, setCompletionStep] = useState<string>('')
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<BookCreationForm>({
    main_character: '',
    setting: '',
    conflict: '',
    moral_lesson: '',
    author_style: 'dr-seuss',
    book_theme: 'magical-forest',
    illustration_style: 'watercolor',
    include_video: false,
    target_age: '3-5',
    total_pages: 6,
    include_audio: false,
    // Character lock system integration
    useCharacterLock: true,
    characterDescription: ''
  })

  useEffect(() => {
    const loadData = async () => {
      if (!params.id) return
      
      const supabase = createClient()
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Try to get book project first
        let bookData = null
        let isProject = false
        
        try {
          console.log('🔍 Attempting to load project with ID:', params.id, 'for user:', user.id)
          
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select(`
              id,
              title,
              description,
              user_id,
              project_type,
              author_style,
              book_theme,
              illustration_style,
              target_age,
              total_pages,
              book_metadata,
              created_at,
              updated_at
            `)
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single()
          
          if (projectError) {
            console.error('❌ Project query failed:', {
              message: projectError.message,
              details: projectError.details,
              hint: projectError.hint,
              code: projectError.code
            })
          } else if (projectData) {
            console.log('✅ Project data loaded successfully:', projectData.title)
            bookData = projectData
            isProject = true
          } else {
            console.log('⚠️ Query succeeded but no project data returned')
          }
        } catch (err) {
          console.error('💥 Exception during project query:', err)
        }
        
        // If no project found, try books table
        if (!bookData) {
          try {
            const { data: bookRecord, error: bookError } = await supabase
              .from('books')
              .select('*')
              .eq('id', params.id)
              .eq('user_id', user.id)
              .single()
            
            if (!bookError && bookRecord) {
              // Convert book record to project-like format for compatibility
              bookData = {
                id: bookRecord.id,
                title: bookRecord.title,
                description: `Children's book: ${bookRecord.title}`,
                user_id: bookRecord.user_id,
                project_type: 'childrens-book',
                author_style: bookRecord.author_style,
                book_theme: bookRecord.theme,
                illustration_style: bookRecord.style,
                target_age: bookRecord.target_age,
                total_pages: bookRecord.total_pages,
                book_metadata: {
                  created_via: 'books_table',
                  main_character: '',
                  setting: '',
                  conflict: '',
                  moral_lesson: ''
                },
                created_at: bookRecord.created_at,
                updated_at: bookRecord.updated_at
              }
              isProject = false
            }
          } catch (err) {
            console.error('No book found either:', err)
          }
        }
        
        if (!bookData) {
          console.error('No book or project found with ID:', params.id)
          router.push('/portal/book-creator')
        } else {
          setBook(bookData)
          
          // Populate form data
          const bookMetadata = bookData.book_metadata || {}
          setFormData({
            main_character: bookMetadata.main_character || '',
            setting: bookMetadata.setting || '',
            conflict: bookMetadata.conflict || '',
            moral_lesson: bookMetadata.moral_lesson || '',
            author_style: bookData.author_style || 'dr-seuss',
            book_theme: bookData.book_theme || 'magical-forest',
            illustration_style: bookData.illustration_style || 'watercolor',
            include_video: bookMetadata.include_video || false,
            video_style: bookMetadata.video_style || 'cinematic',
            video_duration: bookMetadata.video_duration || '15s',
            target_age: bookData.target_age || '3-5',
            total_pages: bookData.total_pages || 6,
            include_audio: bookMetadata.include_audio || false,
            custom_instructions: bookMetadata.custom_instructions || '',
            // Character lock system fields
            useCharacterLock: bookMetadata.useCharacterLock !== false, // Default to true
            characterDescription: bookMetadata.characterDescription || ''
          })
          if (typeof bookMetadata.retrieval_mode === 'string') {
            const rm = bookMetadata.retrieval_mode as any
            if (rm === 'graph' || rm === 'vector' || rm === 'hybrid') setRetrievalMode(rm)
          }
          if (typeof bookMetadata.retrieval_graph_weight === 'number') {
            const w = bookMetadata.retrieval_graph_weight
            setGraphWeight(Number.isFinite(w) ? Math.max(0, Math.min(100, w)) : 60)
          }
        }
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [params.id, router])

  const handleSave = async () => {
    if (!book || !user) return
    
    setSaving(true)
    const supabase = createClient()
    
    const updatedBookMetadata = {
      ...book.book_metadata,
      main_character: formData.main_character,
      setting: formData.setting,
      conflict: formData.conflict,
      moral_lesson: formData.moral_lesson,
      include_video: formData.include_video,
      video_style: formData.video_style,
      video_duration: formData.video_duration,
      include_audio: formData.include_audio,
      custom_instructions: formData.custom_instructions,
      // Character lock system fields
      useCharacterLock: formData.useCharacterLock,
      characterDescription: formData.characterDescription
    }

    const { error } = await supabase
      .from('projects')
      .update({
        author_style: formData.author_style,
        book_theme: formData.book_theme,
        illustration_style: formData.illustration_style,
        target_age: formData.target_age,
        total_pages: formData.total_pages,
        book_metadata: updatedBookMetadata
      })
      .eq('id', book.id)

    if (!error) {
      // Update local state
      setBook({
        ...book,
        author_style: formData.author_style,
        book_theme: formData.book_theme,
        illustration_style: formData.illustration_style,
        target_age: formData.target_age,
        total_pages: formData.total_pages,
        book_metadata: updatedBookMetadata
      })
    }
    
    setSaving(false)
  }

  const handleGenerateImages = async () => {
    if (!book || !user) return
    
    setGeneratingImages(true)
    
    try {
      // First, fetch the story pages from the database
      const supabase = createClient()
      
      // Get current user for debugging
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      console.log('🔍 Image generation - current user:', currentUser?.id)
      console.log('🔍 Image generation - book ID:', book.id)

      // Try project_id first (new schema), then fallback to book_id (legacy)
      let { data: pages, error: pagesError } = await supabase
        .from('book_pages')
        .select('page_number, illustration_prompt, user_id, project_id, book_id')
        .eq('project_id', book.id)
        .order('page_number')
      
      console.log(`📊 Image gen project_id query: ${pages?.length || 0} pages, error: ${pagesError?.message || 'none'}`)

      // If no pages found with project_id, try book_id for backward compatibility
      if (!pages || pages.length === 0) {
        const result = await supabase
          .from('book_pages')
          .select('page_number, illustration_prompt, user_id, project_id, book_id')
          .eq('book_id', book.id)
          .order('page_number')
        pages = result.data
        pagesError = result.error
        console.log(`📊 Image gen book_id query: ${pages?.length || 0} pages, error: ${pagesError?.message || 'none'}`)
      }

      // Debug: Check if pages exist for a different user
      if (!pages || pages.length === 0) {
        const { data: anyPages } = await supabase
          .from('book_pages')
          .select('page_number, user_id, project_id, book_id')
          .or(`project_id.eq.${book.id},book_id.eq.${book.id}`)
        
        if (anyPages && anyPages.length > 0) {
          console.log(`⚠️ Image gen: Found ${anyPages.length} pages for book ${book.id} but with different users`)
          console.log('Found user_ids:', anyPages.map(p => p.user_id))
          console.log('Current user_id:', currentUser?.id)
        }
      }
      
      if (pagesError || !pages || pages.length === 0) {
        throw new Error('No story pages found. Please generate a story first.')
      }

      // Prepare batch image generation request
      const imageRequest = {
        bookId: book.id,
        action: 'generate-batch',
        pages: pages.map(page => ({
          pageNumber: page.page_number,
          illustrationPrompt: page.illustration_prompt
        })),
        style: formData.illustration_style,
        theme: formData.book_theme,
        targetAge: formData.target_age
      }

      // Get authentication session for API call
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/children-books/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(imageRequest)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate images')
      }

      if (result.success) {
        alert(`Successfully generated ${result.images.length} illustrations!`)
        // Refresh to show the generated images
        window.location.reload()
      } else {
        throw new Error('Image generation failed')
      }

    } catch (error) {
      console.error('Error generating images:', error)
      alert(`Failed to generate images: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setGeneratingImages(false)
    }
  }





  const handleGenerateStory = async () => {
    if (!book || !user) return
    
    setGenerating(true)
    
    try {
      // First save current form data
      await handleSave()
      
      // Prepare story generation request
      const storyRequest = {
        bookId: book.id,
        title: book.title,
        authorStyle: formData.author_style,
        ageGroup: formData.target_age,
        genre: 'adventure', // Could make this configurable
        theme: formData.book_theme,
        characterName: formData.main_character,
        setting: formData.setting,
        conflict: formData.conflict,
        moralLesson: formData.moral_lesson,
        customInstructions: formData.custom_instructions,
        // Character lock system integration
        useCharacterLock: formData.useCharacterLock,
        characterDescription: formData.characterDescription
      }


      const response = await fetch('/api/children-books/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyRequest)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate story')
      }

      if (result.success) {
        // Show success message
        alert(`Story generated successfully! Created ${result.story.pages.length} pages.`)
        setStoryGenerated(true)
        
        // Ask if user wants to generate images
        const generateImages = confirm('Would you like to generate illustrations for your story?')
        if (generateImages) {
          await handleGenerateImages()
        } else {
          // Refresh to show the generated story
          window.location.reload()
        }
      } else {
        throw new Error('Story generation failed')
      }

    } catch (error) {
      console.error('Error generating story:', error)
      alert(`Failed to generate story: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setGenerating(false)
    }
  }

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const generateStoryForCompletion = async () => {
    if (!book || !user) throw new Error('Book or user not found')
    
    // First save current form data
    await handleSave()
    
    // Prepare story generation request
    const storyRequest = {
      bookId: book.id,
      title: book.title,
      authorStyle: formData.author_style,
      ageGroup: formData.target_age,
      genre: 'adventure',
      theme: formData.book_theme,
      characterName: formData.main_character,
      setting: formData.setting,
      conflict: formData.conflict,
      moralLesson: formData.moral_lesson,
      customInstructions: formData.custom_instructions,
      useCharacterLock: formData.useCharacterLock,
      characterDescription: formData.characterDescription
    }
    
    const response = await fetch('/api/children-books/generate-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storyRequest)
    })
    
    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to generate story')
    }
    
    if (result.success) {
      setStoryGenerated(true)
    } else {
      throw new Error('Story generation failed')
    }
  }
  
  const generateImagesForCompletion = async () => {
    if (!book || !user) throw new Error('Book or user not found')
    
    // First, fetch the story pages from the database
    const supabase = createClient()
    
    // Try project_id first (new schema), then fallback to book_id (legacy)
    let { data: pages, error: pagesError } = await supabase
      .from('book_pages')
      .select('page_number, illustration_prompt')
      .eq('project_id', book.id)
      .order('page_number')
    
    // If no pages found with project_id, try book_id for backward compatibility
    if (!pages || pages.length === 0) {
      const result = await supabase
        .from('book_pages')
        .select('page_number, illustration_prompt')
        .eq('book_id', book.id)
        .order('page_number')
      pages = result.data
      pagesError = result.error
    }
    
    if (pagesError || !pages || pages.length === 0) {
      throw new Error('No story pages found. Please generate a story first.')
    }
    
    // Prepare batch image generation request
    const imageRequest = {
      bookId: book.id,
      action: 'generate-batch',
      pages: pages.map(page => ({
        pageNumber: page.page_number,
        illustrationPrompt: page.illustration_prompt
      })),
      style: formData.illustration_style,
      theme: formData.book_theme,
      targetAge: formData.target_age
    }
    
    // Get authentication session for API call
    const { data: { session } } = await supabase.auth.getSession()
    
    const response = await fetch('/api/children-books/generate-images', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify(imageRequest)
    })
    
    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to generate images')
    }
    
    if (!result.success) {
      throw new Error('Image generation failed')
    }
  }
  
  const completeBook = async () => {
    // Validate all required steps are completed
    const allStepsValid = isAllStepsValid()
    if (!allStepsValid) {
      alert('Please complete all required fields in previous steps before finalizing your book.')
      return
    }
    
    setCompletingBook(true)
    
    try {
      // Step 1: Generate Story
      setCompletionStep('Generating your story...')
      await generateStoryForCompletion()
      
      // Step 2: Generate Images  
      setCompletionStep('Creating illustrations...')
      await generateImagesForCompletion()
      
      // Step 3: Finalize
      setCompletionStep('Finalizing your book...')
      await handleSave()
      
      // Success!
      setCompletionStep('Complete!')
      alert('🎉 Congratulations! Your book has been created successfully with story and illustrations!')
      
      // Optional: Redirect to book list or gallery
      // router.push('/portal/book-creator')
      
    } catch (error) {
      console.error('Error completing book:', error)
      alert(`Failed to complete book: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCompletingBook(false)
      setCompletionStep('')
    }
  }

  const isAllStepsValid = () => {
    // Check all steps except the current one and future ones
    for (let i = 0; i < WIZARD_STEPS.length - 1; i++) {
      if (!isStepComplete(i) && i < currentStep) {
        return false
      }
    }
    
    // Check current step (final step) requirements
    if (currentStep === WIZARD_STEPS.length - 1) {
      return formData.target_age && formData.total_pages > 0
    }
    
    return true
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepComplete = (stepIndex: number) => {
    // A step is only "completed" if the user has progressed past it AND it has valid data
    if (stepIndex >= currentStep) {
      return false // Future steps or current step are not completed
    }
    
    switch (stepIndex) {
      case 0: // Setup
        return formData.main_character && formData.setting && formData.conflict
      case 1: // Characters
        return true // Optional step - always complete if passed
      case 2: // Author
        return formData.author_style
      case 3: // Visual
        return formData.book_theme && formData.illustration_style
      case 4: // Video
        return true // Optional step - always complete if passed
      case 5: // Settings
        return formData.target_age && formData.total_pages > 0
      default:
        return false
    }
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[--muted] rounded w-1/3" />
            <div className="h-64 bg-[--muted] rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="h-full overflow-y-auto flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Book not found</h2>
          <p className="text-[--muted-foreground] mb-4">The book you're looking for doesn't exist or you don't have access to it.</p>
          <button 
            onClick={() => router.push('/portal/book-creator')}
            className="px-4 py-2 bg-[--primary] text-[--primary-foreground] rounded-md hover:opacity-90"
          >
            Back to Books
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/portal/book-creator')}
            className="p-2 rounded-md hover:bg-[--muted]/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold text-[--foreground]">{book.title}</h1>
            <p className="text-[--muted-foreground]">Configure your children's book</p>
            <div className="mt-3 max-w-xl"><GenerationPipelineWidget /></div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="hidden md:block">
              <BridgeStatus />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[--primary] text-[--primary-foreground] hover:opacity-90 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Enhanced Progress Steps */}
        <div className="relative">
          {/* Progress Line Background */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-[--border] hidden sm:block" />
          
          {/* Active Progress Line */}
          <div 
            className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] hidden sm:block transition-all duration-700 ease-out"
            style={{ 
              width: `${(currentStep / (WIZARD_STEPS.length - 1)) * 100}%` 
            }}
          />
          
          {/* Steps Container */}
          <div className="relative flex items-center justify-between flex-wrap sm:flex-nowrap gap-4 sm:gap-0">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = isStepComplete(index)
              const isAccessible = index <= currentStep || isCompleted
              const isPending = index > currentStep && !isCompleted
              
              return (
                <div key={step.id} className="flex flex-col items-center group flex-1 sm:flex-none">
                  {/* Step Button */}
                  <button
                    onClick={() => isAccessible ? setCurrentStep(index) : null}
                    disabled={!isAccessible}
                    className={`relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-br from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] text-white shadow-lg shadow-purple-500/30 scale-110'
                        : isCompleted
                        ? 'bg-gradient-to-br from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] text-white shadow-md hover:shadow-lg hover:scale-105 cursor-pointer'
                        : isPending
                        ? 'bg-[--muted] text-[--muted-foreground] cursor-not-allowed opacity-40'
                        : isAccessible
                        ? 'bg-[--card] border border-[--border] text-[--muted-foreground] hover:border-[#8ec5ff] hover:text-[#8ec5ff] hover:shadow-sm hover:scale-105 cursor-pointer'
                        : 'bg-[--muted] text-[--muted-foreground] cursor-not-allowed opacity-40'
                    }`}
                  >
                    {/* Animated Ring for Active Step */}
                    {isActive && (
                      <div className="absolute -inset-1 rounded-full border border-[#8ec5ff]/40 animate-pulse" />
                    )}
                    
                    {/* Step Icon */}
                    <div className={`transition-all duration-300 ${
                      isActive ? 'scale-110' : 'scale-100'
                    }`}>
                      {isCompleted && !isActive ? (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </div>
                    
                  </button>
                  
                  {/* Step Label */}
                  <div className="mt-2 text-center max-w-[70px] sm:max-w-[90px]">
                    <div className={`font-medium text-[10px] sm:text-xs transition-colors duration-300 ${
                      isActive 
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf]'
                        : isCompleted
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf]'
                        : 'text-[--muted-foreground]'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Progress Percentage */}
          <div className="mt-4 text-center">
            <div className="text-sm font-medium text-[--muted-foreground]">
              Progress: {Math.round(((currentStep + 1) / WIZARD_STEPS.length) * 100)}%
            </div>
            <div className="mt-2 w-full bg-[--muted] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] h-2 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-[--card] border border-[--border] rounded-xl p-6 shadow-sm">
          {/* Step Header */}
          <div className="mb-6 border-b border-[--border] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] text-white rounded-lg">
                {React.createElement(WIZARD_STEPS[currentStep].icon, { className: "w-5 h-5" })}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[--foreground]">
                  {WIZARD_STEPS[currentStep].title}
                </h3>
                <p className="text-sm text-[--muted-foreground]">
                  {WIZARD_STEPS[currentStep].description}
                </p>
              </div>
            </div>
          </div>
          
          {/* Animated Step Content */}
          <div 
            key={currentStep}
            className="transition-all duration-300 ease-in-out"
          >
            {currentStep === 0 && <StorySetupStep formData={formData} setFormData={setFormData} />}
            {currentStep === 1 && <CharacterManagementStep formData={formData} setFormData={setFormData} projectId={book?.id} />}
            {currentStep === 2 && <AuthorStyleStep formData={formData} setFormData={setFormData} />}
            {currentStep === 3 && <VisualStyleStep formData={formData} setFormData={setFormData} />}
            {currentStep === 4 && <VideoOptionsStep formData={formData} setFormData={setFormData} />}
            {currentStep === 5 && <BookSettingsStep formData={formData} setFormData={setFormData} />}
          </div>
        </div>

        {/* Enhanced Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="group inline-flex items-center gap-3 px-6 py-3 rounded-xl border-2 border-[--border] hover:border-[--primary] hover:bg-[--primary]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="font-medium">Previous</span>
          </button>
          
          {/* Step Indicators */}
          <div className="flex items-center gap-2">
            {WIZARD_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-gradient-to-r from-[#8ec5ff] to-[#ff9ecf] scale-125'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-[--border]'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={currentStep === WIZARD_STEPS.length - 1 ? completeBook : nextStep}
            disabled={currentStep === WIZARD_STEPS.length - 1 ? !isAllStepsValid() || completingBook : false}
            className="group inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] text-white hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          >
            <span className="font-medium">
              {currentStep === WIZARD_STEPS.length - 1 ? (completingBook ? completionStep : 'Complete Book') : 'Next'}
            </span>
            {currentStep === WIZARD_STEPS.length - 1 ? (
              <BookOpen className="w-5 h-5 transition-transform duration-300" />
            ) : (
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Step Components
function StorySetupStep({ formData, setFormData }: { 
  formData: BookCreationForm
  setFormData: (data: BookCreationForm) => void 
}) {
  const storyElements = [
    {
      id: 'main_character',
      label: 'Main Character',
      placeholder: 'A curious young rabbit named Benny',
      description: 'Who is the hero of your story?',
      icon: '🐰',
      required: true
    },
    {
      id: 'setting',
      label: 'Setting',
      placeholder: 'A magical forest with talking trees and glowing flowers',
      description: 'Where does your story take place?',
      icon: '🌲',
      required: true
    },
    {
      id: 'conflict',
      label: 'Main Challenge',
      placeholder: 'The forest\'s magic is fading and all the animals are losing their voices',
      description: 'What problem needs to be solved?',
      icon: '⚡',
      required: true
    },
    {
      id: 'moral_lesson',
      label: 'Moral Lesson',
      placeholder: 'Friendship and kindness can overcome any challenge',
      description: 'What important lesson should readers learn?',
      icon: '💡',
      required: false
    }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Tell Your Story</h3>
        <p className="text-[--muted-foreground]">Let's build the foundation of your magical tale</p>
      </div>

      <div className="grid gap-6">
        {storyElements.map((element) => (
          <div key={element.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{element.icon}</span>
              <div className="flex-1">
                <label className="block text-sm font-semibold">
                  {element.label}
                  {element.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <p className="text-xs text-[--muted-foreground] mt-1">{element.description}</p>
              </div>
            </div>
            <div className="relative">
              <textarea
                value={formData[element.id as keyof BookCreationForm] as string || ''}
                onChange={(e) => setFormData({ ...formData, [element.id]: e.target.value })}
                placeholder={element.placeholder}
                rows={element.id === 'conflict' ? 3 : 2}
                className="w-full px-4 py-3 rounded-lg border-2 border-[--border] bg-[--input] focus:border-[--primary] focus:ring-0 transition-colors placeholder:text-[--muted-foreground]/60 resize-none"
              />
              <div className="absolute bottom-2 right-2 text-xs text-[--muted-foreground]">
                {((formData[element.id as keyof BookCreationForm] as string)?.length || 0)}/150
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 mt-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">✨</div>
          <div>
            <h4 className="text-sm font-semibold text-[--foreground]">Pro Tip</h4>
            <p className="text-xs text-[--muted-foreground] mt-1">
              Great children's stories often feature relatable characters facing age-appropriate challenges. 
              Think about what emotions and lessons will resonate with your target audience.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthorStyleStep({ formData, setFormData }: { 
  formData: BookCreationForm
  setFormData: (data: BookCreationForm) => void 
}) {
  const authorStyles: Array<{ value: FamousAuthorStyle; label: string; description: string; icon: string; sample: string }> = [
    { 
      value: 'dr-seuss', 
      label: 'Dr. Seuss', 
      description: 'Whimsical rhymes and fantastical creatures',
      icon: '🎭',
      sample: '"Oh the places you\'ll go! There is fun to be done!"'
    },
    { 
      value: 'roald-dahl', 
      label: 'Roald Dahl', 
      description: 'Imaginative adventures with unexpected twists',
      icon: '🪄',
      sample: '"A little nonsense now and then is relished by the wisest men."'
    },
    { 
      value: 'maurice-sendak', 
      label: 'Maurice Sendak', 
      description: 'Emotionally rich stories exploring inner worlds',
      icon: '👹',
      sample: '"Let the wild rumpus start!"'
    },
    { 
      value: 'eric-carle', 
      label: 'Eric Carle', 
      description: 'Nature-focused educational stories',
      icon: '🐛',
      sample: '"On Monday he ate through one apple, but he was still hungry."'
    },
    { 
      value: 'beatrix-potter', 
      label: 'Beatrix Potter', 
      description: 'Gentle animal tales in countryside settings',
      icon: '🐰',
      sample: '"Once upon a time there were four little rabbits..."'
    },
    { 
      value: 'a-a-milne', 
      label: 'A.A. Milne', 
      description: 'Warm friendship stories with gentle humor',
      icon: '🐻',
      sample: '"Sometimes the smallest things take up the most room in your heart."'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="text-3xl">✍️</div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] bg-clip-text text-transparent">
            Choose Your Writing Style
          </h3>
        </div>
        <p className="text-[--muted-foreground] text-sm max-w-md mx-auto">
          Each author brings their unique voice to storytelling. Select the style that best matches your vision.
        </p>
      </div>

      {/* Enhanced Author Style Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {authorStyles.map((style) => (
          <label
            key={style.value}
            className={`group relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${
              formData.author_style === style.value
                ? 'border-[--primary] bg-gradient-to-br from-[--primary]/5 via-[--primary]/10 to-[--primary]/5 shadow-md shadow-[--primary]/20'
                : 'border-[--border] hover:border-[--primary]/50 bg-[--card] hover:bg-[--muted]/30'
            }`}
          >
            {/* Selection Indicator */}
            {formData.author_style === style.value && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            <input
              type="radio"
              name="author_style"
              value={style.value}
              checked={formData.author_style === style.value}
              onChange={(e) => setFormData({ ...formData, author_style: e.target.value as FamousAuthorStyle })}
              className="sr-only"
            />
            
            {/* Author Icon & Name */}
            <div className="flex items-start gap-3 mb-3">
              <div className="text-2xl flex-shrink-0">{style.icon}</div>
              <div className="min-w-0 flex-1">
                <h4 className={`font-bold text-lg transition-colors ${
                  formData.author_style === style.value 
                    ? 'text-[--primary]' 
                    : 'text-[--foreground] group-hover:text-[--primary]'
                }`}>
                  {style.label}
                </h4>
                <p className="text-sm text-[--muted-foreground] mt-1 leading-relaxed">
                  {style.description}
                </p>
              </div>
            </div>

            {/* Sample Quote */}
            <div className="mt-4 p-3 rounded-lg bg-[--muted]/30 border-l-4 border-[--primary]/30">
              <div className="text-xs text-[--muted-foreground] mb-1 font-medium">Sample Style:</div>
              <div className="text-sm italic text-[--foreground]/80 leading-relaxed">
                {style.sample}
              </div>
            </div>

            {/* Hover Effect Ring */}
            <div className={`absolute inset-0 rounded-xl border-2 transition-opacity duration-300 pointer-events-none ${
              formData.author_style === style.value 
                ? 'border-[--primary]/30 opacity-100' 
                : 'border-[--primary]/20 opacity-0 group-hover:opacity-100'
            }`} />
          </label>
        ))}
      </div>

      {/* Pro Tip Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-5 mt-8">
        <div className="flex items-start gap-4">
          <div className="text-2xl flex-shrink-0">💡</div>
          <div>
            <h4 className="text-sm font-semibold text-[--foreground] mb-2">Writing Style Tips</h4>
            <ul className="text-xs text-[--muted-foreground] space-y-1 leading-relaxed">
              <li>• <strong>Dr. Seuss:</strong> Perfect for playful rhyming stories with silly characters</li>
              <li>• <strong>Roald Dahl:</strong> Great for adventure stories with clever plot twists</li>
              <li>• <strong>Beatrix Potter:</strong> Ideal for gentle stories about animals and nature</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function VisualStyleStep({ formData, setFormData }: { 
  formData: BookCreationForm
  setFormData: (data: BookCreationForm) => void 
}) {
  const themes: Array<{ value: BookTheme; label: string; icon: string; description: string }> = [
    { value: 'magical-forest', label: 'Magical Forest', icon: '🌲', description: 'Enchanted woodlands with fairy-tale magic' },
    { value: 'underwater-adventure', label: 'Underwater Adventure', icon: '🌊', description: 'Deep sea wonders and aquatic friends' },
    { value: 'space-exploration', label: 'Space Exploration', icon: '🚀', description: 'Cosmic adventures among stars and planets' },
    { value: 'fairy-tale-castle', label: 'Fairy Tale Castle', icon: '🏰', description: 'Royal adventures in magical kingdoms' },
    { value: 'animal-kingdom', label: 'Animal Kingdom', icon: '🦁', description: 'Wild friends and safari adventures' },
    { value: 'winter-wonderland', label: 'Winter Wonderland', icon: '❄️', description: 'Snowy landscapes and cozy adventures' }
  ]

  const styles: Array<{ value: IllustrationStyle; label: string; icon: string; description: string }> = [
    { value: 'watercolor', label: 'Watercolor', icon: '🎨', description: 'Soft, flowing colors with artistic texture' },
    { value: 'digital-art', label: 'Digital Art', icon: '💻', description: 'Crisp, modern illustrations with vibrant colors' },
    { value: 'cartoon', label: 'Cartoon', icon: '🎭', description: 'Fun, expressive characters with bold lines' },
    { value: 'storybook', label: 'Storybook', icon: '📚', description: 'Classic children\'s book illustration style' },
    { value: 'vintage', label: 'Vintage', icon: '📜', description: 'Nostalgic, timeless artistic appeal' },
    { value: 'minimalist', label: 'Minimalist', icon: '⚪', description: 'Clean, simple designs with focus on essentials' }
  ]

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="text-3xl">🎨</div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] bg-clip-text text-transparent">
            Choose Your Visual Style
          </h3>
        </div>
        <p className="text-[--muted-foreground] text-sm max-w-md mx-auto">
          Create the perfect visual atmosphere for your story with our theme and style combinations.
        </p>
      </div>

      {/* Book Theme Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="text-xl">🌟</div>
          <h4 className="text-lg font-semibold">Book Theme</h4>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <label
              key={theme.value}
              className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${
                formData.book_theme === theme.value
                  ? 'border-[--primary] bg-gradient-to-br from-[--primary]/5 via-[--primary]/10 to-[--primary]/5 shadow-md shadow-[--primary]/20'
                  : 'border-[--border] hover:border-[--primary]/50 bg-[--card] hover:bg-[--muted]/30'
              }`}
            >
              {/* Selection Indicator */}
              {formData.book_theme === theme.value && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              <input
                type="radio"
                name="book_theme"
                value={theme.value}
                checked={formData.book_theme === theme.value}
                onChange={(e) => setFormData({ ...formData, book_theme: e.target.value as BookTheme })}
                className="sr-only"
              />
              
              <div className="text-center">
                <div className="text-3xl mb-2">{theme.icon}</div>
                <h5 className={`font-semibold text-sm transition-colors ${
                  formData.book_theme === theme.value 
                    ? 'text-[--primary]' 
                    : 'text-[--foreground] group-hover:text-[--primary]'
                }`}>
                  {theme.label}
                </h5>
                <p className="text-xs text-[--muted-foreground] mt-1 leading-relaxed">
                  {theme.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Illustration Style Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="text-xl">🖌️</div>
          <h4 className="text-lg font-semibold">Illustration Style</h4>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {styles.map((style) => (
            <label
              key={style.value}
              className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${
                formData.illustration_style === style.value
                  ? 'border-[--primary] bg-gradient-to-br from-[--primary]/5 via-[--primary]/10 to-[--primary]/5 shadow-md shadow-[--primary]/20'
                  : 'border-[--border] hover:border-[--primary]/50 bg-[--card] hover:bg-[--muted]/30'
              }`}
            >
              {/* Selection Indicator */}
              {formData.illustration_style === style.value && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              <input
                type="radio"
                name="illustration_style"
                value={style.value}
                checked={formData.illustration_style === style.value}
                onChange={(e) => setFormData({ ...formData, illustration_style: e.target.value as IllustrationStyle })}
                className="sr-only"
              />
              
              <div className="text-center">
                <div className="text-3xl mb-2">{style.icon}</div>
                <h5 className={`font-semibold text-sm transition-colors ${
                  formData.illustration_style === style.value 
                    ? 'text-[--primary]' 
                    : 'text-[--foreground] group-hover:text-[--primary]'
                }`}>
                  {style.label}
                </h5>
                <p className="text-xs text-[--muted-foreground] mt-1 leading-relaxed">
                  {style.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="text-2xl flex-shrink-0">🎯</div>
          <div>
            <h4 className="text-sm font-semibold text-[--foreground] mb-2">Your Selection</h4>
            <div className="flex items-center gap-4 text-sm text-[--muted-foreground]">
              <span className="flex items-center gap-2">
                <strong>Theme:</strong> 
                {themes.find(t => t.value === formData.book_theme)?.icon} 
                {themes.find(t => t.value === formData.book_theme)?.label || 'None selected'}
              </span>
              <span className="flex items-center gap-2">
                <strong>Style:</strong> 
                {styles.find(s => s.value === formData.illustration_style)?.icon} 
                {styles.find(s => s.value === formData.illustration_style)?.label || 'None selected'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function VideoOptionsStep({ formData, setFormData }: { 
  formData: BookCreationForm
  setFormData: (data: BookCreationForm) => void 
}) {
  const videoStyles: Array<{ value: VideoStyle; label: string; icon: string; description: string }> = [
    { value: 'cinematic', label: 'Cinematic', icon: '🎬', description: 'Dramatic camera work and lighting' },
    { value: 'animated', label: 'Animated', icon: '🎞️', description: 'Smooth character animations and movement' },
    { value: 'whimsical', label: 'Whimsical', icon: '🎪', description: 'Playful and fantastical visual effects' },
    { value: 'dreamy', label: 'Dreamy', icon: '☁️', description: 'Soft, ethereal atmosphere and transitions' },
    { value: 'magical', label: 'Magical', icon: '✨', description: 'Sparkling effects and enchanting moments' },
    { value: 'gentle', label: 'Gentle', icon: '🌸', description: 'Calm, soothing visual presentation' }
  ]

  const videoDurations = [
    { value: '8s' as const, label: '8 seconds', description: 'Quick highlight moments' },
    { value: '15s' as const, label: '15 seconds', description: 'Perfect for social sharing' },
    { value: '25s' as const, label: '25 seconds', description: 'Full scene development' }
  ]

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="text-3xl">🎥</div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] bg-clip-text text-transparent">
            Multimedia Features
          </h3>
        </div>
        <p className="text-[--muted-foreground] text-sm max-w-md mx-auto">
          Transform your book into an interactive multimedia experience with video and audio.
        </p>
      </div>

      {/* Video Options */}
      <div className="space-y-6">
        {/* Video Toggle */}
        <label className="group flex items-start gap-4 p-5 rounded-xl border-2 border-[--border] cursor-pointer transition-all duration-300 hover:border-[--primary]/50 hover:bg-[--muted]/30">
          <div className="relative mt-1">
            <input
              type="checkbox"
              checked={formData.include_video}
              onChange={(e) => setFormData({ ...formData, include_video: e.target.checked })}
              className="w-5 h-5 text-[--primary] bg-[--background] border-2 border-[--border] rounded focus:ring-2 focus:ring-[--primary]/20"
            />
            {formData.include_video && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xl">🎬</div>
              <h4 className={`font-semibold text-lg transition-colors ${
                formData.include_video ? 'text-[--primary]' : 'text-[--foreground] group-hover:text-[--primary]'
              }`}>
                Include Video Scenes
              </h4>
            </div>
            <p className="text-sm text-[--muted-foreground] leading-relaxed">
              Transform key story moments into captivating short video clips that bring your characters to life.
            </p>
            {formData.include_video && (
              <div className="mt-3 text-sm text-green-600 dark:text-green-400 font-medium">
                ✓ Video generation enabled
              </div>
            )}
          </div>
        </label>

        {/* Video Style Selection - Only show when video is enabled */}
        {formData.include_video && (
          <div className="space-y-5 pl-2 border-l-4 border-[--primary]/20">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="text-lg">🎨</div>
                <h4 className="font-semibold">Video Style</h4>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {videoStyles.map((style) => (
                  <label
                    key={style.value}
                    className={`group relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                      formData.video_style === style.value
                        ? 'border-[--primary] bg-[--primary]/10 shadow-md'
                        : 'border-[--border] hover:border-[--primary]/50 hover:bg-[--muted]/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="video_style"
                      value={style.value}
                      checked={formData.video_style === style.value}
                      onChange={(e) => setFormData({ ...formData, video_style: e.target.value as VideoStyle })}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-2">{style.icon}</div>
                      <h5 className={`font-semibold text-sm transition-colors ${
                        formData.video_style === style.value 
                          ? 'text-[--primary]' 
                          : 'text-[--foreground] group-hover:text-[--primary]'
                      }`}>
                        {style.label}
                      </h5>
                      <p className="text-xs text-[--muted-foreground] mt-1">
                        {style.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Video Duration */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="text-lg">⏱️</div>
                <h4 className="font-semibold">Video Duration</h4>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {videoDurations.map((duration) => (
                  <label
                    key={duration.value}
                    className={`group relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                      formData.video_duration === duration.value
                        ? 'border-[--primary] bg-[--primary]/10 shadow-md'
                        : 'border-[--border] hover:border-[--primary]/50 hover:bg-[--muted]/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="video_duration"
                      value={duration.value}
                      checked={formData.video_duration === duration.value}
                      onChange={(e) => setFormData({ ...formData, video_duration: e.target.value as '8s' | '15s' | '25s' })}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <h5 className={`font-semibold text-lg transition-colors ${
                        formData.video_duration === duration.value 
                          ? 'text-[--primary]' 
                          : 'text-[--foreground] group-hover:text-[--primary]'
                      }`}>
                        {duration.label}
                      </h5>
                      <p className="text-xs text-[--muted-foreground] mt-1">
                        {duration.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Audio Toggle */}
        <label className="group flex items-start gap-4 p-5 rounded-xl border-2 border-[--border] cursor-pointer transition-all duration-300 hover:border-[--primary]/50 hover:bg-[--muted]/30">
          <div className="relative mt-1">
            <input
              type="checkbox"
              checked={formData.include_audio}
              onChange={(e) => setFormData({ ...formData, include_audio: e.target.checked })}
              className="w-5 h-5 text-[--primary] bg-[--background] border-2 border-[--border] rounded focus:ring-2 focus:ring-[--primary]/20"
            />
            {formData.include_audio && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xl">🎙️</div>
              <h4 className={`font-semibold text-lg transition-colors ${
                formData.include_audio ? 'text-[--primary]' : 'text-[--foreground] group-hover:text-[--primary]'
              }`}>
                Include Audio Narration
              </h4>
            </div>
            <p className="text-sm text-[--muted-foreground] leading-relaxed">
              Add professional voice narration to each page, creating an immersive storytelling experience.
            </p>
            {formData.include_audio && (
              <div className="mt-3 text-sm text-green-600 dark:text-green-400 font-medium">
                ✓ Audio narration enabled
              </div>
            )}
          </div>
        </label>
      </div>

      {/* Feature Summary */}
      {(formData.include_video || formData.include_audio) && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="text-2xl flex-shrink-0">🎯</div>
            <div>
              <h4 className="text-sm font-semibold text-[--foreground] mb-2">Multimedia Features Enabled</h4>
              <div className="space-y-1 text-xs text-[--muted-foreground]">
                {formData.include_video && (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span>Video scenes ({formData.video_style} style, {formData.video_duration} duration)</span>
                  </div>
                )}
                {formData.include_audio && (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span>Professional audio narration</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BookSettingsStep({ formData, setFormData }: { 
  formData: BookCreationForm
  setFormData: (data: BookCreationForm) => void 
}) {
  const ageGroups: Array<{ value: AgeGroup; label: string; icon: string; description: string; pageRange: string }> = [
    { value: '0-2', label: '0-2 years (Toddlers)', icon: '👶', description: 'Simple words, bright pictures', pageRange: '4-8 pages' },
    { value: '3-5', label: '3-5 years (Preschool)', icon: '🧒', description: 'Basic concepts, repetition', pageRange: '8-16 pages' },
    { value: '6-8', label: '6-8 years (Early readers)', icon: '📖', description: 'Short sentences, phonics', pageRange: '12-24 pages' },
    { value: '9-12', label: '9-12 years (Middle grade)', icon: '🎒', description: 'Complex stories, chapter books', pageRange: '16-32 pages' },
    { value: 'teen', label: 'Teen (13+ years)', icon: '🎓', description: 'Young adult themes', pageRange: '20-32 pages' }
  ]

  const getRecommendedPages = () => {
    const ageGroup = ageGroups.find(group => group.value === formData.target_age)
    if (ageGroup) {
      switch (formData.target_age) {
        case '0-2': return 6
        case '3-5': return 12
        case '6-8': return 16
        case '9-12': return 24
        case 'teen': return 28
        default: return 12
      }
    }
    return 12
  }

  const handleAgeChange = (value: AgeGroup) => {
    const recommendedPages = ageGroups.find(group => group.value === value)
    if (recommendedPages) {
      const pages = getRecommendedPages()
      setFormData({ 
        ...formData, 
        target_age: value,
        total_pages: pages
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="text-3xl">⚙️</div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] bg-clip-text text-transparent">
            Final Book Configuration
          </h3>
        </div>
        <p className="text-[--muted-foreground] text-sm max-w-md mx-auto">
          Set the final details to ensure your book is perfectly tailored to your target audience.
        </p>
      </div>

      {/* Age Group Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="text-xl">👥</div>
          <h4 className="text-lg font-semibold">Target Age Group</h4>
        </div>
        
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ageGroups.map((age) => (
            <label
              key={age.value}
              className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${
                formData.target_age === age.value
                  ? 'border-[--primary] bg-gradient-to-br from-[--primary]/5 via-[--primary]/10 to-[--primary]/5 shadow-md shadow-[--primary]/20'
                  : 'border-[--border] hover:border-[--primary]/50 bg-[--card] hover:bg-[--muted]/30'
              }`}
            >
              {/* Selection Indicator */}
              {formData.target_age === age.value && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              <input
                type="radio"
                name="target_age"
                value={age.value}
                checked={formData.target_age === age.value}
                onChange={(e) => handleAgeChange(e.target.value as AgeGroup)}
                className="sr-only"
              />
              
              <div className="text-center">
                <div className="text-3xl mb-2">{age.icon}</div>
                <h5 className={`font-semibold text-sm transition-colors mb-2 ${
                  formData.target_age === age.value 
                    ? 'text-[--primary]' 
                    : 'text-[--foreground] group-hover:text-[--primary]'
                }`}>
                  {age.label}
                </h5>
                <p className="text-xs text-[--muted-foreground] mb-2 leading-relaxed">
                  {age.description}
                </p>
                <div className="text-xs font-medium text-[--primary]/80 bg-[--primary]/10 rounded-full px-2 py-1">
                  {age.pageRange}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Page Count */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="text-xl">📄</div>
          <h4 className="text-lg font-semibold">Number of Pages</h4>
        </div>
        
        <div className="bg-[--card] border border-[--border] rounded-xl p-5">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-3">Pages in your book</label>
              <div className="relative">
                <input
                  type="number"
                  min="4"
                  max="32"
                  value={formData.total_pages}
                  onChange={(e) => setFormData({ ...formData, total_pages: parseInt(e.target.value) || 6 })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-[--border] bg-[--input] focus:border-[--primary] focus:ring-0 transition-colors text-lg font-semibold text-center"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[--muted-foreground]">
                  pages
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 text-center">
              <div className="text-sm text-[--muted-foreground] mb-1">Recommended for</div>
              <div className="text-sm font-semibold text-[--primary]">{ageGroups.find(g => g.value === formData.target_age)?.label}</div>
              <div className="text-lg font-bold text-[--foreground] mt-1">{getRecommendedPages()} pages</div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between text-xs text-[--muted-foreground]">
            <span>Minimum: 4 pages</span>
            <span>Maximum: 32 pages</span>
          </div>
        </div>
      </div>

      {/* Custom Instructions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="text-xl">📝</div>
          <h4 className="text-lg font-semibold">Custom Instructions</h4>
          <span className="text-sm text-[--muted-foreground] font-normal">(Optional)</span>
        </div>
        
        <div className="relative">
          <textarea
            value={formData.custom_instructions}
            onChange={(e) => setFormData({ ...formData, custom_instructions: e.target.value })}
            placeholder="Share any specific requests, themes, or details you'd like included in your story. For example: 'Make the main character have curly red hair' or 'Include a lesson about sharing'..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border-2 border-[--border] bg-[--input] focus:border-[--primary] focus:ring-0 transition-colors resize-none placeholder:text-[--muted-foreground]/60"
          />
          <div className="absolute bottom-3 right-3 text-xs text-[--muted-foreground]">
            {formData.custom_instructions.length}/500
          </div>
        </div>
        
        <div className="text-xs text-[--muted-foreground] flex items-start gap-2">
          <div className="text-base">💡</div>
          <div>
            <strong>Pro tip:</strong> The more specific you are, the better we can tailor your story. 
            Mention character traits, moral lessons, favorite colors, or special interests your child has.
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-2xl flex-shrink-0">📊</div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-[--foreground] mb-3">Book Configuration Summary</h4>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[--primary] rounded-full"></span>
                <span className="text-[--muted-foreground]">Age Group:</span>
                <span className="font-medium">{ageGroups.find(g => g.value === formData.target_age)?.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[--primary] rounded-full"></span>
                <span className="text-[--muted-foreground]">Pages:</span>
                <span className="font-medium">{formData.total_pages} pages</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <span className="w-2 h-2 bg-[--primary] rounded-full"></span>
                <span className="text-[--muted-foreground]">Custom Instructions:</span>
                <span className="font-medium">
                  {formData.custom_instructions ? 'Yes' : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}// Character Management Step Component
function CharacterManagementStep({ 
  formData, 
  setFormData, 
  projectId 
}: { 
  formData: BookCreationForm
  setFormData: (data: BookCreationForm) => void 
  projectId?: string
}) {
  if (!projectId) {
    return (
      <div className="text-center py-8">
        <p className="text-[--muted-foreground]">Project ID required for character management</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Character Management</h3>
        <p className="text-[--muted-foreground]">
          Create and manage characters for consistent AI-generated illustrations
        </p>
      </div>

      {/* Character Lock Settings */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-2xl flex-shrink-0">🎭</div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-[--foreground] mb-3">Character Consistency System</h4>
            
            {/* Character Lock Toggle */}
            <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-[--border] cursor-pointer transition-all duration-300 hover:border-[--primary]/50 hover:bg-[--muted]/30 mb-4">
              <div className="relative mt-1">
                <input
                  type="checkbox"
                  checked={formData.useCharacterLock}
                  onChange={(e) => setFormData({ ...formData, useCharacterLock: e.target.checked })}
                  className="w-5 h-5 text-[--primary] bg-[--background] border-2 border-[--border] rounded focus:ring-2 focus:ring-[--primary]/20"
                />
                {formData.useCharacterLock && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h5 className={`font-semibold transition-colors ${
                    formData.useCharacterLock ? 'text-[--primary]' : 'text-[--foreground]'
                  }`}>
                    Enable Character Lock System
                  </h5>
                </div>
                <p className="text-sm text-[--muted-foreground] leading-relaxed">
                  Ensure your main character looks consistent across all illustrations using AI-powered character profiles and prompt enhancement.
                </p>
                {formData.useCharacterLock && (
                  <div className="mt-3 text-sm text-green-600 dark:text-green-400 font-medium">
                    ✓ Character consistency enabled
                  </div>
                )}
              </div>
            </label>

            {/* Character Description - Only show when character lock is enabled */}
            {formData.useCharacterLock && (
              <div className="space-y-3 pl-2 border-l-4 border-[--primary]/20">
                <div className="flex items-center gap-2">
                  <div className="text-lg">📝</div>
                  <h5 className="font-semibold">Character Description</h5>
                  <span className="text-sm text-[--muted-foreground]">(Optional)</span>
                </div>
                
                <div className="relative">
                  <textarea
                    value={formData.characterDescription}
                    onChange={(e) => setFormData({ ...formData, characterDescription: e.target.value })}
                    placeholder="Describe your main character's appearance in detail: 'A friendly brown bear with a red vest, small round glasses, and a warm smile. Has fluffy fur and always carries a small backpack.'"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border-2 border-[--border] bg-[--input] focus:border-[--primary] focus:ring-0 transition-colors resize-none placeholder:text-[--muted-foreground]/60"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-[--muted-foreground]">
                    {formData.characterDescription.length}/300
                  </div>
                </div>
                
                <div className="text-xs text-[--muted-foreground] flex items-start gap-2">
                  <div className="text-base">💡</div>
                  <div>
                    <strong>Character Lock Tip:</strong> Be specific about physical features, clothing, and distinctive characteristics. 
                    This helps the AI maintain visual consistency across all illustrations in your story.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Character Manager Integration */}
      <div className="border border-[--border] rounded-xl overflow-hidden">
        <div className="bg-[--muted]/30 px-6 py-4 border-b border-[--border]">
          <h4 className="font-semibold text-[--foreground]">Advanced Character Management</h4>
          <p className="text-sm text-[--muted-foreground] mt-1">
            Create detailed character profiles for professional-level character consistency
          </p>
        </div>
        <div className="p-6">
          <CharacterManager projectId={projectId} />
        </div>
      </div>

      {/* Benefits Section */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-4 rounded-lg bg-[--card] border border-[--border]">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-2xl">🎨</div>
            <h5 className="font-semibold">Visual Consistency</h5>
          </div>
          <p className="text-sm text-[--muted-foreground]">
            Maintains character appearance across all illustrations in your story
          </p>
        </div>
        
        <div className="p-4 rounded-lg bg-[--card] border border-[--border]">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-2xl">🚀</div>
            <h5 className="font-semibold">Professional Quality</h5>
          </div>
          <p className="text-sm text-[--muted-foreground]">
            Create children's books with character consistency rivaling traditional publishing
          </p>
        </div>
      </div>
    </div>
  )
}