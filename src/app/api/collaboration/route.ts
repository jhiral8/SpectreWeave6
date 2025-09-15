import jsonwebtoken from 'jsonwebtoken'

const JWT_SECRET = process.env?.TIPTAP_COLLAB_SECRET as string

export async function POST(): Promise<Response> {
  try {
    // Check if JWT secret is configured
    if (!JWT_SECRET) {
      return new Response(
        JSON.stringify({ 
          error: 'Collaboration service not configured',
          token: null 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const jwt = await jsonwebtoken.sign(
      {
        /* object to be encoded in the JWT */
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiry
      },
      JWT_SECRET,
    )

    return new Response(
      JSON.stringify({ token: jwt }),
      { 
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Collaboration token generation failed:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate collaboration token',
        token: null 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
