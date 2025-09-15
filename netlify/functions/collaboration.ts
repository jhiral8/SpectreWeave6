import { createNetlifyHandler, jsonResponse, errorResponse } from './_utils'
import jsonwebtoken from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET

export const handler = createNetlifyHandler({
  POST: async (request: Request) => {
    try {
      // Check if JWT secret is configured
      if (!JWT_SECRET) {
        return errorResponse('Collaboration service not configured', 500)
      }

      const jwt = jsonwebtoken.sign(
        {
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiry
        },
        JWT_SECRET
      )

      return jsonResponse({ token: jwt })
    } catch (error) {
      console.error('Collaboration token generation failed:', error)
      return errorResponse('Failed to generate collaboration token', 500)
    }
  }
})