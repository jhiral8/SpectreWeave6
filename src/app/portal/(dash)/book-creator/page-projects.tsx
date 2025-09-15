'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, 
  Plus, 
  Search,
  Filter,
  Grid,
  List,
  Clock,
  Users,
  Star,
  Play
} from 'lucide-react'
import type { ChildrensBookProject } from '@/types/childrens-books'

export default function BookCreatorPage() {
  const [user, setUser] = useState<User | null>(null)
  const [books, setBooks] = useState<ChildrensBookProject[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Get children's book projects
        const { data: projectsData, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .eq('project_type', 'childrens-book')
          .order('updated_at', { ascending: false })
        
        if (error) {
          console.error('Error loading books:', error)
        } else {
          setBooks(projectsData || [])
        }
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [])

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatReadingTime = (pages: number) => {
    const minutes = Math.ceil(pages * 0.5) // Estimate 30 seconds per page
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
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-[--foreground]">
              Children's Book Creator
            </h1>
            <p className="text-[--muted-foreground] mt-1">
              Create magical stories with AI-generated illustrations
            </p>
          </div>
          <div className="flex gap-2">
            <Link 
              href="/portal/gallery"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-[--card] border border-[--border] hover:bg-[--muted]/30 transition-colors"
            >
              <Grid className="w-4 h-4" />
              Browse Gallery
            </Link>
            <Link 
              href="/portal/projects"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Create New Book
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[--muted-foreground] w-4 h-4" />
            <input
              type="text"
              placeholder="Search your books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-[--border] bg-[--input] text-[--foreground] placeholder-[--muted-foreground] focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md border ${viewMode === 'grid' 
                ? 'border-[--primary] bg-[--primary]/10 text-[--primary]' 
                : 'border-[--border] hover:bg-[--muted]/30'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md border ${viewMode === 'list' 
                ? 'border-[--primary] bg-[--primary]/10 text-[--primary]' 
                : 'border-[--border] hover:bg-[--muted]/30'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Books Grid/List */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-[--muted-foreground] opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No children's books yet</h3>
            <p className="text-[--muted-foreground] mb-6">
              Create your first magical story with AI-generated illustrations
            </p>
            <Link 
              href="/portal/projects"
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-gradient-to-r from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Create Your First Book
            </Link>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-4"
          }>
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
    </div>
  )
}

function BookCard({ book }: { book: ChildrensBookProject }) {
  const getCoverGradient = (theme: string) => {
    const gradients = {
      'magical-forest': 'from-green-400 via-emerald-500 to-teal-600',
      'underwater-adventure': 'from-blue-400 via-cyan-500 to-teal-600',
      'space-exploration': 'from-purple-400 via-violet-500 to-indigo-600',
      'fairy-tale-castle': 'from-pink-400 via-rose-500 to-red-500',
      'animal-kingdom': 'from-amber-400 via-orange-500 to-red-500',
      'modern-city': 'from-gray-400 via-slate-500 to-gray-600',
      'pirate-adventure': 'from-amber-600 via-brown-500 to-amber-800',
      'superhero': 'from-red-400 via-pink-500 to-purple-600',
      'prehistoric': 'from-green-600 via-lime-500 to-yellow-500',
      'winter-wonderland': 'from-blue-200 via-cyan-300 to-blue-400'
    }
    return gradients[theme as keyof typeof gradients] || 'from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf]'
  }

  return (
    <div className="group rounded-xl border border-[--border] bg-[--card] overflow-hidden hover:shadow-lg transition-all duration-200">
      {/* Cover Image */}
      <div className={`h-32 bg-gradient-to-br ${getCoverGradient(book.book_theme)} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-white/90" />
        </div>
        <div className="absolute top-3 right-3 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1">
          <span className="text-xs text-white font-medium">{book.target_age}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-[--foreground] mb-2 line-clamp-2 group-hover:text-[--primary] transition-colors">
          {book.title}
        </h3>
        
        {book.description && (
          <p className="text-sm text-[--muted-foreground] mb-3 line-clamp-2">
            {book.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-[--muted-foreground] mb-3">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>{book.total_pages || 0} pages</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{book.total_pages ? Math.ceil(book.total_pages * 0.5) : 0} min</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/portal/book-creator/${book.id}`}
            className="flex-1 text-center px-3 py-1.5 text-sm rounded-md bg-[--primary] text-[--primary-foreground] hover:opacity-90 transition-opacity"
          >
            Edit Book
          </Link>
          <Link
            href={`/portal/book-creator/${book.id}/preview`}
            className="px-3 py-1.5 text-sm rounded-md border border-[--border] hover:bg-[--muted]/30 transition-colors"
          >
            <Play className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function BookListItem({ book }: { book: ChildrensBookProject }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-[--border] bg-[--card] hover:shadow-sm transition-all duration-200">
      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] flex items-center justify-center">
        <BookOpen className="w-6 h-6 text-white" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[--foreground] mb-1">{book.title}</h3>
        {book.description && (
          <p className="text-sm text-[--muted-foreground] mb-2 line-clamp-1">{book.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-[--muted-foreground]">
          <span className="bg-[--muted] px-2 py-1 rounded-full">{book.target_age}</span>
          <span>{book.total_pages || 0} pages</span>
          <span>{book.total_pages ? Math.ceil(book.total_pages * 0.5) : 0} min read</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/portal/book-creator/${book.id}`}
          className="px-4 py-2 text-sm rounded-md bg-[--primary] text-[--primary-foreground] hover:opacity-90 transition-opacity"
        >
          Edit
        </Link>
        <Link
          href={`/portal/book-creator/${book.id}/preview`}
          className="p-2 rounded-md border border-[--border] hover:bg-[--muted]/30 transition-colors"
        >
          <Play className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}