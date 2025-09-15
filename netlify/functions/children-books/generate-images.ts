import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { createClient, createClientWithAuth, createServiceRoleClient } from '../../../src/lib/supabase/server'
import { childrensBookImageService, type ImageGenerationRequest } from '../../../src/lib/ai/childrensBookImages'

export const handler = createNetlifyHandler({

  POST: async (request: Request) => {
    
  let transactionStarted = false
  let transactionId: string | null = null
  
  try {
    // Extract Bearer token if present
    const authHeader = request.headers.get('Authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
    
    // Try Bearer token first, then fallback to cookies
    let supabase = bearerToken ? createClientWithAuth(bearerToken) : createClient()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return jsonResponse(
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
      return jsonResponse(
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
      return jsonResponse(
        { error: 'Book not found or access denied' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'generate-single': {
        // Generate a single illustration
        if (!illustrationPrompt || pageNumber === undefined || !style || !theme || !targetAge) {
          return jsonResponse(
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

        // Upload base64 image to Supabase Storage using service role client
        if (generatedImage.base64) {
          const fileName = `${user.id}/${bookId}/page_${pageNumber}_${generatedImage.id}.png`
          const serviceClient = createServiceRoleClient()
          const { data: uploadData, error: uploadError } = await serviceClient.storage
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

        // Update book_pages table using optimized database function
        const { data: updateResult, error: updateError } = await supabase
          .rpc('update_book_page_illustration', {
            p_book_id: bookId,
            p_page_number: pageNumber,
            p_illustration_url: generatedImage.url,
            p_user_id: user.id,
            p_illustration_prompt: generatedImage.enhancedPrompt
          })

        if (updateError) {
          console.error('Error updating book page:', updateError)
          throw new Error(`Failed to update page ${pageNumber}: ${updateError.message}`)
        }

        if (!updateResult || updateResult.length === 0 || updateResult[0].updated_count === 0) {
          console.error(`No pages were updated for book ${bookId}, page ${pageNumber}`)
          throw new Error(`Page ${pageNumber} not found or access denied`)
        }

        console.log(`Successfully updated page ${pageNumber} using ${updateResult[0].update_method} method`)

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

        return jsonResponse({
          success: true,
          image: {
            ...generatedImage,
            base64: undefined // Don't send base64 back to client
          },
          metadata: {
            pageNumber,
            generatedAt: new Date().toISOString()
          }
        })
      }

      case 'generate-batch': {
        // Generate illustrations for multiple pages
        if (!pages || !Array.isArray(pages) || !style || !theme || !targetAge) {
          return jsonResponse(
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

        // Start a transaction for batch operations
        const { data: transaction, error: transactionError } = await supabase
          .rpc('begin_transaction')
        
        if (transactionError) {
          console.warn('Could not start database transaction, proceeding without transaction management')
        } else {
          transactionStarted = true
          transactionId = transaction?.transaction_id
        }

        const generatedImages = await childrensBookImageService.generateBookIllustrations(
          pages,
          bookSettings
        )

        // Process images with proper error handling and atomic operations
        const uploadedImages = []
        const uploadErrors = []
        const updateData = []

        // First, upload all images to storage
        
        for (let i = 0; i < generatedImages.length; i++) {
          const image = generatedImages[i]
          
          try {
            if (image.base64) {
              const fileName = `${user.id}/${bookId}/page_${image.metadata.pageNumber}_${image.id}.png`
              
              // Use service role client for storage upload to bypass RLS
              const serviceClient = createServiceRoleClient()
              const { data: uploadData, error: uploadError } = await serviceClient.storage
                .from('book-images')
                .upload(fileName, Buffer.from(image.base64, 'base64'), {
                  contentType: 'image/png',
                  upsert: true
                })

              if (uploadError) {
                console.error(`Storage upload failed for page ${image.metadata.pageNumber}:`, uploadError)
                uploadErrors.push({
                  pageNumber: image.metadata.pageNumber,
                  error: uploadError.message
                })
                continue
              }
              if (uploadData) {
                const { data: urlData } = supabase.storage
                  .from('book-images')
                  .getPublicUrl(fileName)
                
                image.url = urlData.publicUrl
                
                // Prepare data for batch update
                updateData.push({
                  page_number: image.metadata.pageNumber,
                  illustration_url: image.url,
                  illustration_prompt: image.enhancedPrompt
                })
                
                uploadedImages.push({
                  ...image,
                  base64: undefined // Don't send base64 back
                })
              }
            } else {
              uploadErrors.push({
                pageNumber: image.metadata?.pageNumber || 0,
                error: 'No image data generated'
              })
              continue
            }

          } catch (error) {
            console.error(`Exception in image processing for page ${image.metadata?.pageNumber}:`, error)
            uploadErrors.push({
              pageNumber: image.metadata?.pageNumber || 0,
              error: error instanceof Error ? error.message : 'Unknown upload error'
            })
          }
        }

        // Update database with uploaded images
        if (updateData.length > 0) {
          
          for (const update of updateData) {
            try {
              // Try project_id first
              const { error: projectError } = await supabase
                .from('book_pages')
                .update({
                  illustration_url: update.illustration_url,
                  illustration_prompt: update.illustration_prompt,
                  updated_at: new Date().toISOString()
                })
                .eq('project_id', bookId)
                .eq('page_number', update.page_number)
                .eq('user_id', user.id)
              
              if (projectError) {
                
                // Try book_id if project_id failed
                const { error: bookError } = await supabase
                  .from('book_pages')
                  .update({
                    illustration_url: update.illustration_url,
                    illustration_prompt: update.illustration_prompt,
                    updated_at: new Date().toISOString()
                  })
                  .eq('book_id', bookId)
                  .eq('page_number', update.page_number)
                  .eq('user_id', user.id)
                
                if (bookError) {
                  console.error(`Database update failed for page ${update.page_number}:`, bookError.message)
                  uploadErrors.push({
                    pageNumber: update.page_number,
                    error: bookError.message
                  })
                }
              }
            } catch (error) {
              console.error(`Exception updating page ${update.page_number}:`, error)
              uploadErrors.push({
                pageNumber: update.page_number,
                error: error instanceof Error ? error.message : 'Unknown update error'
              })
            }
          }
        }

        // Handle transaction completion
        if (transactionStarted && uploadErrors.length === 0) {
          // Commit transaction if all operations succeeded
          const { error: commitError } = await supabase
            .rpc('commit_transaction', { transaction_id: transactionId })
          
          if (commitError) {
            console.error('Failed to commit transaction:', commitError)
            // Even if commit fails, we'll continue since data is already updated
          }
        } else if (transactionStarted && uploadErrors.length > 0) {
          // Rollback transaction if there were errors
          const { error: rollbackError } = await supabase
            .rpc('rollback_transaction', { transaction_id: transactionId })
          
          if (rollbackError) {
            console.error('Failed to rollback transaction:', rollbackError)
          }
          
          return jsonResponse({
            success: false,
            error: 'Batch image generation partially failed',
            details: uploadErrors,
            images: uploadedImages.filter(img => img.url) // Return successful images
          }, { status: 207 }) // 207 Multi-Status
        }

        // Log any errors but don't fail the entire operation if transaction succeeded
        if (uploadErrors.length > 0 && !transactionStarted) {
          console.warn('Some images had errors during batch processing:', uploadErrors)
        }

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

        return jsonResponse({
          success: true,
          images: uploadedImages,
          metadata: {
            totalGenerated: uploadedImages.length,
            totalErrors: uploadErrors.length,
            generatedAt: new Date().toISOString(),
            errors: uploadErrors.length > 0 ? uploadErrors : undefined
          }
        })
      }

      default:
        return jsonResponse(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in image generation endpoint:', error)
    
    // Attempt to rollback transaction if it was started
    if (transactionStarted && transactionId) {
      try {
        const supabase = createClient()
        await supabase.rpc('rollback_transaction', { transaction_id: transactionId })
      } catch (rollbackError) {
        console.error('Failed to rollback transaction during error handling:', rollbackError)
      }
    }
    
    return jsonResponse(
      { 
        error: 'Failed to generate images',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        transactionRolledBack: transactionStarted
      },
      { status: 500 }
    )
  }

  }
})