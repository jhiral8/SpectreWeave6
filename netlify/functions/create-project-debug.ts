import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse } from './_utils'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const handler = createNetlifyHandler({
  POST: async (request: Request) => {
    try {
      const { projectId } = await getJsonBody(request)
      
      if (!projectId) {
        return errorResponse('projectId required', 400)
      }
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return errorResponse('Authentication failed', 401)
      }
      
      // Try to create the project
      const { data: project, error: insertError } = await supabase
        .from('projects')
        .insert({
          id: projectId,
          title: 'Untitled Document',
          user_id: user.id,
          status: 'draft',
          archived: false,
        })
        .select()
        .single()
      
      if (insertError) {
        return errorResponse('Failed to create project', 500)
      }
      
      return jsonResponse({ 
        success: true,
        project,
        user: { id: user.id, email: user.email }
      })
      
    } catch (error) {
      return errorResponse('Internal error', 500)
    }
  }
})