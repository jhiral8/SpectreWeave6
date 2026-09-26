import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
// import type { DocumentBlock } from '../types/document';

// Temporary interface definition to test
interface DocumentBlock {
  id: string;
  project_id: string;
  parent_id?: string | null;
  block_type: string;
  content: string;
  metadata?: any;
  order_index: number;
  created_at: string;
  updated_at: string;
  children?: DocumentBlock[];
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'epub' | 'markdown';
  includeMetadata?: boolean;
  includeCover?: boolean;
  customStyling?: boolean;
  pageSize?: 'A4' | 'Letter' | 'Legal';
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  fontFamily?: string;
  fontSize?: number;
  lineSpacing?: number;
}

export interface ProjectMetadata {
  title: string;
  author: string;
  genre: string;
  description?: string;
  coverImage?: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export class ExportService {
  private static instance: ExportService;

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Convert document blocks to plain text with proper formatting
   */
  private blocksToText(blocks: DocumentBlock[]): string {
    return blocks
      .map(block => {
        const content = block.content || '';
        switch (block.block_type) {
          case 'heading':
            return `# ${content}\n\n`;
          case 'subheading':
            return `## ${content}\n\n`;
          case 'paragraph':
            return `${content}\n\n`;
          case 'list_item':
            return `• ${content}\n`;
          case 'quote':
            return `> ${content}\n\n`;
          default:
            return `${content}\n\n`;
        }
      })
      .join('');
  }

  /**
   * Convert document blocks to HTML with styling
   */
  private blocksToHTML(blocks: DocumentBlock[], options: ExportOptions): string {
    const style = `
      <style>
        body {
          font-family: ${options.fontFamily || 'Times New Roman, serif'};
          font-size: ${options.fontSize || 12}pt;
          line-height: ${options.lineSpacing || 1.5};
          margin: ${options.margins?.top || 1}in ${options.margins?.right || 1}in ${options.margins?.bottom || 1}in ${options.margins?.left || 1}in;
          color: #333;
        }
        h1 { font-size: 18pt; font-weight: bold; margin-top: 24pt; margin-bottom: 12pt; }
        h2 { font-size: 16pt; font-weight: bold; margin-top: 20pt; margin-bottom: 10pt; }
        h3 { font-size: 14pt; font-weight: bold; margin-top: 16pt; margin-bottom: 8pt; }
        p { margin-bottom: 12pt; text-align: justify; }
        blockquote { 
          border-left: 4px solid #ccc; 
          margin: 16pt 0; 
          padding-left: 16pt; 
          font-style: italic; 
        }
        ul { margin-bottom: 12pt; }
        li { margin-bottom: 6pt; }
        .page-break { page-break-before: always; }
      </style>
    `;

    const content = blocks
      .map(block => {
        const content = block.content || '';
        switch (block.block_type) {
          case 'heading':
            return `<h1>${this.escapeHTML(content)}</h1>`;
          case 'subheading':
            return `<h2>${this.escapeHTML(content)}</h2>`;
          case 'paragraph':
            return `<p>${this.escapeHTML(content)}</p>`;
          case 'list_item':
            return `<li>${this.escapeHTML(content)}</li>`;
          case 'quote':
            return `<blockquote>${this.escapeHTML(content)}</blockquote>`;
          default:
            return `<p>${this.escapeHTML(content)}</p>`;
        }
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Document Export</title>
          ${style}
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Export to PDF using jsPDF and html2canvas
   */
  async exportToPDF(
    blocks: DocumentBlock[], 
    metadata: ProjectMetadata, 
    options: ExportOptions
  ): Promise<void> {
    try {
      // Create temporary container for HTML
      const container = document.createElement('div');
      container.innerHTML = this.blocksToHTML(blocks, options);
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      // Convert HTML to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: options.pageSize === 'Letter' ? 816 : 794, // A4 width in pixels at 96 DPI
        height: options.pageSize === 'Letter' ? 1056 : 1123, // A4 height in pixels at 96 DPI
      });

      // Remove temporary container
      document.body.removeChild(container);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: options.pageSize || 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add content to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Add metadata if requested
      if (options.includeMetadata) {
        pdf.setProperties({
          title: metadata.title,
          author: metadata.author,
          subject: metadata.genre,
          creator: 'SpectreWeave',
        });
      }

      // Save the PDF
      const fileName = `${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF export error:', error);
      throw new Error('Failed to export PDF');
    }
  }

  /**
   * Export to Word document using docx library
   */
  async exportToWord(
    blocks: DocumentBlock[], 
    metadata: ProjectMetadata, 
    options: ExportOptions
  ): Promise<void> {
    try {
      const children: any[] = [];

      // Add title page if metadata is included
      if (options.includeMetadata) {
        children.push(
          new Paragraph({
            text: metadata.title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 },
          }),
          new Paragraph({
            text: `by ${metadata.author}`,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 400 },
          }),
          new Paragraph({
            text: metadata.genre,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 400 },
          }),
          new Paragraph({
            text: `Word Count: ${metadata.wordCount.toLocaleString()}`,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 400 },
          }),
          new Paragraph({
            text: `Created: ${new Date(metadata.createdAt).toLocaleDateString()}`,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 800 },
          }),
          new Paragraph({
            text: '',
            pageBreakBefore: true,
          })
        );
      }

      // Convert blocks to Word document elements
      blocks.forEach(block => {
        const content = block.content || '';
        switch (block.block_type) {
          case 'heading':
            children.push(
              new Paragraph({
                text: content,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
              })
            );
            break;
          case 'subheading':
            children.push(
              new Paragraph({
                text: content,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 150 },
              })
            );
            break;
          case 'paragraph':
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: content,
                    size: (options.fontSize || 12) * 2, // Convert to half-points
                  }),
                ],
                spacing: { before: 200, after: 200 },
              })
            );
            break;
          case 'list_item':
            children.push(
              new Paragraph({
                text: `• ${content}`,
                spacing: { before: 100, after: 100 },
              })
            );
            break;
          case 'quote':
            children.push(
              new Paragraph({
                text: content,
                spacing: { before: 200, after: 200 },
                style: 'Quote',
              })
            );
            break;
          default:
            children.push(
              new Paragraph({
                text: content,
                spacing: { before: 200, after: 200 },
              })
            );
        }
      });

      // Create document
      const doc = new Document({
        title: metadata.title,
        creator: metadata.author,
        description: metadata.description,
        sections: [
          {
            properties: {
              page: {
                size: {
                  width: options.pageSize === 'Letter' ? 12240 : 11906, // Width in twips
                  height: options.pageSize === 'Letter' ? 15840 : 16838, // Height in twips
                },
                margin: {
                  top: (options.margins?.top || 1) * 1440, // Convert inches to twips
                  bottom: (options.margins?.bottom || 1) * 1440,
                  left: (options.margins?.left || 1) * 1440,
                  right: (options.margins?.right || 1) * 1440,
                },
              },
            },
            children,
          },
        ],
      });

      // Generate and save document
      const buffer = await Packer.toBuffer(doc);
      const fileName = `${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
      saveAs(new Blob([buffer]), fileName);
    } catch (error) {
      console.error('Word export error:', error);
      throw new Error('Failed to export Word document');
    }
  }

  /**
   * Export to EPUB using epub-gen library
   */
  async exportToEPUB(
    blocks: DocumentBlock[], 
    metadata: ProjectMetadata, 
    options: ExportOptions
  ): Promise<void> {
    try {
      const content = blocks
        .map(block => {
          const content = block.content || '';
          switch (block.block_type) {
            case 'heading':
              return `<h1>${this.escapeHTML(content)}</h1>`;
            case 'subheading':
              return `<h2>${this.escapeHTML(content)}</h2>`;
            case 'paragraph':
              return `<p>${this.escapeHTML(content)}</p>`;
            case 'list_item':
              return `<li>${this.escapeHTML(content)}</li>`;
            case 'quote':
              return `<blockquote>${this.escapeHTML(content)}</blockquote>`;
            default:
              return `<p>${this.escapeHTML(content)}</p>`;
          }
        })
        .join('');

      const epubOptions = {
        title: metadata.title,
        author: metadata.author,
        publisher: 'SpectreWeave',
        description: metadata.description || `A ${metadata.genre} story by ${metadata.author}`,
        cover: options.includeCover && metadata.coverImage ? metadata.coverImage : undefined,
        content: [
          {
            title: metadata.title,
            data: `
              <html>
                <head>
                  <title>${metadata.title}</title>
                  <style>
                    body { font-family: serif; line-height: 1.6; margin: 2em; }
                    h1 { font-size: 1.5em; margin-top: 2em; }
                    h2 { font-size: 1.3em; margin-top: 1.5em; }
                    p { margin-bottom: 1em; text-align: justify; }
                    blockquote { border-left: 3px solid #ccc; margin: 1em 0; padding-left: 1em; font-style: italic; }
                    ul { margin-bottom: 1em; }
                    li { margin-bottom: 0.5em; }
                  </style>
                </head>
                <body>
                  ${content}
                </body>
              </html>
            `,
          },
        ],
      };

      const response = await fetch('/.netlify/functions/epub-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blocks, metadata, options }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate EPUB on server');
      }

      const epubBlob = await response.blob();
      const fileName = `${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.epub`;
      saveAs(epubBlob, fileName);
    } catch (error) {
      console.error('EPUB export error:', error);
      throw new Error('Failed to export EPUB');
    }
  }

  /**
   * Export to Markdown
   */
  async exportToMarkdown(
    blocks: DocumentBlock[], 
    metadata: ProjectMetadata, 
    options: ExportOptions
  ): Promise<void> {
    try {
      let markdown = '';

      // Add metadata header if requested
      if (options.includeMetadata) {
        markdown += `# ${metadata.title}\n\n`;
        markdown += `**Author:** ${metadata.author}\n`;
        markdown += `**Genre:** ${metadata.genre}\n`;
        if (metadata.description) {
          markdown += `**Description:** ${metadata.description}\n`;
        }
        markdown += `**Word Count:** ${metadata.wordCount.toLocaleString()}\n`;
        markdown += `**Created:** ${new Date(metadata.createdAt).toLocaleDateString()}\n`;
        markdown += `**Updated:** ${new Date(metadata.updatedAt).toLocaleDateString()}\n\n`;
        markdown += '---\n\n';
      }

      // Add content
      markdown += this.blocksToText(blocks);

      // Save markdown file
      const fileName = `${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Markdown export error:', error);
      throw new Error('Failed to export Markdown');
    }
  }

  /**
   * Main export function that routes to the appropriate format
   */
  async exportDocument(
    blocks: DocumentBlock[], 
    metadata: ProjectMetadata, 
    options: ExportOptions
  ): Promise<void> {
    switch (options.format) {
      case 'pdf':
        await this.exportToPDF(blocks, metadata, options);
        break;
      case 'docx':
        await this.exportToWord(blocks, metadata, options);
        break;
      case 'epub':
        await this.exportToEPUB(blocks, metadata, options);
        break;
      case 'markdown':
        await this.exportToMarkdown(blocks, metadata, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Get word count from document blocks
   */
  getWordCount(blocks: DocumentBlock[]): number {
    return blocks.reduce((count, block) => {
      const content = block.content || '';
      const words = content.trim().split(/\s+/).filter(word => word.length > 0);
      return count + words.length;
    }, 0);
  }
}

export const exportService = ExportService.getInstance();