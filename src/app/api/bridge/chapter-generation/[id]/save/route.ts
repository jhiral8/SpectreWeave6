import { NextRequest, NextResponse } from 'next/server'
import { createProtectedRoute } from '@/lib/middleware/auth'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export const POST = createProtectedRoute(async (_ctx, req: NextRequest, _perm, { params }: { params: { id: string } }) => {
  const { id } = params
  try {
    const body = await req.json().catch(() => ({}))
    const projectId: string | undefined = body?.projectId
    const title: string | undefined = body?.title
    const description: string | undefined = body?.description

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    // 1) Fetch generation result (final chapter text) via local bridge
    const authHeader = req.headers.get('authorization') || ''
    const origin = req.nextUrl.origin
    const res = await fetch(`${origin}/api/bridge/chapter-generation/${encodeURIComponent(id)}/result`, {
      headers: authHeader ? { Authorization: authHeader } : {},
      cache: 'no-store',
    })
    const resultPayload = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(resultPayload, { status: res.status })
    }
    const finalText: string = String(resultPayload?.final_chapter || '')
    if (!finalText.trim()) {
      return NextResponse.json({ error: 'No content in generation result' }, { status: 400 })
    }

    // 2) Persist as chapter in Supabase
    const supabase = createClient()

    // Ensure project exists
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()
    if (projErr || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Determine next order
    let orderNumber = 1
    const { data: lastChapter } = await supabase
      .from('chapters')
      .select('order')
      .eq('project_id', projectId)
      .order('order', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (lastChapter && typeof lastChapter.order === 'number') {
      orderNumber = (lastChapter.order || 0) + 1
    }

    const wordCount = finalText.trim().split(/\s+/).length

    const chapterTitle = title?.trim() || `Generated Chapter (${id})`

    const { data: chapter, error: insertErr } = await supabase
      .from('chapters')
      .insert({
        project_id: projectId,
        title: chapterTitle,
        description: description || null,
        content: finalText,
        order: orderNumber,
        word_count: wordCount,
        status: 'draft',
      })
      .select()
      .single()

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message || 'Failed to save chapter' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: chapter })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save chapter' }, { status: 500 })
  }
}, { requireAuth: true })


