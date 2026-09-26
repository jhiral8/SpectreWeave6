/**
 * Character Management Components
 * 
 * Comprehensive character lock system components for consistent AI generation
 */

export { CharacterProfileCard, default as CharacterCard } from './CharacterProfileCard'
export { CharacterForm, default as CharacterFormDefault } from './CharacterForm'
export { CharacterManager, default as CharacterManagerDefault } from './CharacterManager'
export { CharacterDetailView, default as CharacterDetailDefault } from './CharacterDetailView'

// Re-export types for convenience
export type { CharacterProfile, CharacterReferenceImage, CharacterGenerationConfig } from '@/lib/ai/characterLock'