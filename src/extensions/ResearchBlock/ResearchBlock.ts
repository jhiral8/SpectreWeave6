import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ResearchBlockComponent } from './components/ResearchBlockComponent';

export interface ResearchBlockOptions {
  HTMLAttributes: Record<string, any>;
  enableAI?: boolean;
  enableWebSearch?: boolean;
  enableCitations?: boolean;
  projectId?: string;
}

export interface ResearchFinding {
  id: string;
  title: string;
  content: string;
  source: string;
  url?: string;
  relevance: number;
  timestamp: string;
  verified: boolean;
  tags: string[];
  notes: string;
}

export interface ResearchQuery {
  id: string;
  query: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  results: ResearchFinding[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    researchBlock: {
      /**
       * Insert a research block
       */
      insertResearchBlock: (attributes?: {
        topic?: string;
        description?: string;
        queries?: ResearchQuery[];
        findings?: ResearchFinding[];
        tags?: string[];
        status?: 'draft' | 'in-progress' | 'completed';
        priority?: 'low' | 'medium' | 'high';
        aiSuggestions?: string[];
        lastAIUpdate?: string;
        collapsed?: boolean;
        citationStyle?: 'APA' | 'MLA' | 'Chicago' | 'Harvard';
        exportFormat?: 'markdown' | 'json' | 'csv';
      }) => ReturnType;
      
      /**
       * Add a research query to a research block
       */
      addResearchQuery: (researchId: string, query: string) => ReturnType;
      
      /**
       * Add a research finding to a research block
       */
      addResearchFinding: (researchId: string, finding: Partial<ResearchFinding>) => ReturnType;
      
      /**
       * Generate AI research suggestions
       */
      generateResearchSuggestions: (researchId: string) => ReturnType;
      
      /**
       * Perform web search for research
       */
      performWebSearch: (researchId: string, query: string) => ReturnType;
      
      /**
       * Export research data
       */
      exportResearchData: (researchId: string, format?: 'markdown' | 'json' | 'csv') => ReturnType;
      
      /**
       * Import research data
       */
      importResearchData: (data: any) => ReturnType;
      
      /**
       * Update research status
       */
      updateResearchStatus: (researchId: string, status: 'draft' | 'in-progress' | 'completed') => ReturnType;
    };
  }
}

export const ResearchBlock = Node.create<ResearchBlockOptions>({
  name: 'researchBlock',

  group: 'block',

  content: 'block*',

  defining: true,

  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      enableAI: true,
      enableWebSearch: true,
      enableCitations: true,
      projectId: undefined,
    };
  },

  addAttributes() {
    return {
      researchId: {
        default: () => `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        parseHTML: element => element.getAttribute('data-research-id'),
        renderHTML: attributes => {
          if (!attributes.researchId) {
            return {};
          }
          return {
            'data-research-id': attributes.researchId,
          };
        },
      },
      topic: {
        default: '',
        parseHTML: element => element.getAttribute('data-topic'),
        renderHTML: attributes => {
          if (!attributes.topic) {
            return {};
          }
          return {
            'data-topic': attributes.topic,
          };
        },
      },
      description: {
        default: '',
        parseHTML: element => element.getAttribute('data-description'),
        renderHTML: attributes => {
          if (!attributes.description) {
            return {};
          }
          return {
            'data-description': attributes.description,
          };
        },
      },
      queries: {
        default: [],
        parseHTML: element => {
          const queries = element.getAttribute('data-queries');
          return queries ? JSON.parse(queries) : [];
        },
        renderHTML: attributes => {
          if (!attributes.queries || attributes.queries.length === 0) {
            return {};
          }
          return {
            'data-queries': JSON.stringify(attributes.queries),
          };
        },
      },
      findings: {
        default: [],
        parseHTML: element => {
          const findings = element.getAttribute('data-findings');
          return findings ? JSON.parse(findings) : [];
        },
        renderHTML: attributes => {
          if (!attributes.findings || attributes.findings.length === 0) {
            return {};
          }
          return {
            'data-findings': JSON.stringify(attributes.findings),
          };
        },
      },
      tags: {
        default: [],
        parseHTML: element => {
          const tags = element.getAttribute('data-tags');
          return tags ? JSON.parse(tags) : [];
        },
        renderHTML: attributes => {
          if (!attributes.tags || attributes.tags.length === 0) {
            return {};
          }
          return {
            'data-tags': JSON.stringify(attributes.tags),
          };
        },
      },
      status: {
        default: 'draft',
        parseHTML: element => element.getAttribute('data-status') || 'draft',
        renderHTML: attributes => {
          return {
            'data-status': attributes.status || 'draft',
          };
        },
      },
      priority: {
        default: 'medium',
        parseHTML: element => element.getAttribute('data-priority') || 'medium',
        renderHTML: attributes => {
          return {
            'data-priority': attributes.priority || 'medium',
          };
        },
      },
      collapsed: {
        default: false,
        parseHTML: element => element.getAttribute('data-collapsed') === 'true',
        renderHTML: attributes => {
          return {
            'data-collapsed': attributes.collapsed ? 'true' : 'false',
          };
        },
      },
      timestamp: {
        default: () => new Date().toISOString(),
        parseHTML: element => element.getAttribute('data-timestamp'),
        renderHTML: attributes => {
          if (!attributes.timestamp) {
            return {};
          }
          return {
            'data-timestamp': attributes.timestamp,
          };
        },
      },
      lastUpdated: {
        default: () => new Date().toISOString(),
        parseHTML: element => element.getAttribute('data-last-updated'),
        renderHTML: attributes => {
          if (!attributes.lastUpdated) {
            return {};
          }
          return {
            'data-last-updated': attributes.lastUpdated,
          };
        },
      },
      aiSuggestions: {
        default: [],
        parseHTML: element => {
          const suggestions = element.getAttribute('data-ai-suggestions');
          return suggestions ? JSON.parse(suggestions) : [];
        },
        renderHTML: attributes => {
          if (!attributes.aiSuggestions || attributes.aiSuggestions.length === 0) {
            return {};
          }
          return {
            'data-ai-suggestions': JSON.stringify(attributes.aiSuggestions),
          };
        },
      },
      lastAIUpdate: {
        default: '',
        parseHTML: element => element.getAttribute('data-last-ai-update'),
        renderHTML: attributes => {
          if (!attributes.lastAIUpdate) {
            return {};
          }
          return {
            'data-last-ai-update': attributes.lastAIUpdate,
          };
        },
      },
      citationStyle: {
        default: 'APA',
        parseHTML: element => element.getAttribute('data-citation-style') || 'APA',
        renderHTML: attributes => {
          return {
            'data-citation-style': attributes.citationStyle || 'APA',
          };
        },
      },
      exportFormat: {
        default: 'markdown',
        parseHTML: element => element.getAttribute('data-export-format') || 'markdown',
        renderHTML: attributes => {
          return {
            'data-export-format': attributes.exportFormat || 'markdown',
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-research-block]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-research-block': '',
        class: 'research-block',
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResearchBlockComponent);
  },

  addCommands() {
    return {
      insertResearchBlock:
        (attributes = {}) =>
        ({ commands }) => {
          const researchId = `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          return commands.insertContent({
            type: this.name,
            attrs: {
              researchId,
              topic: '',
              description: '',
              queries: [],
              findings: [],
              tags: [],
              status: 'draft',
              priority: 'medium',
              collapsed: false,
              timestamp: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              aiSuggestions: [],
              lastAIUpdate: '',
              citationStyle: 'APA',
              exportFormat: 'markdown',
              ...attributes,
            },
          });
        },

      addResearchQuery:
        (researchId: string, query: string) =>
        ({ commands, state }) => {
          let found = false;
          state.doc.descendants((node, pos) => {
            if (node.type.name === this.name && node.attrs.researchId === researchId) {
              found = true;
              const newQuery: ResearchQuery = {
                id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                query,
                status: 'pending',
                timestamp: new Date().toISOString(),
                results: [],
              };
              const updatedQueries = [...(node.attrs.queries || []), newQuery];
              commands.updateAttributes(this.name, { 
                queries: updatedQueries,
                lastUpdated: new Date().toISOString(),
              });
              return false; // Stop searching
            }
          });
          return found;
        },

      addResearchFinding:
        (researchId: string, finding: Partial<ResearchFinding>) =>
        ({ commands, state }) => {
          let found = false;
          state.doc.descendants((node, pos) => {
            if (node.type.name === this.name && node.attrs.researchId === researchId) {
              found = true;
              const newFinding: ResearchFinding = {
                id: `finding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: finding.title || 'Untitled Finding',
                content: finding.content || '',
                source: finding.source || 'Unknown Source',
                url: finding.url || '',
                relevance: finding.relevance || 0.5,
                timestamp: new Date().toISOString(),
                verified: finding.verified || false,
                tags: finding.tags || [],
                notes: finding.notes || '',
                ...finding,
              };
              const updatedFindings = [...(node.attrs.findings || []), newFinding];
              commands.updateAttributes(this.name, { 
                findings: updatedFindings,
                lastUpdated: new Date().toISOString(),
              });
              return false; // Stop searching
            }
          });
          return found;
        },

      generateResearchSuggestions:
        (researchId: string) =>
        ({ editor, state }) => {
          let researchNode: any = null;
          state.doc.descendants((node: any) => {
            if (node.type.name === this.name && node.attrs.researchId === researchId) {
              researchNode = node;
              return false; // Stop traversal
            }
          });
          if (!researchNode) return false;

          // Trigger AI suggestion generation
          if (this.options.enableAI) {
            const event = new CustomEvent('research-ai-suggestion-request', {
              detail: {
                researchId: researchNode.attrs.researchId,
                researchData: researchNode.attrs,
                projectId: this.options.projectId,
              },
            });
            window.dispatchEvent(event);
          }
          
          return true;
        },

      performWebSearch:
        (researchId: string, query: string) =>
        ({ editor, state }) => {
          let researchNode: any = null;
          state.doc.descendants((node: any) => {
            if (node.type.name === this.name && node.attrs.researchId === researchId) {
              researchNode = node;
              return false; // Stop traversal
            }
          });
          if (!researchNode) return false;

          // Trigger web search
          if (this.options.enableWebSearch) {
            const event = new CustomEvent('research-web-search-request', {
              detail: {
                researchId: researchNode.attrs.researchId,
                query,
                researchData: researchNode.attrs,
                projectId: this.options.projectId,
              },
            });
            window.dispatchEvent(event);
          }
          
          return true;
        },

      exportResearchData:
        (researchId: string, format: 'markdown' | 'json' | 'csv' = 'markdown') =>
        ({ state }) => {
          let researchNode: any = null;
          state.doc.descendants((node: any) => {
            if (node.type.name === this.name && node.attrs.researchId === researchId) {
              researchNode = node;
              return false; // Stop traversal
            }
          });
          if (!researchNode) return false;

          const data = {
            id: researchNode.attrs.researchId,
            topic: researchNode.attrs.topic,
            description: researchNode.attrs.description,
            queries: researchNode.attrs.queries,
            findings: researchNode.attrs.findings,
            tags: researchNode.attrs.tags,
            status: researchNode.attrs.status,
            priority: researchNode.attrs.priority,
            timestamp: researchNode.attrs.timestamp,
            lastUpdated: researchNode.attrs.lastUpdated,
            citationStyle: researchNode.attrs.citationStyle,
            exportDate: new Date().toISOString(),
          };

          let content: string;
          let filename: string;
          let mimeType: string;

          switch (format) {
            case 'json':
              content = JSON.stringify(data, null, 2);
              filename = `research_${data.topic || 'unnamed'}_${Date.now()}.json`;
              mimeType = 'application/json';
              break;
            case 'csv':
              // Convert findings to CSV format
              const csvHeaders = 'Title,Content,Source,URL,Relevance,Verified,Tags,Notes,Timestamp\n';
              const csvRows = data.findings.map((finding: ResearchFinding) => 
                `"${finding.title}","${finding.content}","${finding.source}","${finding.url || ''}","${finding.relevance}","${finding.verified}","${finding.tags.join(';')}","${finding.notes}","${finding.timestamp}"`
              ).join('\n');
              content = csvHeaders + csvRows;
              filename = `research_${data.topic || 'unnamed'}_${Date.now()}.csv`;
              mimeType = 'text/csv';
              break;
            case 'markdown':
            default:
              content = generateMarkdownReport(data);
              filename = `research_${data.topic || 'unnamed'}_${Date.now()}.md`;
              mimeType = 'text/markdown';
              break;
          }

          // Trigger download
          const blob = new Blob([content], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          return true;
        },

      importResearchData:
        (data: any) =>
        ({ commands }) => {
          if (!data || typeof data !== 'object') return false;

          return commands.insertContent({
            type: this.name,
            attrs: {
              researchId: data.id || `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              topic: data.topic || '',
              description: data.description || '',
              queries: Array.isArray(data.queries) ? data.queries : [],
              findings: Array.isArray(data.findings) ? data.findings : [],
              tags: Array.isArray(data.tags) ? data.tags : [],
              status: data.status || 'draft',
              priority: data.priority || 'medium',
              collapsed: false,
              timestamp: data.timestamp || new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              aiSuggestions: [],
              lastAIUpdate: '',
              citationStyle: data.citationStyle || 'APA',
              exportFormat: 'markdown',
            },
          });
        },

      updateResearchStatus:
        (researchId: string, status: 'draft' | 'in-progress' | 'completed') =>
        ({ commands, state }) => {
          let found = false;
          state.doc.descendants((node, pos) => {
            if (node.type.name === this.name && node.attrs.researchId === researchId) {
              found = true;
              commands.updateAttributes(this.name, { 
                status,
                lastUpdated: new Date().toISOString(),
              });
              return false; // Stop searching
            }
          });
          return found;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-r': () => this.editor.commands.insertResearchBlock(),
    };
  },
});

// Helper function to generate markdown report
function generateMarkdownReport(data: any): string {
  const findings = data.findings || [];
  const queries = data.queries || [];
  
  let markdown = `# Research Report: ${data.topic || 'Untitled Research'}\n\n`;
  
  if (data.description) {
    markdown += `## Description\n${data.description}\n\n`;
  }
  
  markdown += `**Status:** ${data.status}\n`;
  markdown += `**Priority:** ${data.priority}\n`;
  markdown += `**Created:** ${new Date(data.timestamp).toLocaleDateString()}\n`;
  markdown += `**Last Updated:** ${new Date(data.lastUpdated).toLocaleDateString()}\n\n`;
  
  if (data.tags && data.tags.length > 0) {
    markdown += `**Tags:** ${data.tags.join(', ')}\n\n`;
  }
  
  if (queries.length > 0) {
    markdown += `## Research Queries\n\n`;
    queries.forEach((query: ResearchQuery, index: number) => {
      markdown += `${index + 1}. **${query.query}** (${query.status})\n`;
    });
    markdown += '\n';
  }
  
  if (findings.length > 0) {
    markdown += `## Findings\n\n`;
    findings.forEach((finding: ResearchFinding, index: number) => {
      markdown += `### ${index + 1}. ${finding.title}\n\n`;
      markdown += `**Source:** ${finding.source}\n`;
      if (finding.url) {
        markdown += `**URL:** [${finding.url}](${finding.url})\n`;
      }
      markdown += `**Relevance:** ${(finding.relevance * 100).toFixed(0)}%\n`;
      markdown += `**Verified:** ${finding.verified ? 'Yes' : 'No'}\n\n`;
      if (finding.content) {
        markdown += `${finding.content}\n\n`;
      }
      if (finding.notes) {
        markdown += `**Notes:** ${finding.notes}\n\n`;
      }
      if (finding.tags && finding.tags.length > 0) {
        markdown += `**Tags:** ${finding.tags.join(', ')}\n\n`;
      }
      markdown += '---\n\n';
    });
  }
  
  markdown += `*Report generated on ${new Date().toLocaleString()}*\n`;
  
  return markdown;
}