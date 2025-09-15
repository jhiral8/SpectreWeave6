import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { createProtectedRoute } from '../../../src/lib/middleware/auth'
import { agentsRepo } from '../../../src/lib/services/agentsRepo'

export const handler = createNetlifyHandler({

})