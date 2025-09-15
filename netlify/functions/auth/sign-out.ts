import { createNetlifyHandler, getJsonBody, jsonResponse, errorResponse, getPathParams } from '../_utils'
import { createClient } from '../../../src/lib/supabase/server'
import { redirect } from 'next/navigation'

export const handler = createNetlifyHandler({

  POST: async (request: Request) => {
    export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/')

  }
})