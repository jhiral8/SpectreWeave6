import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { createProtectedRoute } from '../../../src/lib/middleware/auth'
import { createClient } from '../../../src/lib/supabase/server'

export const handler = createNetlifyHandler({

})