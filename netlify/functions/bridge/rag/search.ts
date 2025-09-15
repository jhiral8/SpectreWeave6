import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { ragSystem } from '../../../src/lib/ai/ragSystem'
import { createProtectedRoute } from '../../../src/lib/middleware/auth'

export const handler = createNetlifyHandler({

})