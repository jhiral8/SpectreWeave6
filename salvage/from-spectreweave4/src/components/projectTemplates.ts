import React from 'react';
import { 
  Rocket, 
  Search, 
  Heart, 
  Sparkles, 
  BookOpen, 
  Ghost 
} from 'lucide-react';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  genre: string;
  icon: React.ComponentType<any>;
  color: string;
  brief: any;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start with a clean slate and build your story from scratch.',
    genre: 'general',
    icon: BookOpen,
    color: 'from-gray-500 to-gray-600',
    brief: {
      logline: 'A blank canvas for your creative vision'
    }
  },
  {
    id: 'sci-fi-novel',
    name: 'Sci-Fi Novel',
    description: 'Explore futuristic worlds, advanced technology, and space exploration.',
    genre: 'sci-fi',
    icon: Rocket,
    color: 'from-blue-500 to-purple-600',
    brief: {
      logline: 'A starship crew discovers an ancient alien artifact that could change the course of human history'
    }
  },
  {
    id: 'mystery-thriller',
    name: 'Mystery Thriller',
    description: 'Create suspenseful stories with twists, turns, and compelling investigations.',
    genre: 'mystery',
    icon: Search,
    color: 'from-orange-500 to-red-600',
    brief: {
      logline: 'A detective uncovers a conspiracy that goes deeper than anyone imagined'
    }
  },
  {
    id: 'romance',
    name: 'Romance Novel',
    description: 'Write heartwarming love stories with emotional depth and compelling characters.',
    genre: 'romance',
    icon: Heart,
    color: 'from-pink-500 to-rose-600',
    brief: {
      logline: 'Two people from different worlds find love in the most unexpected place'
    }
  },
  {
    id: 'fantasy-epic',
    name: 'Fantasy Epic',
    description: 'Build magical worlds with epic quests, mythical creatures, and powerful magic.',
    genre: 'fantasy',
    icon: Sparkles,
    color: 'from-purple-500 to-indigo-600',
    brief: {
      logline: 'A young hero discovers they have the power to save their world from ancient evil'
    }
  },
  {
    id: 'historical-fiction',
    name: 'Historical Fiction',
    description: 'Bring the past to life with rich historical settings and authentic period details.',
    genre: 'historical',
    icon: BookOpen,
    color: 'from-amber-500 to-orange-600',
    brief: {
      logline: 'A woman defies societal expectations to pursue her dreams in a changing world'
    }
  },
  {
    id: 'horror',
    name: 'Horror Novel',
    description: 'Create spine-chilling tales that will keep readers on the edge of their seats.',
    genre: 'horror',
    icon: Ghost,
    color: 'from-gray-700 to-gray-900',
    brief: {
      logline: 'A family moves into a house with a dark secret that threatens to consume them all'
    }
  }
]; 