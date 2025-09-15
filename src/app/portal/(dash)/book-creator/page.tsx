'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { 
  Plus, 
  Search, 
  BookOpen, 
  Grid, 
  List,
  Clock,
  Baby,
  Palette,
  Wand2
} from 'lucide-react'

// Simplified book type that works with existing books table
interface Book {
  id: string
  title: string
  author: string
  target_age: string
  theme: string
  style: string
  author_style: string
  total_pages: number
  is_public: boolean
  created_at: string
  user_id: string
}

export default function BookCreatorStandalonePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newBookTitle, setNewBookTitle] = useState('')

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Get both standalone books and children's book projects
        try {
          // Get standalone books from books table
          const { data: booksData, error: booksError } = await supabase
            .from('books')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          
          // Get children's book projects from projects table
          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select(`
              id,
              title,
              description,
              user_id,
              project_type,
              author_style,
              book_theme,
              illustration_style,
              target_age,
              total_pages,
              book_metadata,
              created_at,
              updated_at
            `)
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
          
          const allBooks: Book[] = []
          
          // Add standalone books
          if (!booksError && booksData) {
            allBooks.push(...booksData)
          }
          
          // Add project-based books (convert to Book format) - filter for children's books
          if (!projectsError && projectsData) {
            const childrenBookProjects = projectsData.filter(p => p.project_type === 'childrens-book')
            const projectBooks = childrenBookProjects.map(project => ({
              id: project.id,
              title: project.title,
              author: user.email?.split('@')[0] || 'Anonymous',
              target_age: project.target_age || '3-5',
              theme: project.book_theme || 'magical-forest',
              style: project.illustration_style || 'watercolor',
              author_style: project.author_style || 'dr-seuss',
              total_pages: project.total_pages || 6,
              is_public: false,
              created_at: project.created_at,
              user_id: project.user_id
            }))
            allBooks.push(...projectBooks)
          }
          
          // Deduplicate by id to avoid duplicate keys in React lists
          const uniqueMap = new Map<string, Book>()
          for (const b of allBooks) {
            if (!uniqueMap.has(b.id)) uniqueMap.set(b.id, b)
          }
          const uniqueBooks = Array.from(uniqueMap.values())
          // Sort by creation date
          uniqueBooks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          setBooks(uniqueBooks)
          
          if (booksError) {
            console.error('Error loading books:', booksError)
          }
          if (projectsError) {
            console.error('Error loading projects:', projectsError)
          }
        } catch (error) {
          console.error('Error loading data:', error)
        }
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [])

  const createBook = async () => {
    if (!user || !newBookTitle.trim()) return
    
    setCreating(true)
    const supabase = createClient()
    
    try {
      let projectId = null
      let projectCreationMessage = ''
      
      // Try to create a project entry for unified management (graceful fallback)
      try {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .insert({
            title: newBookTitle,
            description: 'AI-generated children\'s book with illustrations',
            project_type: 'childrens-book',
            user_id: user.id,
            target_age: '3-5',
            book_theme: 'magical-forest',
            illustration_style: 'watercolor',
            author_style: 'dr-seuss',
            total_pages: 6,
            book_metadata: {
              created_via: 'book-creator',
              ai_generated: true
            }
          })
          .select()
          .single()
        
        if (projectError) {
          // Check if it's a column-not-found error (migration not run yet)
          if (projectError.message?.includes('column') && projectError.message?.includes('does not exist')) {
            projectCreationMessage = 'Project linking unavailable (database migration needed)'
            
            // Fall back to basic project creation without children's book columns
            const { data: basicProjectData, error: basicProjectError } = await supabase
              .from('projects')
              .insert({
                title: newBookTitle,
                description: 'AI-generated children\'s book',
                user_id: user.id
              })
              .select()
              .single()
            
            if (!basicProjectError && basicProjectData) {
              projectId = basicProjectData.id
              projectCreationMessage = 'Created basic project link (full integration pending migration)'
            }
          } else {
            throw projectError
          }
        } else if (projectData) {
          projectId = projectData.id
          projectCreationMessage = 'Created with full project integration'
        }
      } catch (err: any) {
        // If project creation fails completely, continue with standalone book
        console.log('Could not create project link:', err.message)
        projectCreationMessage = 'Created as standalone book'
      }

      // Create the book in the books table (this should always work)
      // Note: books table doesn't have project_id column, so we can't link them directly
      const newBook = {
        title: newBookTitle,
        author: user.email?.split('@')[0] || 'Anonymous',
        target_age: '3-5',
        theme: 'magical-forest',
        style: 'watercolor',
        author_style: 'dr-seuss',
        total_pages: 6,
        is_public: false,
        user_id: user.id
        // Removed project_id field as books table doesn't have this column
      }

      const { data, error } = await supabase
        .from('books')
        .insert(newBook)
        .select()
        .single()

      if (error) {
        console.error('Book creation failed:', error)
        // If we have a project but book creation failed, clean up the orphaned project
        if (projectId) {
          try {
            await supabase.from('projects').delete().eq('id', projectId)
            console.log('Cleaned up orphaned project:', projectId)
          } catch (cleanupError) {
            console.error('Failed to clean up orphaned project:', cleanupError)
          }
        }
        throw error
      }

      if (!data) {
        throw new Error('Book creation succeeded but no data returned')
      }

      console.log('Book created successfully:', projectCreationMessage)
      
      // Navigate to book configuration - use project ID if available, otherwise book ID
      const navigationId = projectId || data.id;
      router.push(`/portal/book-creator/${navigationId}`);
    } catch (error: any) {
      console.error('Error creating book:', error)
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to create book'
      if (error.message?.includes('duplicate key')) {
        errorMessage = 'A book with this title already exists'
      } else if (error.message?.includes('foreign key')) {
        errorMessage = 'Database relationship error - please contact support'
      } else if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        errorMessage = 'Database schema issue detected. The book was created but may have missing features. Please contact support.'
      } else if (error.message?.includes('project_id')) {
        errorMessage = 'Project linking failed, but book was created successfully. You can still proceed with your book.'
      } else if (error.message) {
        errorMessage = `Failed to create book: ${error.message}`
      }
      
      alert(errorMessage)
    } finally {
      setCreating(false)
      setShowCreateDialog(false)
      setNewBookTitle('')
    }
  }

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatReadingTime = (pages: number) => {
    const minutes = Math.ceil(pages * 0.5)
    return `${minutes} min read`
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-[--muted] rounded w-1/3 mb-4" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-[--muted] rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-[--foreground]">Children's Books</h1>
            <p className="text-[--muted-foreground]">Create magical stories with AI</p>
          </div>
          
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Create Book
          </button>
        </div>

        {/* Search and View Toggle */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[--muted-foreground] w-4 h-4" />
            <input
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-[--border] bg-[--input] text-[--foreground] placeholder-[--muted-foreground] focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-1 border border-[--border] rounded-md p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-sm ${viewMode === 'grid' ? 'bg-[--primary] text-[--primary-foreground]' : 'hover:bg-[--muted]/30'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-sm ${viewMode === 'list' ? 'bg-[--primary] text-[--primary-foreground]' : 'hover:bg-[--muted]/30'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Books Grid/List */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-[--muted-foreground] opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No books yet</h3>
            <p className="text-[--muted-foreground] mb-6">Create your first children's book to get started</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[--primary] text-[--primary-foreground] hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Create Your First Book
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
            {filteredBooks.map((book) => (
              viewMode === 'grid' ? (
                <BookCard key={book.id} book={book} />
              ) : (
                <BookListItem key={book.id} book={book} />
              )
            ))}
          </div>
        )}
      </div>

      {/* Create Book Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[--background] border border-[--border] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Book</h3>
            <input
              type="text"
              placeholder="Enter book title..."
              value={newBookTitle}
              onChange={(e) => setNewBookTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-[--border] bg-[--input] mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreateDialog(false)
                  setNewBookTitle('')
                }}
                className="px-4 py-2 rounded-md border border-[--border] hover:bg-[--muted]/30"
              >
                Cancel
              </button>
              <button
                onClick={createBook}
                disabled={creating || !newBookTitle.trim()}
                className="px-4 py-2 rounded-md bg-[--primary] text-[--primary-foreground] hover:opacity-90 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Book Card Component
function BookCard({ book }: { book: Book }) {
  const getCoverGradient = (theme: string) => {
    const gradients: Record<string, string> = {
      'magical-forest': 'from-green-400 via-emerald-500 to-teal-600',
      'underwater-adventure': 'from-blue-400 via-cyan-500 to-teal-600',
      'space-exploration': 'from-purple-400 via-violet-500 to-indigo-600',
      'fairy-tale-castle': 'from-pink-400 via-rose-500 to-red-500',
      'animal-kingdom': 'from-amber-400 via-orange-500 to-red-500'
    }
    return gradients[theme] || 'from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf]'
  }

  return (
    <Link href={`/portal/book-creator/${book.id}`}>
      <div className="group rounded-xl border border-[--border] bg-[--card] overflow-hidden hover:shadow-xl transition-all duration-200 cursor-pointer">
        <div className={`h-32 bg-gradient-to-br ${getCoverGradient(book.theme)} relative`}>
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-white/80" />
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-[--foreground] mb-2 line-clamp-1">{book.title}</h3>
          <div className="flex items-center gap-2 text-sm text-[--muted-foreground] mb-3">
            <Baby className="w-3 h-3" />
            <span>{book.target_age} years</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[--muted-foreground]">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{Math.ceil(book.total_pages * 0.5)} min</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>{book.total_pages} pages</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Book List Item Component
function BookListItem({ book }: { book: Book }) {
  return (
    <Link href={`/portal/book-creator/${book.id}`}>
      <div className="flex items-center gap-4 p-4 rounded-lg border border-[--border] bg-[--card] hover:shadow-sm transition-all duration-200">
        <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[--foreground] mb-1">{book.title}</h3>
          <div className="flex items-center gap-4 text-sm text-[--muted-foreground]">
            <span>{book.target_age} years</span>
            <span>{book.total_pages} pages</span>
            <span>{Math.ceil(book.total_pages * 0.5)} min read</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[--muted-foreground]" />
          <Wand2 className="w-4 h-4 text-[--muted-foreground]" />
        </div>
      </div>
    </Link>
  )
}