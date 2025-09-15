'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface PageRec { id: string; page_number: number; text: string; illustration_url?: string }

export default function ReadBookPage() {
  const params = useParams() as { bookId?: string }
  const [pages, setPages] = useState<PageRec[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!params?.bookId) return
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Try to load pages using project_id first (for private books)
      let { data, error } = await supabase
        .from('book_pages')
        .select('id, page_number, text, illustration_url')
        .eq('project_id', params.bookId)
        .order('page_number')
      
      // If no pages found with project_id, try book_id for legacy books
      if (!data || data.length === 0) {
        const result = await supabase
          .from('book_pages')
          .select('id, page_number, text, illustration_url')
          .eq('book_id', params.bookId)
          .order('page_number')
        data = result.data
        error = result.error
      }
      
      // If we have pages, verify user access for private books
      if (!error && data && data.length > 0 && user) {
        // Check if this is user's book via project ownership
        const { data: projectData } = await supabase
          .from('projects')
          .select('id, user_id, is_public')
          .eq('id', params.bookId)
          .single()
        
        // If it's a private project and user doesn't own it, don't show pages
        if (projectData && !projectData.is_public && projectData.user_id !== user.id) {
          setPages([])
          setLoading(false)
          return
        }
        
        // Also check legacy books table for public status
        const { data: bookData } = await supabase
          .from('books')
          .select('id, user_id, is_public')
          .eq('id', params.bookId)
          .single()
        
        if (bookData && !bookData.is_public && bookData.user_id !== user.id) {
          setPages([])
          setLoading(false)
          return
        }
      }
      
      if (!error && data) setPages(data as any)
      setLoading(false)
    }
    load()
  }, [params?.bookId])

  const renderWithCitations = (text: string) => {
    // Detect lightweight inline cues [G:Name] and [V:Category]
    const parts: Array<{ t: string; cue?: { type: 'G'|'V'; label: string } }> = []
    const regex = /(\[[GV]:[^\]]+\])/g
    let lastIndex = 0
    for (const match of text.matchAll(regex)) {
      const idx = match.index || 0
      if (idx > lastIndex) parts.push({ t: text.slice(lastIndex, idx) })
      const token = match[0]
      const inside = token.slice(1, -1) // G:Name
      const [type, ...rest] = inside.split(':')
      const label = rest.join(':').trim()
      parts.push({ t: token, cue: { type: (type as any), label } })
      lastIndex = idx + token.length
    }
    if (lastIndex < text.length) parts.push({ t: text.slice(lastIndex) })

    return (
      <span>
        {parts.map((p, i) => {
          if (!p.cue) return <React.Fragment key={i}>{p.t}</React.Fragment>
          const color = p.cue.type === 'G' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
          const title = p.cue.type === 'G' ? `Graph node: ${p.cue.label}` : `Vector context: ${p.cue.label}`
          return (
            <span key={i} title={title} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${color}`}>
              <span className="text-[10px] font-bold">[{p.cue.type}]</span>
              <span className="text-xs">{p.cue.label}</span>
            </span>
          )
        })}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-8 w-40 bg-[--muted] rounded mb-3" />
        <div className="space-y-2">
          <div className="h-4 bg-[--muted] rounded" />
          <div className="h-4 bg-[--muted] rounded" />
          <div className="h-4 bg-[--muted] rounded w-2/3" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Book</h1>
      <div className="space-y-6">
        {pages.map((p) => (
          <div key={p.id} className="rounded-lg border border-[--border] bg-[--card] p-6">
            <div className="text-xs text-[--muted-foreground] mb-4">Page {p.page_number}</div>
            
            {/* Page Image */}
            {p.illustration_url && (
              <div className="mb-6">
                <img 
                  src={p.illustration_url} 
                  alt={`Illustration for page ${p.page_number}`}
                  className="w-full max-w-md mx-auto rounded-lg shadow-md"
                  loading="lazy"
                />
              </div>
            )}
            
            {/* Page Text */}
            <div className="prose prose-sm max-w-none text-[--foreground] whitespace-pre-wrap">
              {renderWithCitations(p.text)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


