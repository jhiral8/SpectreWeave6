'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Search, 
  Filter, 
  Grid, 
  List,
  BookOpen,
  Play,
  Heart,
  Share2,
  Download,
  Clock,
  User,
  Star
} from 'lucide-react'

// Enhanced data structure with cover image support
interface PublicBook {
  id: string
  title: string
  author: string
  target_age: string
  theme: string
  style: string
  author_style: string
  total_pages: number
  is_public: boolean
  cover_image_url?: string
  created_at: string
}

interface BookPage {
  id: string
  book_id: string
  page_number: number
  text: string
  image_url: string
}

export default function GalleryPage() {
  const [books, setBooks] = useState<PublicBook[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [ageFilter, setAgeFilter] = useState<string>('')
  const [themeFilter, setThemeFilter] = useState<string>('')

  useEffect(() => {
    const loadPublicBooks = async () => {
      const supabase = createClient()
      
      // Load public books from the books table (SpectreWeave3 data)
      const { data: booksData, error } = await supabase
        .from('books')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) {
        console.error('Error loading public books:', error)
        setBooks([])
      } else if (booksData) {
        // Enhance books with cover images from first page
        const booksWithCovers = await Promise.all(
          booksData.map(async (book) => {
            try {
              // Get the first page image for this book
              const { data: firstPage } = await supabase
                .from('book_pages')
                .select('image_url')
                .eq('book_id', book.id)
                .eq('page_number', 1)
                .single()
              
              return {
                ...book,
                cover_image_url: firstPage?.image_url || undefined
              }
            } catch (pageError) {
              // If no first page found, return book without cover
              return book
            }
          })
        )
        
        setBooks(booksWithCovers)
      }
      
      setLoading(false)
    }
    
    loadPublicBooks()
  }, [])

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAge = !ageFilter || book.target_age === ageFilter
    const matchesTheme = !themeFilter || book.theme === themeFilter
    
    return matchesSearch && matchesAge && matchesTheme
  })

  const themes = ['magical-forest', 'underwater-adventure', 'space-exploration', 'fairy-tale-castle', 'animal-kingdom']
  const ageGroups = ['0-2', '3-5', '6-8', '9-12', 'teen']

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-[--muted] rounded w-1/3 mb-4" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-80 bg-[--muted] rounded-xl" />
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
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-heading font-bold text-[--foreground]">
            Children's Book Gallery
          </h1>
          <p className="text-[--muted-foreground] max-w-2xl mx-auto">
            Discover magical stories created by our community. Browse through a collection of 
            AI-generated children's books with beautiful illustrations and engaging narratives.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[--muted-foreground] w-4 h-4" />
            <input
              type="text"
              placeholder="Search books and authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-[--border] bg-[--input] text-[--foreground] placeholder-[--muted-foreground] focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-[--border] bg-[--input] text-sm"
            >
              <option value="">All Ages</option>
              {ageGroups.map(age => (
                <option key={age} value={age}>{age} years</option>
              ))}
            </select>
            
            <select
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-[--border] bg-[--input] text-sm"
            >
              <option value="">All Themes</option>
              {themes.map(theme => (
                <option key={theme} value={theme}>
                  {theme.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>

            <div className="flex gap-1 border border-[--border] rounded-md p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-sm ${viewMode === 'grid' 
                  ? 'bg-[--primary] text-[--primary-foreground]' 
                  : 'hover:bg-[--muted]/30'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-sm ${viewMode === 'list' 
                  ? 'bg-[--primary] text-[--primary-foreground]' 
                  : 'hover:bg-[--muted]/30'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-6 text-sm text-[--muted-foreground]">
          <span>{filteredBooks.length} books found</span>
          <span>•</span>
          <span>{new Set(filteredBooks.map(b => b.author)).size} authors</span>
          <span>•</span>
          <span>{new Set(filteredBooks.map(b => b.theme)).size} themes</span>
        </div>

        {/* Books Gallery */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-[--muted-foreground] opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No books found</h3>
            <p className="text-[--muted-foreground] mb-6">
              Try adjusting your search criteria or browse all available books
            </p>
            <button 
              onClick={() => {
                setSearchQuery('')
                setAgeFilter('')
                setThemeFilter('')
              }}
              className="px-4 py-2 bg-[--primary] text-[--primary-foreground] rounded-md hover:opacity-90"
            >
              Show All Books
            </button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-4"
          }>
            {filteredBooks.map((book) => (
              viewMode === 'grid' ? (
                <PublicBookCard key={book.id} book={book} />
              ) : (
                <PublicBookListItem key={book.id} book={book} />
              )
            ))}
          </div>
        )}

        {/* Load More */}
        {filteredBooks.length >= 50 && (
          <div className="text-center">
            <button className="px-6 py-3 bg-[--card] border border-[--border] rounded-md hover:bg-[--muted]/30 transition-colors">
              Load More Books
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function PublicBookCard({ book }: { book: PublicBook }) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="group rounded-xl border border-[--border] bg-[--card] overflow-hidden hover:shadow-lg transition-all duration-200">
      {/* Cover Image */}
      <div className={`h-40 relative overflow-hidden ${!book.cover_image_url ? `bg-gradient-to-br ${getCoverGradient(book.theme)}` : 'bg-gray-100'}`}>
        {book.cover_image_url ? (
          <>
            <img 
              src={book.cover_image_url} 
              alt={`Cover of ${book.title}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback to gradient background if image fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white/90" />
            </div>
          </>
        )}
        
        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-2 bg-black/20 backdrop-blur-sm rounded-full hover:bg-black/30 transition-colors">
            <Heart className="w-4 h-4 text-white" />
          </button>
          <button className="p-2 bg-black/20 backdrop-blur-sm rounded-full hover:bg-black/30 transition-colors">
            <Share2 className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Age badge */}
        <div className="absolute top-3 left-3 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1">
          <span className="text-xs text-white font-medium">{book.target_age}</span>
        </div>

        {/* Rating */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/20 backdrop-blur-sm rounded-full px-2 py-1">
          <Star className="w-3 h-3 text-yellow-400 fill-current" />
          <span className="text-xs text-white">4.5</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-[--foreground] mb-1 line-clamp-2 group-hover:text-[--primary] transition-colors">
          {book.title}
        </h3>
        
        <div className="flex items-center gap-2 text-sm text-[--muted-foreground] mb-3">
          <User className="w-3 h-3" />
          <span>{book.author}</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-[--muted-foreground] mb-4">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>{book.total_pages} pages</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{Math.ceil(book.total_pages * 0.5)} min</span>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-4">
          <span className="text-xs px-2 py-1 bg-[--muted] rounded-full">
            {book.theme.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </span>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/portal/(dash)/gallery/${book.id}`}
            className="flex-1 text-center px-3 py-1.5 text-sm rounded-md bg-[--primary] text-[--primary-foreground] hover:opacity-90 transition-opacity"
          >
            Read Book
          </Link>
          <button className="px-3 py-1.5 text-sm rounded-md border border-[--border] hover:bg-[--muted]/30 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function PublicBookListItem({ book }: { book: PublicBook }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-[--border] bg-[--card] hover:shadow-sm transition-all duration-200">
      <div className="w-16 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-[#8ec5ff] via-[#b39fff] to-[#ff9ecf] flex items-center justify-center">
        {book.cover_image_url ? (
          <img 
            src={book.cover_image_url} 
            alt={`Cover of ${book.title}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to icon if image fails to load
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        ) : (
          <BookOpen className="w-6 h-6 text-white" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[--foreground] mb-1">{book.title}</h3>
        <div className="flex items-center gap-2 text-sm text-[--muted-foreground] mb-2">
          <User className="w-3 h-3" />
          <span>{book.author}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-[--muted-foreground]">
          <span className="bg-[--muted] px-2 py-1 rounded-full">{book.target_age}</span>
          <span>{book.total_pages} pages</span>
          <span>{Math.ceil(book.total_pages * 0.5)} min read</span>
          <span className="bg-[--muted] px-2 py-1 rounded-full">
            {book.theme.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span>4.5</span>
        </div>
        <Link
          href={`/portal/(dash)/gallery/${book.id}`}
          className="px-4 py-2 text-sm rounded-md bg-[--primary] text-[--primary-foreground] hover:opacity-90 transition-opacity"
        >
          Read
        </Link>
        <button className="p-2 rounded-md border border-[--border] hover:bg-[--muted]/30 transition-colors">
          <Heart className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}