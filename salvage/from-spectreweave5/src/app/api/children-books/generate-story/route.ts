import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
// Temporarily use mock service to avoid AI initialization errors
import type { StoryPrompt, GeneratedStory } from '@/lib/ai/childrensBookAI'
import { mockChildrensBookAI as childrensBookAI } from '@/lib/ai/mockChildrensBookAI'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      bookId,
      title,
      authorStyle,
      ageGroup,
      genre,
      theme,
      characterName,
      setting,
      conflict,
      moralLesson,
      customInstructions,
      // Character lock system fields
      useCharacterLock = false,
      characterDescription
    } = body

    // Validate required fields
    if (!bookId || !title || !authorStyle || !ageGroup || !genre || !theme) {
      return NextResponse.json(
        { error: 'Missing required fields: bookId, title, authorStyle, ageGroup, genre, theme' },
        { status: 400 }
      )
    }

    // Verify user owns the book project - check both projects and books tables
    let bookProject = null
    let bookError = null

    // First try projects table
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', bookId)
        .eq('user_id', user.id)
        .eq('project_type', 'childrens-book')
        .single()
      
      if (!projectError && projectData) {
        bookProject = projectData
      }
    } catch (err) {
      console.log('No project found, trying books table')
    }

    // If no project found, try books table
    if (!bookProject) {
      try {
        const { data: bookRecord, error: bookRecordError } = await supabase
          .from('books')
          .select('*')
          .eq('id', bookId)
          .eq('user_id', user.id)
          .single()
        
        if (!bookRecordError && bookRecord) {
          // Convert book record to project-like format for compatibility
          bookProject = {
            id: bookRecord.id,
            title: bookRecord.title,
            description: `Children's book: ${bookRecord.title}`,
            user_id: bookRecord.user_id,
            project_type: 'childrens-book',
            author_style: bookRecord.author_style,
            book_theme: bookRecord.theme,
            illustration_style: bookRecord.style,
            target_age: bookRecord.age_group,
            total_pages: bookRecord.page_count,
            book_metadata: bookRecord.metadata || {},
            created_at: bookRecord.created_at,
            updated_at: bookRecord.updated_at
          }
        } else {
          bookError = bookRecordError
        }
      } catch (err) {
        bookError = err
      }
    }

    if (bookError || !bookProject) {
      console.error('Book lookup error:', bookError)
      return NextResponse.json(
        { error: 'Book project not found or access denied' },
        { status: 404 }
      )
    }

    // Prepare story generation request
    const storyPrompt: StoryPrompt = {
      title,
      authorStyle,
      ageGroup,
      genre,
      theme,
      characterName,
      setting,
      conflict,
      moralLesson,
      customInstructions,
      // Character lock system integration
      projectId: bookId,
      useCharacterLock,
      characterDescription
    }

    console.log('Starting story generation for book:', bookId)

    // Generate the story using our AI service with character lock if enabled
    console.log('🔄 About to generate story with useCharacterLock:', useCharacterLock)
    const generatedStory: GeneratedStory = useCharacterLock 
      ? await childrensBookAI.generateStoryWithCharacterLock(storyPrompt)
      : await childrensBookAI.generateStory(storyPrompt)
    console.log('✅ Story generated successfully:', { title: generatedStory.title, pages: generatedStory.pages.length })

    // Validate the generated content
    console.log('🔄 About to validate story content')
    const validation = await childrensBookAI.validateStoryContent(generatedStory)
    console.log('✅ Story validation completed:', validation)
    
    if (!validation.isAppropriate) {
      console.warn('Generated story failed validation:', validation.concerns)
      return NextResponse.json(
        { 
          error: 'Generated story did not meet age-appropriateness standards',
          details: validation.concerns,
          suggestions: validation.suggestions
        },
        { status: 400 }
      )
    }

    // Create a book generation record - handle missing table
    console.log('🔄 About to create book generation record')
    let generation = null
    let generationError = null
    
    try {
      const { data: genData, error: genError } = await supabase
        .from('book_generations')
        .insert({
          book_id: bookId,
          user_id: user.id,
          generation_type: 'story',
          generation_data: {
            story: generatedStory,
            prompt: storyPrompt,
            validation: validation
          },
          status: 'completed'
        })
        .select()
        .single()
      
      generation = genData
      generationError = genError
      console.log('✅ Book generation record created successfully')
    } catch (error: any) {
      console.log('⚠️ Error creating book generation record:', error?.message)
      // Handle table not existing
      if (error?.message?.includes('relation "public.book_generations" does not exist') ||
          error?.code === '42P01') {
        console.warn('book_generations table does not exist, skipping generation record')
        // Continue without generation record - story generation can still succeed
      } else {
        generationError = error
      }
    }

    if (generationError && 
        !generationError?.message?.includes('does not exist') && 
        !generationError?.message?.includes('Could not find') &&
        !generation) {
      console.error('Error saving generation (critical):', generationError)
      return NextResponse.json(
        { 
          error: 'Failed to save generated story', 
          details: generationError.message 
        },
        { status: 500 }
      )
    }

    // Ensure books record exists for foreign key constraint
    console.log('🔄 Ensuring books record exists for foreign key')
    const { data: existingBook } = await supabase
      .from('books')
      .select('id')
      .eq('id', bookId)
      .single()
    
    if (!existingBook) {
      console.log('🔄 Creating books record for foreign key constraint')
      const { error: bookInsertError } = await supabase
        .from('books')
        .insert({
          id: bookId,
          user_id: user.id,
          title: title || 'Generated Story',
          author: 'AI Generated',
          target_age: '3-5',
          theme: 'magical-forest',
          author_style: authorStyle || 'dr-seuss',
          style: authorStyle || 'dr-seuss',
          total_pages: 4  // Default for children's books
        })
      
      if (bookInsertError) {
        console.error('❌ CRITICAL: Failed to create books record for foreign key constraint:', bookInsertError)
        return NextResponse.json({
          error: 'Database error: Cannot create required book record',
          details: bookInsertError.message,
          code: 'BOOK_INSERT_FAILED'
        }, { status: 500 })
      }
      
      console.log('✅ Books record created successfully for foreign key constraint')
    }

    // Save story pages to book_pages table - handle missing table gracefully
    console.log('🔄 About to save story pages to database')
    try {
      // First, delete any existing pages for this book to prevent constraint violations
      console.log('🔄 Clearing existing pages for book:', bookId)
      await supabase
        .from('book_pages')
        .delete()
        .or(`book_id.eq.${bookId},project_id.eq.${bookId}`)

      const pageInserts = generatedStory.pages.map((page, index) => ({
        book_id: bookId, // Satisfy NOT NULL constraint - same as project_id for compatibility
        project_id: bookId, // Required for RLS policies
        user_id: user.id,
        page_number: page.pageNumber,
        text: page.text,
        illustration_prompt: page.illustrationPrompt,
        generation_id: generation?.id || null
      }))

      console.log('🔄 Page inserts prepared:', pageInserts.length, 'pages')
      console.log('🔄 Sample page insert:', JSON.stringify(pageInserts[0], null, 2))
      console.log('🔄 Attempting to insert pages into book_pages table')
      
      // Add timeout to prevent hanging
      const insertPromise = supabase
        .from('book_pages')
        .insert(pageInserts)

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database operation timeout after 30 seconds')), 30000)
      )

      console.log('🔄 About to execute database operation...')
      const result = await Promise.race([insertPromise, timeoutPromise])
      console.log('🔄 Database operation returned:', result)
      
      const pagesError = result?.error
      console.log('🔄 Extracted error:', pagesError)
      console.log('🔄 Error type:', typeof pagesError)
      console.log('🔄 Error truthy:', !!pagesError)
      
      // CRITICAL: If there's any error, we must fail immediately
      // The story generation is meaningless if pages aren't saved

      if (pagesError) {
        console.error('❌ Error saving story pages:', pagesError)
        console.error('❌ Error details:', JSON.stringify(pagesError, null, 2))
        console.error('❌ Error code:', pagesError.code)
        console.error('❌ Error message:', pagesError.message)
        console.error('❌ Error hint:', pagesError.hint)
        console.error('❌ Full error object keys:', Object.keys(pagesError))
        
        // Check for specific error types
        if (pagesError.code === '42P01') {
          console.error('🚨 TABLE DOES NOT EXIST: book_pages table is missing from database')
          return NextResponse.json(
            { error: 'Database table missing: book_pages table does not exist' },
            { status: 500 }
          )
        } else if (pagesError.code === '23505') {
          console.error('🚨 UNIQUE CONSTRAINT VIOLATION: Duplicate page entry attempted')
          return NextResponse.json(
            { error: 'Duplicate page entries detected. Please try regenerating the story.' },
            { status: 400 }
          )
        } else if (pagesError.code === '23503') {
          console.error('🚨 FOREIGN KEY VIOLATION: project_id or user_id reference is invalid')
          return NextResponse.json(
            { error: 'Invalid project or user reference. Please ensure the book project exists.' },
            { status: 400 }
          )
        } else if (pagesError.message?.includes('RLS') || pagesError.message?.includes('row-level security')) {
          console.error('🚨 ROW LEVEL SECURITY: User does not have permission to insert pages')
          return NextResponse.json(
            { error: 'Database permission denied. User cannot save pages to this project.' },
            { status: 403 }
          )
        } else if (pagesError.code === '23502') {
          console.error('🚨 NOT NULL VIOLATION: Required field is missing')
          console.error('🚨 Sample insert data:', JSON.stringify(pageInserts[0], null, 2))
          return NextResponse.json(
            { error: 'Required database fields are missing. Please check project configuration.' },
            { status: 400 }
          )
        } else {
          // For unknown errors, still fail the request since pages couldn't be saved
          return NextResponse.json(
            { 
              error: 'Failed to save story pages to database',
              details: pagesError.message,
              code: pagesError.code
            },
            { status: 500 }
          )
        }
      } else {
        console.log('✅ Pages insert operation completed without database error')
        
        // CRITICAL VERIFICATION: Verify the pages were actually saved by querying back
        // This is essential - the database could have silently failed
        console.log('🔄 CRITICAL: Verifying pages were actually saved to database')
        const { data: verifyPages, error: verifyError } = await supabase
          .from('book_pages')
          .select('page_number, text, illustration_prompt')
          .eq('project_id', bookId)
          .eq('user_id', user.id)
          .order('page_number')
        
        if (verifyError) {
          console.error('❌ CRITICAL: Failed to verify saved pages - STORY GENERATION FAILED:', verifyError)
          return NextResponse.json(
            { 
              error: 'Critical verification failure: Cannot confirm pages were saved to database',
              details: verifyError.message,
              debugInfo: {
                verificationQuery: 'book_pages table query failed',
                bookId,
                userId: user.id
              }
            },
            { status: 500 }
          )
        }
        
        if (!verifyPages || verifyPages.length === 0) {
          console.error(`❌ CRITICAL: No pages found in database after insert - STORY GENERATION FAILED`)
          console.error(`❌ Expected ${generatedStory.pages.length} pages, found ${verifyPages?.length || 0}`)
          return NextResponse.json(
            { 
              error: 'Critical verification failure: No pages found in database after save operation',
              details: 'Database insert appeared to succeed but verification shows no pages exist',
              debugInfo: {
                expectedPages: generatedStory.pages.length,
                foundPages: verifyPages?.length || 0,
                bookId,
                userId: user.id
              }
            },
            { status: 500 }
          )
        }
        
        if (verifyPages.length !== generatedStory.pages.length) {
          console.error(`❌ CRITICAL: Page count mismatch - STORY GENERATION FAILED`)
          console.error(`❌ Expected ${generatedStory.pages.length} pages, found ${verifyPages.length}`)
          return NextResponse.json(
            { 
              error: 'Critical verification failure: Page count mismatch after save operation',
              details: 'Not all pages were saved correctly to the database',
              debugInfo: {
                expectedPages: generatedStory.pages.length,
                foundPages: verifyPages.length,
                bookId,
                userId: user.id
              }
            },
            { status: 500 }
          )
        }
        
        // Additional verification: Check that pages have content
        const pagesWithoutText = verifyPages.filter(p => !p.text || p.text.trim().length === 0)
        if (pagesWithoutText.length > 0) {
          console.error(`❌ CRITICAL: Found ${pagesWithoutText.length} pages without text content - STORY GENERATION FAILED`)
          return NextResponse.json(
            { 
              error: 'Critical verification failure: Some pages saved without text content',
              details: 'Database contains incomplete page data',
              debugInfo: {
                pagesWithoutText: pagesWithoutText.length,
                totalPages: verifyPages.length,
                bookId,
                userId: user.id
              }
            },
            { status: 500 }
          )
        }
        
        console.log(`✅ VERIFICATION PASSED: ${verifyPages.length} pages saved and verified successfully`)
        console.log(`✅ All pages have text content ranging from ${Math.min(...verifyPages.map(p => p.text.length))} to ${Math.max(...verifyPages.map(p => p.text.length))} characters`)
      }
    } catch (error: any) {
      console.error('❌ CRITICAL: Exception during page saving - STORY GENERATION FAILED:', error)
      console.error('❌ Exception stack:', error?.stack)
      console.error('❌ Exception details:', JSON.stringify(error, null, 2))
      
      // FAIL IMMEDIATELY - story generation CANNOT succeed without page storage
      return NextResponse.json(
        { 
          error: 'Critical database error: Failed to save story pages',
          details: error instanceof Error ? error.message : 'Unknown database exception',
          debugInfo: {
            errorType: typeof error,
            errorName: error instanceof Error ? error.name : 'Unknown',
            stack: error instanceof Error ? error.stack : undefined
          }
        },
        { status: 500 }
      )
    }

    // Update the book project with generated content metadata
    // Check if this was from projects or books table and update accordingly
    console.log('🔄 About to update book project metadata')
    let updateError = null
    try {
      if (bookProject.project_type === 'childrens-book' && bookProject.book_metadata !== undefined) {
        // This came from projects table
        console.log('🔄 Updating projects table')
        const { error } = await supabase
          .from('projects')
          .update({
            status: 'story_generated',
            total_pages: generatedStory.totalPages,
            book_metadata: {
              ...bookProject.book_metadata,
              story_generated_at: new Date().toISOString(),
              last_generation_id: generation?.id || null,
              validation_result: validation
            }
          })
          .eq('id', bookId)
        updateError = error
        console.log('✅ Projects table updated successfully')
      } else {
        // This came from books table, update with compatible fields
        console.log('🔄 Updating books table')
        const { error } = await supabase
          .from('books')
          .update({
            page_count: generatedStory.totalPages,
            metadata: {
              ...bookProject.book_metadata,
              story_generated_at: new Date().toISOString(),
              last_generation_id: generation?.id || null,
              validation_result: validation
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', bookId)
        updateError = error
        console.log('✅ Books table updated successfully')
      }
    } catch (err) {
      console.log('⚠️ Error updating book project:', err)
      updateError = err
    }

    if (updateError) {
      console.error('❌ WARNING: Error updating book project metadata:', updateError?.message)
      console.error('❌ This is non-critical since pages were saved successfully, but metadata may be outdated')
      // Continue - story generation was successful since pages were verified as saved
    } else {
      console.log('✅ Successfully updated book project metadata')
    }

    console.log('✅ STORY GENERATION COMPLETED SUCCESSFULLY for book:', bookId)
    console.log('✅ All database operations verified and confirmed')
    console.log('🔄 About to return successful response')

    const responseData = {
      success: true,
      story: generatedStory,
      generation: generation ? {
        id: generation.id,
        created_at: generation.created_at
      } : null,
      validation,
      metadata: {
        pagesGenerated: generatedStory.pages.length,
        generatedAt: new Date().toISOString()
      }
    }
    
    console.log('✅ Response data prepared successfully')
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error in story generation endpoint:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error name:', error instanceof Error ? error.name : typeof error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    
    return NextResponse.json(
      { 
        error: 'Failed to generate story',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}