/**
 * Writing Analysis Extension
 * 
 * Real-time analysis overlay that highlights:
 * - Passive voice
 * - Adverb overuse
 * - Repeated words
 * - Long sentences
 * - Clichés
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface WritingIssue {
  type: 'passive-voice' | 'adverb' | 'repetition' | 'long-sentence' | 'cliche' | 'weak-verb';
  message: string;
  suggestion?: string;
  from: number;
  to: number;
  severity: 'warning' | 'info' | 'suggestion';
}

export interface WritingAnalysisOptions {
  // Enable/disable analysis
  enabled: boolean;
  // Debounce delay for analysis (ms)
  debounceDelay: number;
  // Analysis rules to enable
  rules: {
    passiveVoice: boolean;
    adverbs: boolean;
    repetition: boolean;
    longSentences: boolean;
    cliches: boolean;
    weakVerbs: boolean;
  };
  // Thresholds
  longSentenceWords: number;
  repetitionDistance: number;
  // Callback when issues change
  onIssuesChange?: (issues: WritingIssue[]) => void;
}

export const writingAnalysisPluginKey = new PluginKey('writingAnalysis');

// Common patterns
const PASSIVE_PATTERNS = [
  /\b(was|were|is|are|been|being|be)\s+(\w+ed|written|done|made|seen|known)\b/gi,
];

const ADVERB_PATTERNS = [
  /\b\w+ly\b/gi,
];

const WEAK_VERBS = [
  'was', 'were', 'is', 'are', 'been', 'be', 'being',
  'had', 'has', 'have', 'having',
  'got', 'get', 'getting',
  'went', 'go', 'going',
  'said', 'say', 'saying',
  'made', 'make', 'making',
];

const CLICHES = [
  'at the end of the day',
  'all of a sudden',
  'in the nick of time',
  'crystal clear',
  'dead as a doornail',
  'cold as ice',
  'light as a feather',
  'quiet as a mouse',
  'time will tell',
  'easier said than done',
  'better late than never',
  'the calm before the storm',
  'a dark and stormy night',
];

// Adverbs that are usually unnecessary
const UNNECESSARY_ADVERBS = [
  'very', 'really', 'actually', 'basically', 'literally',
  'simply', 'totally', 'completely', 'absolutely', 'definitely',
  'certainly', 'obviously', 'clearly', 'just', 'quite',
];

export const WritingAnalysis = Extension.create<WritingAnalysisOptions>({
  name: 'writingAnalysis',

  addOptions() {
    return {
      enabled: true,
      debounceDelay: 500,
      rules: {
        passiveVoice: true,
        adverbs: true,
        repetition: true,
        longSentences: true,
        cliches: true,
        weakVerbs: false, // Off by default - can be noisy
      },
      longSentenceWords: 30,
      repetitionDistance: 50,
      onIssuesChange: undefined,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    let debounceTimer: NodeJS.Timeout | null = null;

    return [
      new Plugin({
        key: writingAnalysisPluginKey,
        
        state: {
          init() {
            return {
              issues: [] as WritingIssue[],
              decorations: DecorationSet.empty,
            };
          },
          
          apply(tr, pluginState, oldState, newState) {
            // Check for analysis update via meta
            const meta = tr.getMeta(writingAnalysisPluginKey);
            if (meta?.issues) {
              const decorations = createDecorations(newState.doc, meta.issues);
              options.onIssuesChange?.(meta.issues);
              return {
                issues: meta.issues,
                decorations,
              };
            }
            
            // Map decorations through document changes
            if (tr.docChanged) {
              return {
                ...pluginState,
                decorations: pluginState.decorations.map(tr.mapping, tr.doc),
              };
            }
            
            return pluginState;
          },
        },
        
        props: {
          decorations(state) {
            return this.getState(state)?.decorations || DecorationSet.empty;
          },
        },
        
        view(view) {
          const runAnalysis = () => {
            if (!options.enabled) return;
            
            const doc = view.state.doc;
            const text = doc.textContent;
            const issues: WritingIssue[] = [];
            
            // Analyze the text
            analyzeText(text, doc, issues, options);
            
            // Update state
            view.dispatch(
              view.state.tr.setMeta(writingAnalysisPluginKey, { issues })
            );
          };
          
          return {
            update(view, prevState) {
              if (view.state.doc.eq(prevState.doc)) return;
              
              // Debounce analysis
              if (debounceTimer) {
                clearTimeout(debounceTimer);
              }
              debounceTimer = setTimeout(runAnalysis, options.debounceDelay);
            },
            destroy() {
              if (debounceTimer) {
                clearTimeout(debounceTimer);
              }
            },
          };
        },
      }),
    ];
  },

  addCommands() {
    return {
      toggleWritingAnalysis: () => ({ editor }: { editor: any }) => {
        this.options.enabled = !this.options.enabled;
        // Re-run analysis or clear
        const doc = editor.state.doc;
        const issues: WritingIssue[] = [];
        if (this.options.enabled) {
          analyzeText(doc.textContent, doc, issues, this.options);
        }
        editor.view.dispatch(
          editor.state.tr.setMeta(writingAnalysisPluginKey, { issues })
        );
        return true;
      },
    };
  },
});

// Analyze text and populate issues
function analyzeText(
  text: string, 
  doc: any, 
  issues: WritingIssue[],
  options: WritingAnalysisOptions
) {
  const { rules, longSentenceWords, repetitionDistance } = options;
  
  // Track word positions for repetition check
  const wordPositions = new Map<string, number[]>();
  
  // Split into sentences for analysis
  const sentences = text.split(/[.!?]+\s*/);
  let offset = 0;
  
  for (const sentence of sentences) {
    if (!sentence.trim()) {
      offset += 1;
      continue;
    }
    
    // Long sentence check
    if (rules.longSentences) {
      const words = sentence.split(/\s+/).filter(w => w.length > 0);
      if (words.length > longSentenceWords) {
        issues.push({
          type: 'long-sentence',
          message: `Long sentence (${words.length} words)`,
          suggestion: 'Consider breaking into shorter sentences',
          from: offset,
          to: offset + sentence.length,
          severity: 'info',
        });
      }
    }
    
    // Passive voice check
    if (rules.passiveVoice) {
      for (const pattern of PASSIVE_PATTERNS) {
        let match;
        const regex = new RegExp(pattern.source, 'gi');
        while ((match = regex.exec(sentence)) !== null) {
          issues.push({
            type: 'passive-voice',
            message: 'Passive voice detected',
            suggestion: 'Consider using active voice',
            from: offset + match.index,
            to: offset + match.index + match[0].length,
            severity: 'warning',
          });
        }
      }
    }
    
    // Adverb check
    if (rules.adverbs) {
      for (const adverb of UNNECESSARY_ADVERBS) {
        const regex = new RegExp(`\\b${adverb}\\b`, 'gi');
        let match;
        while ((match = regex.exec(sentence)) !== null) {
          issues.push({
            type: 'adverb',
            message: `"${match[0]}" may be unnecessary`,
            suggestion: 'Consider removing or using a stronger verb',
            from: offset + match.index,
            to: offset + match.index + match[0].length,
            severity: 'suggestion',
          });
        }
      }
    }
    
    // Cliché check
    if (rules.cliches) {
      for (const cliche of CLICHES) {
        const regex = new RegExp(cliche, 'gi');
        let match;
        while ((match = regex.exec(sentence)) !== null) {
          issues.push({
            type: 'cliche',
            message: 'Cliché detected',
            suggestion: 'Consider using more original phrasing',
            from: offset + match.index,
            to: offset + match.index + match[0].length,
            severity: 'warning',
          });
        }
      }
    }
    
    // Track words for repetition check
    if (rules.repetition) {
      const words = sentence.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        // Skip common words
        if (['that', 'this', 'with', 'from', 'they', 'were', 'have', 'been'].includes(word)) {
          continue;
        }
        
        const positions = wordPositions.get(word) || [];
        const wordIndex = sentence.toLowerCase().indexOf(word);
        const absolutePos = offset + wordIndex;
        
        // Check if word was used recently
        for (const prevPos of positions) {
          if (absolutePos - prevPos < repetitionDistance) {
            issues.push({
              type: 'repetition',
              message: `"${word}" used nearby`,
              suggestion: 'Consider using a synonym',
              from: absolutePos,
              to: absolutePos + word.length,
              severity: 'info',
            });
            break;
          }
        }
        
        positions.push(absolutePos);
        wordPositions.set(word, positions);
      }
    }
    
    offset += sentence.length + 2; // +2 for punctuation and space
  }
}

// Create decorations from issues
function createDecorations(doc: any, issues: WritingIssue[]): DecorationSet {
  const decorations = issues.map(issue => {
    const className = `writing-issue writing-issue-${issue.type} writing-issue-${issue.severity}`;
    
    return Decoration.inline(issue.from, issue.to, {
      class: className,
      'data-issue-type': issue.type,
      'data-issue-message': issue.message,
      style: getIssueStyle(issue.severity),
    });
  });
  
  return DecorationSet.create(doc, decorations);
}

function getIssueStyle(severity: string): string {
  switch (severity) {
    case 'warning':
      return 'text-decoration: underline wavy var(--ide-warning, #f0ad4e); text-decoration-skip-ink: none;';
    case 'info':
      return 'text-decoration: underline dotted var(--ide-info, #5bc0de); text-decoration-skip-ink: none;';
    case 'suggestion':
      return 'background-color: var(--ide-ai-accent, #7c3aed)10; border-radius: 2px;';
    default:
      return '';
  }
}

// Type augmentation
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    writingAnalysis: {
      toggleWritingAnalysis: () => ReturnType;
    };
  }
}
