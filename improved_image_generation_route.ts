/**
 * IMPROVED IMAGE GENERATION ROUTE
 * This version handles duplicate book_pages entries more gracefully
 * and provides better error handling and logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { childrensBookImageService, type ImageGenerationRequest } from '@/lib/ai/childrensBookImages'

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
      action,
      pageNumber,
      illustrationPrompt,
      style,
      theme,
      targetAge,
      pages // For batch generation
    } = body

    // Validate required fields
    if (!bookId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: bookId, action' },
        { status: 400 }
      )
    }

    // Verify user owns the book - check both projects and books tables
    let bookProject = null
    
    // First try to find project in projects table
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .eq('project_type', 'childrens-book')
      .single()

    if (project) {
      bookProject = project
    } else {
      // If not found in projects, try books table for legacy compatibility
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .eq('user_id', user.id)
        .single()
      
      if (book) {
        bookProject = book
      }
    }

    if (!bookProject) {
      return NextResponse.json(
        { error: 'Book not found or access denied' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'generate-single': {
        // Generate a single illustration
        if (!illustrationPrompt || pageNumber === undefined || !style || !theme || !targetAge) {
          return NextResponse.json(
            { error: 'Missing required fields for single image generation' },
            { status: 400 }
          )
        }

        console.log(`Generating illustration for book ${bookId}, page ${pageNumber}`)

        const imageRequest: ImageGenerationRequest = {
          prompt: illustrationPrompt,
          style,
          pageNumber,
          bookTheme: theme,
          targetAge,
          bookId,
          userId: user.id
        }

        const generatedImage = await childrensBookImageService.generateIllustration(imageRequest)

        // Upload base64 image to Supabase Storage
        if (generatedImage.base64) {
          const fileName = `${bookId}/page_${pageNumber}_${generatedImage.id}.png`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('book-images')
            .upload(fileName, Buffer.from(generatedImage.base64, 'base64'), {
              contentType: 'image/png',
              upsert: true
            })

          if (!uploadError && uploadData) {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('book-images')
              .getPublicUrl(fileName)
            
            generatedImage.url = urlData.publicUrl
          }
        }

        // IMPROVED: Handle duplicate entries more gracefully
        const result = await this.updateOrInsertBookPage(supabase, {
          bookId,
          pageNumber,
          imageUrl: generatedImage.url,
          illustrationPrompt: generatedImage.enhancedPrompt,
          userId: user.id
        })

        if (!result.success) {
          console.error('Error updating book page:', result.error)
          // Don't fail the entire request if database update fails
          // The image was generated successfully and uploaded to storage
        }

        // Create generation record
        await supabase
          .from('book_generations')
          .insert({
            book_id: bookId,
            user_id: user.id,
            generation_type: 'image',
            generation_data: {
              page_number: pageNumber,
              image: generatedImage,
              request: imageRequest
            },
            status: 'completed'
          })

        return NextResponse.json({
          success: true,
          image: {
            ...generatedImage,
            base64: undefined // Don't send base64 back to client
          },
          metadata: {
            pageNumber,
            generatedAt: new Date().toISOString()
          },
          databaseUpdate: result.success ? 'success' : 'failed_but_image_generated'
        })
      }

      case 'generate-batch': {
        // Generate illustrations for multiple pages
        if (!pages || !Array.isArray(pages) || !style || !theme || !targetAge) {
          return NextResponse.json(
            { error: 'Missing required fields for batch generation' },
            { status: 400 }
          )
        }

        console.log(`Generating ${pages.length} illustrations for book ${bookId}`)

        const bookSettings = {
          style,
          theme,
          targetAge,
          bookId,
          userId: user.id
        }

        const generatedImages = await childrensBookImageService.generateBookIllustrations(
          pages,
          bookSettings
        )

        // Upload all images to storage and update database
        const uploadedImages = await Promise.all(
          generatedImages.map(async (image) => {
            if (image.base64) {
              const fileName = `${bookId}/page_${image.metadata.pageNumber}_${image.id}.png`
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('book-images')
                .upload(fileName, Buffer.from(image.base64, 'base64'), {
                  contentType: 'image/png',
                  upsert: true
                })

              if (!uploadError && uploadData) {
                const { data: urlData } = supabase.storage
                  .from('book-images')
                  .getPublicUrl(fileName)
                
                image.url = urlData.publicUrl

                // IMPROVED: Handle duplicate entries more gracefully
                await this.updateOrInsertBookPage(supabase, {
                  bookId,
                  pageNumber: image.metadata.pageNumber,
                  imageUrl: image.url,
                  illustrationPrompt: image.enhancedPrompt,
                  userId: user.id
                })
              }
            }

            return {
              ...image,
              base64: undefined // Don't send base64 back
            }
          })
        )

        // Create generation record for batch
        await supabase
          .from('book_generations')
          .insert({
            book_id: bookId,
            user_id: user.id,
            generation_type: 'images_batch',
            generation_data: {
              pages_generated: uploadedImages.length,
              images: uploadedImages,
              settings: bookSettings
            },
            status: 'completed'
          })

        // Update project status
        await supabase
          .from('projects')
          .update({
            status: 'images_generated',
            book_metadata: {
              ...bookProject.book_metadata,
              images_generated_at: new Date().toISOString(),
              images_count: uploadedImages.length
            }
          })
          .eq('id', bookId)

        return NextResponse.json({
          success: true,
          images: uploadedImages,
          metadata: {
            totalGenerated: uploadedImages.length,
            generatedAt: new Date().toISOString()
          }
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in image generation endpoint:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate images',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }

  /**
   * IMPROVED: Smart update/insert for book_pages that handles duplicates
   */
  private async updateOrInsertBookPage(supabase: any, {
    bookId,
    pageNumber,
    imageUrl,
    illustrationPrompt,
    userId
  }: {
    bookId: string
    pageNumber: number
    imageUrl: string
    illustrationPrompt: string
    userId: string
  }) {
    try {
      const updateData = {
        image_url: imageUrl,
        illustration_prompt: illustrationPrompt,
        updated_at: new Date().toISOString()
      }

      // First, try to delete any existing entries for this book_id and page_number
      // This removes duplicates before attempting to insert/update
      const { error: deleteError } = await supabase
        .from('book_pages')
        .delete()
        .eq('book_id', bookId)
        .eq('page_number', pageNumber)

      if (deleteError) {
        console.warn('Could not delete existing entries:', deleteError)
        // Continue anyway - might not exist
      }

      // Also check for project_id entries and delete those too
      const { error: deleteProjectError } = await supabase
        .from('book_pages')
        .delete()
        .eq('project_id', bookId)
        .eq('page_number', pageNumber)

      if (deleteProjectError) {
        console.warn('Could not delete existing project entries:', deleteProjectError)
        // Continue anyway - might not exist
      }

      // Now insert a fresh entry
      const { error: insertError } = await supabase
        .from('book_pages')
        .insert({
          book_id: bookId,
          project_id: bookId, // Support both for compatibility
          page_number: pageNumber,
          user_id: userId,
          ...updateData
        })

      if (insertError) {
        console.error('Insert failed:', insertError)
        return { success: false, error: insertError }
      }

      console.log(`Successfully updated book_pages for book ${bookId}, page ${pageNumber}`)
      return { success: true }

    } catch (error) {
      console.error('Error in updateOrInsertBookPage:', error)
      return { success: false, error }
    }
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