'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import useProjects, { useProjectFilters } from '@/hooks/useProjects'
import * as Dialog from '@radix-ui/react-dialog'
import { useToast } from '@/components/portal/ui/toast'
import { useRouter } from 'next/navigation'
import { ArrowUp, ArrowDown, BookOpen, Baby, Feather, Film, Eye, Edit, FileText } from 'lucide-react'
import type { ProjectType } from '@/types/childrens-books'

// Book status interface
interface BookStatus {
  hasPages: boolean
  hasImages: boolean
  pageCount: number
  pagesWithImages: number
}

export default function PortalProjectsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [bookStatuses, setBookStatuses] = useState<Record<string, BookStatus>>({})
  const router = useRouter()
  const toast = useToast()
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setAuthChecked(true)
      if (!user) router.push('/portal/login?next=' + encodeURIComponent('/portal/projects'))
    }
    load()
  }, [router])

  const { filters, updateFilters, clearSearch, toggleSort } = useProjectFilters({ status: 'all', sortBy: 'updated_at', sortOrder: 'desc' })
  const { projects, isLoading, error, createProject, deleteProject, refreshProjects } = useProjects(user || undefined, filters)

  // Load book statuses for children's books
  useEffect(() => {
    const loadBookStatuses = async () => {
      if (!projects || !user) return
      
      const childrenBooks = projects.filter(p => p.project_type === 'childrens-book')
      if (childrenBooks.length === 0) return

      const supabase = createClient()
      const statuses: Record<string, BookStatus> = {}

      for (const book of childrenBooks) {
        try {
          // Get current user to ensure we're authenticated
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            continue
          }


          // Try project_id first (new schema), then fallback to book_id (legacy)  
          let { data: pages, error } = await supabase
            .from('book_pages')
            .select('page_number, illustration_url, user_id, project_id, book_id')
            .eq('project_id', book.id)
            .eq('user_id', user.id)


          // If error or no pages found with project_id, try book_id for backward compatibility
          if (error || !pages || pages.length === 0) {
            const result = await supabase
              .from('book_pages')
              .select('page_number, illustration_url, user_id, project_id, book_id')
              .eq('book_id', book.id)
              .eq('user_id', user.id)
            pages = result.data
            error = result.error
          }

          // Debug: Try without user_id filter to see if pages exist at all
          if ((!pages || pages.length === 0) && !error) {
            const { data: anyPages } = await supabase
              .from('book_pages')
              .select('page_number, user_id, project_id, book_id')
              .or(`project_id.eq.${book.id},book_id.eq.${book.id}`)
            
            if (anyPages && anyPages.length > 0) {
            } else {
            }
          }

          if (!error && pages) {
            statuses[book.id] = {
              hasPages: pages.length > 0,
              hasImages: pages.some(p => p.illustration_url),
              pageCount: pages.length,
              pagesWithImages: pages.filter(p => p.illustration_url).length
            }
          } else if (error) {
            // Set default status even if we can't load pages
            statuses[book.id] = {
              hasPages: false,
              hasImages: false,
              pageCount: 0,
              pagesWithImages: 0
            }
          }
        } catch (err) {
          console.error('Error loading book status for', book.id, err)
        }
      }

      setBookStatuses(statuses)
    }

    loadBookStatuses()
  }, [projects, user])

  // Project type options
  const PROJECT_TYPES: Array<{ value: ProjectType | 'research-notes'; label: string; description: string; icon: any }> = [
    { 
      value: 'manuscript', 
      label: 'Novel/Manuscript', 
      description: 'Traditional novel or long-form writing project',
      icon: BookOpen 
    },
    { 
      value: 'childrens-book', 
      label: "Children's Book", 
      description: 'Illustrated children\'s story with AI-generated images',
      icon: Baby 
    },
    { 
      value: 'poetry', 
      label: 'Poetry Collection', 
      description: 'Collection of poems or verse',
      icon: Feather 
    },
    { 
      value: 'research-notes', 
      label: 'Research notes', 
      description: 'Technical notes with sources, citations, and verification',
      icon: FileText 
    },
    { 
      value: 'screenplay', 
      label: 'Screenplay', 
      description: 'Script for film, TV, or stage production',
      icon: Film 
    }
  ]

  // Create Project Sheet
  function CreateProject() {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [projectType, setProjectType] = useState<ProjectType>('manuscript')
    const [creating, setCreating] = useState(false)
    return (
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button className="rounded-md px-3 py-1.5 text-sm text-white bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] hover:opacity-90">
            New Project
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content
            aria-describedby="create-project-desc"
            className="fixed right-0 top-14 h-[calc(100vh-56px)] w-full sm:w-[420px] rounded-l-lg border border-[--border] bg-[--card] p-4 shadow overflow-y-auto"
          >
            <Dialog.Title className="text-lg font-heading">New Project</Dialog.Title>
            <Dialog.Description id="create-project-desc" className="sr-only">
              Create a new project
            </Dialog.Description>
            <form className="mt-3 grid gap-4" onSubmit={(e) => e.preventDefault()}>
              {/* Project Type Selection */}
              <div>
                <label className="text-sm font-medium">Project Type</label>
                <div className="grid gap-2 mt-2">
                  {PROJECT_TYPES.map((type) => {
                    const Icon = type.icon
                    return (
                      <label 
                        key={type.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          projectType === type.value 
                            ? 'border-[--primary] bg-[--primary]/10' 
                            : 'border-[--border] hover:bg-[--muted]/30'
                        }`}
                      >
                        <input 
                          type="radio"
                          name="projectType"
                          value={type.value}
                          checked={projectType === type.value}
                          onChange={(e) => setProjectType(e.target.value as ProjectType)}
                          className="sr-only"
                        />
                        <Icon className="w-5 h-5 mt-0.5 text-[--primary]" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs text-[--muted-foreground] mt-1">{type.description}</div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Title</label>
                <input 
                  className="rounded-md border border-[--border] bg-[--input] px-2 py-1 w-full mt-1" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder={projectType === 'childrens-book' ? 'The Magical Adventure' : 'My New Project'}
                  required 
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description <span className="text-[--muted-foreground]">(optional)</span></label>
                <textarea 
                  className="rounded-md border border-[--border] bg-[--input] px-2 py-1 min-h-20 w-full mt-1" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={projectType === 'childrens-book' ? 'A story about friendship and adventure...' : 'Brief description of your project...'}
                />
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-[--border] px-3 py-1.5 text-sm hover:bg-white/5">Cancel</button>
                <button
                  type="submit"
                  onClick={async () => {
                    try {
                      if (!user) { router.push('/login'); return }
                      setCreating(true)
                    const data = await createProject({ 
                        title, 
                        description,
                      project_type: projectType === 'research-notes' ? 'manuscript' : projectType
                      })
                      toast({ title: 'Project created', description: data.title || title })
                      setOpen(false)
                      setTitle('')
                      setDescription('')
                      setProjectType('manuscript')
                      refreshProjects()
                      
                      // Route based on project type
                      if (projectType === 'childrens-book') {
                        // For children's books, also create a book entry for full compatibility
                        try {
                          const supabase = createClient()
                          const { error: bookError } = await supabase
                            .from('books')
                            .insert({
                              title: data.title,
                              author: user.email?.split('@')[0] || 'Anonymous',
                              target_age: data.target_age || '3-5',
                              theme: data.book_theme || 'magical-forest',
                              style: data.illustration_style || 'watercolor',
                              author_style: data.author_style || 'dr-seuss',
                              total_pages: data.total_pages || 6,
                              is_public: false,
                              user_id: user.id,
                              project_id: data.id // Link back to the project
                            })
                          
                          if (bookError) {
                            console.error('Note: Could not create book entry:', bookError)
                            // Continue anyway - the project exists
                          }
                        } catch (err) {
                          console.error('Note: Could not create book entry:', err)
                          // Continue anyway - the project exists
                        }
                        
                        router.push(`/portal/book-creator/${data.id}`)
                      } else {
                        const mode = projectType === 'research-notes' ? '?mode=research' : ''
                        router.push(`/portal/writer/${data.id}${mode}`)
                      }
                    } catch (err: any) {
                      toast({ title: 'Failed to create project', description: String(err?.message || err) })
                    } finally {
                      setCreating(false)
                    }
                  }}
                  disabled={creating || !title.trim()}
                  className="rounded-md border border-[--border] px-3 py-1.5 text-sm bg-[--brand] text-[--brand-foreground] hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[--foreground]">Projects</h1>
          <p className="text-[--muted-foreground] mt-1">Manage your creative projects</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            placeholder="Search…"
            className="rounded-md border border-[--border] bg-[--input] px-2 py-1 text-sm"
            onChange={(e) => updateFilters({ search: e.target.value || undefined })}
          />
          <select className="rounded-md border border-[--border] bg-[--input] px-2 py-1 text-sm" onChange={(e) => updateFilters({ status: e.target.value as any })}>
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Under Review</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
          <select className="rounded-md border border-[--border] bg-[--input] px-2 py-1 text-sm" onChange={(e) => updateFilters({ sortBy: e.target.value as any })} defaultValue="updated_at">
            <option value="updated_at">Last Modified</option>
            <option value="created_at">Date Created</option>
            <option value="title">Title</option>
            <option value="word_count">Word Count</option>
          </select>
          <button className="rounded-md border border-[--border] px-2 py-1 text-sm hover:bg-white/5 flex items-center gap-1" onClick={() => updateFilters({ sortOrder: filters.sortOrder === 'desc' ? 'asc' : 'desc' })}>
            {filters.sortOrder === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
            {filters.sortOrder === 'desc' ? 'Desc' : 'Asc'}
          </button>
          <CreateProject />
        </div>
      </div>
      {isLoading && <div className="text-sm text-[--muted-foreground]">Loading…</div>}
      {error && <div className="text-sm text-red-500">{String(error)}</div>}
      {!isLoading && !error && (projects || []).length === 0 && (
        <div className="text-sm text-[--muted-foreground] border border-[--border] rounded-md p-6 bg-[--card]">
          No projects found. Use “New Project” to create your first project.
        </div>
      )}
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(projects || []).map((p) => (
          <li key={p.id} className="rounded-lg border border-[--border] bg-[--card] p-4">
            <InlineProjectRename id={p.id} title={p.title || p.name || 'Untitled'} />
            {p.id && <div className="mt-2 text-sm text-[--muted-foreground]">ID: {p.id}</div>}
            {p.updated_at && (
              <div className="text-xs text-[--muted-foreground]">Updated {new Date(p.updated_at).toLocaleString()}</div>
            )}
            <div className="mt-3">
              {p.project_type === 'childrens-book' ? (
                <div className="space-y-3">
                  {/* Book Status */}
                  <div className="text-xs text-[--muted-foreground]">
                    {bookStatuses[p.id] ? (
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bookStatuses[p.id].hasPages ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {bookStatuses[p.id].hasPages ? `${bookStatuses[p.id].pageCount} pages` : 'No content - Check console logs'}
                        </span>
                        {bookStatuses[p.id].hasPages && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bookStatuses[p.id].hasImages ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {bookStatuses[p.id].hasImages ? 
                              `${bookStatuses[p.id].pagesWithImages}/${bookStatuses[p.id].pageCount} illustrated` : 
                              'No images'
                            }
                          </span>
                        )}
                        {!bookStatuses[p.id].hasPages && (
                          <button 
                            onClick={() => {
                              window.open(`/portal/book-creator/${p.id}`, '_blank')
                            }}
                            className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                          >
                            Debug
                          </button>
                        )}
                      </div>
                    ) : (
                      <span>Loading status...</span>
                    )}
                  </div>
                  
                  {/* Book Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Link 
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-[--brand] text-[--brand-foreground] rounded-md hover:opacity-90"
                      href={`/portal/book-creator/${p.id}`}
                    >
                      <Edit className="w-3 h-3" />
                      Edit Book
                    </Link>
                    
                    {bookStatuses[p.id]?.hasPages && (
                      <Link 
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-[--border] rounded-md hover:bg-[--muted]/30"
                        href={`/portal/gallery/${p.id}`}
                      >
                        <Eye className="w-3 h-3" />
                        Read Book
                      </Link>
                    )}
                    
                    <Link 
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-[--border] rounded-md hover:bg-[--muted]/30" 
                      href={`/portal/writer/${p.default_doc_id || p.id}`}
                    >
                      <FileText className="w-3 h-3" />
                      Project Details
                    </Link>
                  </div>
                </div>
              ) : (
                <Link className="underline" href={`/portal/writer/${p.default_doc_id || p.id}`}>Open doc</Link>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                className="rounded-md border border-[--border] px-2 py-1 text-xs hover:bg-white/5"
                onClick={async () => {
                  try {
                    const supabase = createClient()
                    const { data, error } = await supabase.from('projects').insert({
                      ...p,
                      id: undefined,
                      title: `${p.title || 'Untitled'} (Copy)`,
                      created_at: undefined,
                      updated_at: undefined,
                    } as any).select().single()
                    if (error) throw error
                    toast({ title: 'Duplicated', description: data.title })
                    router.refresh()
                  } catch (err: any) {
                    toast({ title: 'Failed to duplicate', description: String(err?.message || err) })
                  }
                }}
              >Duplicate</button>
              <button
                className="rounded-md border border-[--border] px-2 py-1 text-xs hover:bg-white/5"
                onClick={async () => {
                  try {
                    const supabase = createClient()
                    const { error } = await supabase.from('projects').update({ archived: !p.archived }).eq('id', p.id)
                    if (error) throw error
                    toast({ title: p.archived ? 'Unarchived' : 'Archived', description: p.title || 'Project' })
                    router.refresh()
                  } catch (err: any) {
                    toast({ title: 'Failed to update', description: String(err?.message || err) })
                  }
                }}
              >{p.archived ? 'Unarchive' : 'Archive'}</button>
              <button
                className="rounded-md border border-red-500/40 text-red-400 px-2 py-1 text-xs hover:bg-red-500/10"
                onClick={async () => {
                  try {
                    await deleteProject(p.id)
                    toast({ title: 'Deleted', description: p.title || 'Project' })
                  } catch (err: any) {
                    toast({ title: 'Failed to delete', description: String(err?.message || err) })
                  }
                }}
              >Delete</button>
            </div>
          </li>
        ))}
      </ul>
      </div>
    </div>
  )
}

function InlineProjectRename({ id, title }: { id: string; title: string }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(title)
  const toast = useToast()
  const save = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('projects').update({ title: value }).eq('id', id)
      if (error) throw error
      toast({ title: 'Renamed', description: value })
      setEditing(false)
    } catch (e: any) {
      toast({ title: 'Failed to rename', description: String(e?.message || e) })
    }
  }
  if (!editing) return <div className="font-medium" onDoubleClick={() => setEditing(true)}>{title}</div>
  return (
    <div className="flex items-center gap-2">
      <input className="rounded-md border border-[--border] bg-[--input] px-2 py-1 text-sm" value={value} onChange={(e) => setValue(e.target.value)} />
      <button className="rounded-md border border-[--border] px-2 py-1 text-xs hover:bg-white/5" onClick={save}>Save</button>
      <button className="rounded-md border border-[--border] px-2 py-1 text-xs hover:bg-white/5" onClick={() => setEditing(false)}>Cancel</button>
    </div>
  )
}


