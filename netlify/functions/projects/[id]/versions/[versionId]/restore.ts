import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { createClient } from '../../../src/lib/supabase/server'
import { createProtectedRoute } from '../../../src/lib/middleware/auth'
import {

export const handler = createNetlifyHandler({

})