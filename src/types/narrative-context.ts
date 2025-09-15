/**
 * Enhanced narrative context types for writing-specific AI operations
 */

export interface NarrativeContext {
  documentId: string;
  projectId: string;
  currentContent: string;
  
  // Story Elements
  characters: NarrativeCharacter[];
  plotThreads: PlotThread[];
  worldElements: WorldElement[];
  themes: Theme[];
  
  // Writing Style & Voice
  narrativeVoice: NarrativeVoice;
  writingStyle: WritingStyleProfile;
  genre: string;
  targetAudience: string;
  
  // Document Structure
  chapters: ChapterInfo[];
  currentChapter?: ChapterInfo;
  currentScene?: SceneInfo;
  
  // Temporal Context
  timeline: TimelineEvent[];
  currentTimeframe?: string;
  
  // Metadata
  wordCount: number;
  lastUpdated: Date;
  writingGoals: WritingGoal[];
}

export interface NarrativeCharacter {
  id: string;
  name: string;
  description: string;
  
  // Character Development
  traits: CharacterTrait[];
  motivations: string[];
  conflicts: string[];
  arc: CharacterArc;
  
  // Relationships
  relationships: CharacterRelationship[];
  
  // Voice & Dialogue
  voiceProfile: VoiceProfile;
  speechPatterns: string[];
  vocabulary: VocabularyProfile;
  
  // Consistency Tracking
  appearances: CharacterAppearance[];
  lastMentioned?: number; // position in document
  consistencyNotes: string[];
}

export interface CharacterTrait {
  trait: string;
  strength: 'subtle' | 'moderate' | 'dominant';
  examples: string[];
  consistency: number; // 0-1 score
}

export interface CharacterArc {
  startingState: string;
  currentState: string;
  desiredEndState: string;
  keyMilestones: ArcMilestone[];
  progressScore: number; // 0-1
}

export interface ArcMilestone {
  description: string;
  chapterNumber?: number;
  completed: boolean;
  importance: 'minor' | 'major' | 'climactic';
}

export interface CharacterRelationship {
  characterId: string;
  relationshipType: string;
  dynamics: string[];
  tension: number; // -1 to 1 (negative = conflict, positive = harmony)
  evolution: RelationshipEvolution[];
}

export interface RelationshipEvolution {
  chapterNumber: number;
  changeDescription: string;
  newDynamics: string[];
}

export interface VoiceProfile {
  formalityLevel: 'very-casual' | 'casual' | 'neutral' | 'formal' | 'very-formal';
  emotionalRange: 'limited' | 'moderate' | 'expressive' | 'dramatic';
  vocabularyComplexity: 'simple' | 'moderate' | 'complex' | 'sophisticated';
  sentenceStructure: 'short' | 'varied' | 'complex' | 'elaborate';
  uniqueExpressions: string[];
  avoidedPhrases: string[];
}

export interface VocabularyProfile {
  commonWords: string[];
  favoriteExpressions: string[];
  technicalTerms: string[];
  educationLevel: 'basic' | 'moderate' | 'advanced' | 'expert';
  culturalBackground: string[];
}

export interface CharacterAppearance {
  chapterNumber: number;
  position: number;
  context: string;
  behaviorNotes: string[];
  consistencyIssues?: string[];
}

export interface PlotThread {
  id: string;
  title: string;
  description: string;
  
  // Thread Structure
  type: 'main' | 'subplot' | 'character-arc' | 'mystery' | 'romance' | 'conflict';
  priority: 'primary' | 'secondary' | 'background';
  
  // Progression
  status: 'setup' | 'development' | 'climax' | 'resolution' | 'completed';
  progression: ThreadProgression[];
  
  // Dependencies
  relatedThreads: string[];
  characterInvolvement: CharacterInvolvement[];
  
  // Tracking
  keyEvents: PlotEvent[];
  foreshadowing: ForeshadowingElement[];
  payoffs: PayoffElement[];
}

export interface ThreadProgression {
  chapterNumber: number;
  milestone: string;
  significance: 'minor' | 'moderate' | 'major' | 'climactic';
  impact: string[];
}

export interface CharacterInvolvement {
  characterId: string;
  role: 'protagonist' | 'antagonist' | 'catalyst' | 'witness' | 'victim' | 'helper';
  involvementLevel: 'minor' | 'moderate' | 'major' | 'central';
}

export interface PlotEvent {
  id: string;
  description: string;
  chapterNumber: number;
  consequences: string[];
  characterReactions: CharacterReaction[];
}

export interface CharacterReaction {
  characterId: string;
  reaction: string;
  emotionalImpact: string;
  behaviorChange?: string;
}

export interface ForeshadowingElement {
  hint: string;
  chapterIntroduced: number;
  subtlety: 'obvious' | 'moderate' | 'subtle' | 'hidden';
  payoffChapter?: number;
  fulfilled: boolean;
}

export interface PayoffElement {
  setup: string;
  setupChapter: number;
  payoff: string;
  payoffChapter: number;
  satisfaction: number; // 0-1 score
}

export interface WorldElement {
  id: string;
  name: string;
  type: 'location' | 'culture' | 'technology' | 'magic-system' | 'politics' | 'economics' | 'religion' | 'natural-law';
  
  // Details
  description: string;
  rules: WorldRule[];
  limitations: string[];
  
  // Consistency
  establishedFacts: EstablishedFact[];
  contradictions?: Contradiction[];
  
  // Usage
  relevantScenes: SceneReference[];
  characterConnections: CharacterWorldConnection[];
}

export interface WorldRule {
  rule: string;
  importance: 'fundamental' | 'important' | 'minor';
  exceptions: string[];
  implications: string[];
}

export interface EstablishedFact {
  fact: string;
  chapterEstablished: number;
  certaintyLevel: 'definite' | 'probable' | 'implied' | 'uncertain';
  sources: string[];
}

export interface Contradiction {
  description: string;
  conflictingFacts: string[];
  chapters: number[];
  resolved: boolean;
  resolution?: string;
}

export interface SceneReference {
  chapterNumber: number;
  sceneDescription: string;
  relevance: string;
}

export interface CharacterWorldConnection {
  characterId: string;
  connectionType: 'native' | 'visitor' | 'expert' | 'ignorant' | 'affected';
  knowledge: string[];
  attitudes: string[];
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  
  // Development
  expressions: ThemeExpression[];
  symbols: ThemeSymbol[];
  character_embodiments: CharacterThemeConnection[];
  
  // Tracking
  development: ThemeDevelopment[];
  resolution?: ThemeResolution;
}

export interface ThemeExpression {
  expression: string;
  chapterNumber: number;
  method: 'dialogue' | 'action' | 'description' | 'symbolism' | 'conflict';
  subtlety: 'explicit' | 'moderate' | 'subtle' | 'implied';
}

export interface ThemeSymbol {
  symbol: string;
  meaning: string;
  appearances: SymbolAppearance[];
}

export interface SymbolAppearance {
  chapterNumber: number;
  context: string;
  significance: string;
}

export interface CharacterThemeConnection {
  characterId: string;
  connectionType: 'embodies' | 'opposes' | 'learns' | 'teaches' | 'represents';
  examples: string[];
}

export interface ThemeDevelopment {
  stage: 'introduction' | 'exploration' | 'complication' | 'climax' | 'resolution';
  chapterNumber: number;
  development: string;
}

export interface ThemeResolution {
  resolution: string;
  chapterNumber: number;
  satisfaction: number; // 0-1 score
}

export interface NarrativeVoice {
  perspective: 'first-person' | 'second-person' | 'third-limited' | 'third-omniscient';
  tense: 'past' | 'present' | 'future';
  narrator: NarratorProfile;
}

export interface NarratorProfile {
  reliability: 'reliable' | 'unreliable' | 'limited' | 'omniscient';
  personality: string[];
  biases: string[];
  knowledge_limitations: string[];
  emotional_tone: string;
}

export interface WritingStyleProfile {
  // Prose Style
  sentenceVariety: StyleMetric;
  vocabularyRichness: StyleMetric;
  imageryDensity: StyleMetric;
  
  // Pacing
  sceneTransitions: TransitionStyle;
  tensionBuilding: TensionStyle;
  informationPacing: PacingStyle;
  
  // Technical Elements
  dialogueRatio: number; // 0-1
  descriptionRatio: number; // 0-1
  actionRatio: number; // 0-1
  
  // Consistency Metrics
  consistencyScore: number; // 0-1
  voiceStability: number; // 0-1
}

export interface StyleMetric {
  score: number; // 0-1
  examples: string[];
  improvement_suggestions: string[];
}

export interface TransitionStyle {
  type: 'abrupt' | 'smooth' | 'varied';
  effectiveness: number; // 0-1
  examples: string[];
}

export interface TensionStyle {
  buildupSpeed: 'slow' | 'gradual' | 'rapid' | 'varied';
  peakIntensity: number; // 0-1
  releasePattern: 'sudden' | 'gradual' | 'varied';
}

export interface PacingStyle {
  informationDensity: 'sparse' | 'moderate' | 'dense' | 'overwhelming';
  revelationTiming: 'early' | 'gradual' | 'late' | 'varied';
  mysteryLevel: number; // 0-1
}

export interface ChapterInfo {
  number: number;
  title?: string;
  wordCount: number;
  
  // Content
  mainEvents: string[];
  characterDevelopments: CharacterDevelopment[];
  plotAdvancement: PlotAdvancement[];
  
  // Structure
  scenes: SceneInfo[];
  
  // Metadata
  writingDate: Date;
  revisionCount: number;
  notes: string[];
}

export interface CharacterDevelopment {
  characterId: string;
  development: string;
  significance: 'minor' | 'moderate' | 'major' | 'transformative';
}

export interface PlotAdvancement {
  threadId: string;
  advancement: string;
  impact: 'setup' | 'development' | 'complication' | 'resolution';
}

export interface SceneInfo {
  id: string;
  title?: string;
  purpose: string[];
  
  // Setting
  location?: string;
  timeframe?: string;
  mood: string;
  
  // Content
  characters: string[];
  events: string[];
  dialogue_heavy: boolean;
  action_heavy: boolean;
  
  // Position
  startPosition: number;
  endPosition: number;
  wordCount: number;
}

export interface TimelineEvent {
  id: string;
  description: string;
  timestamp: string; // story time, not real time
  
  // References
  chapterNumber: number;
  charactersInvolved: string[];
  significance: 'background' | 'minor' | 'major' | 'pivotal';
  
  // Relationships
  causedBy?: string[];
  causes?: string[];
}

export interface WritingGoal {
  id: string;
  description: string;
  type: 'word-count' | 'character-development' | 'plot-advancement' | 'theme-exploration' | 'style-improvement';
  
  // Progress
  target: number | string;
  current: number | string;
  deadline?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Tracking
  milestones: GoalMilestone[];
  completed: boolean;
}

export interface GoalMilestone {
  description: string;
  target: number | string;
  completed: boolean;
  completedDate?: Date;
}

// Context Analysis Types
export interface ContextAnalysis {
  narrativeConsistency: ConsistencyAnalysis;
  characterDevelopment: CharacterAnalysis;
  plotProgression: PlotAnalysis;
  thematicDevelopment: ThematicAnalysis;
  styleConsistency: StyleAnalysis;
}

export interface ConsistencyAnalysis {
  overallScore: number; // 0-1
  issues: ConsistencyIssue[];
  strengths: string[];
  recommendations: string[];
}

export interface ConsistencyIssue {
  type: 'character-behavior' | 'world-rules' | 'timeline' | 'voice' | 'facts';
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  affectedElements: string[];
  suggestions: string[];
}

export interface CharacterAnalysis {
  characterArcs: ArcAnalysis[];
  relationshipDynamics: RelationshipAnalysis[];
  voiceConsistency: VoiceConsistencyAnalysis[];
}

export interface ArcAnalysis {
  characterId: string;
  progress: number; // 0-1
  milestoneCompletion: number; // 0-1
  pacing: 'too-slow' | 'appropriate' | 'too-fast';
  recommendations: string[];
}

export interface RelationshipAnalysis {
  relationship: string;
  development: 'static' | 'developing' | 'regressing' | 'complete';
  believability: number; // 0-1
  opportunities: string[];
}

export interface VoiceConsistencyAnalysis {
  characterId: string;
  consistency: number; // 0-1
  deviations: VoiceDeviation[];
  examples: VoiceExample[];
}

export interface VoiceDeviation {
  location: number;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
}

export interface VoiceExample {
  location: number;
  text: string;
  analysis: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface PlotAnalysis {
  threadProgression: ThreadAnalysis[];
  pacing: PacingAnalysis;
  structure: StructureAnalysis;
}

export interface ThreadAnalysis {
  threadId: string;
  momentum: 'stalled' | 'slow' | 'steady' | 'rapid';
  engagement: number; // 0-1
  resolution_readiness: number; // 0-1
  recommendations: string[];
}

export interface PacingAnalysis {
  overallPace: 'too-slow' | 'appropriate' | 'too-fast' | 'uneven';
  tensionCurve: TensionPoint[];
  recommendations: string[];
}

export interface TensionPoint {
  chapterNumber: number;
  tensionLevel: number; // 0-1
  type: 'rising' | 'climax' | 'falling' | 'plateau';
}

export interface StructureAnalysis {
  actStructure: ActAnalysis[];
  cliffhangers: CliffhangerAnalysis[];
  transitions: TransitionAnalysis[];
}

export interface ActAnalysis {
  act: number;
  purpose: string;
  completion: number; // 0-1
  effectiveness: number; // 0-1
}

export interface CliffhangerAnalysis {
  chapterNumber: number;
  effectiveness: number; // 0-1
  type: 'action' | 'revelation' | 'emotional' | 'mystery';
  resolution_quality: number; // 0-1
}

export interface TransitionAnalysis {
  fromChapter: number;
  toChapter: number;
  smoothness: number; // 0-1
  effectiveness: number; // 0-1
  type: 'scene' | 'time' | 'perspective' | 'location';
}

export interface ThematicAnalysis {
  themesDeveloped: ThemeDevelopmentAnalysis[];
  symbolism: SymbolismAnalysis;
  messageCohesion: number; // 0-1
}

export interface ThemeDevelopmentAnalysis {
  themeId: string;
  development: number; // 0-1
  clarity: number; // 0-1
  integration: number; // 0-1
  opportunities: string[];
}

export interface SymbolismAnalysis {
  symbols: SymbolAnalysis[];
  effectiveness: number; // 0-1
  subtlety: number; // 0-1
}

export interface SymbolAnalysis {
  symbol: string;
  frequency: number;
  consistency: number; // 0-1
  impact: number; // 0-1
}

export interface StyleAnalysis {
  voiceConsistency: number; // 0-1
  proseQuality: ProseQualityAnalysis;
  readability: ReadabilityAnalysis;
  uniqueness: UniquenessAnalysis;
}

export interface ProseQualityAnalysis {
  sentenceVariety: number; // 0-1
  vocabularyRichness: number; // 0-1
  clarityScore: number; // 0-1
  eleganceScore: number; // 0-1
  improvementAreas: string[];
}

export interface ReadabilityAnalysis {
  gradeLevel: number;
  sentenceComplexity: number; // 0-1
  vocabularyDifficulty: number; // 0-1
  recommendations: string[];
}

export interface UniquenessAnalysis {
  voiceDistinctiveness: number; // 0-1
  originalityScore: number; // 0-1
  clicheFrequency: number;
  uniqueElements: string[];
}