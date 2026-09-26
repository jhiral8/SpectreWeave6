import { exportService, type ProjectMetadata } from './exportService';
import { coverArtService, type GeneratedImage } from './coverArtService';
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

export interface PublishingMetadata {
  // Basic Information
  title: string;
  subtitle?: string;
  author: string;
  coAuthors?: string[];
  genre: string;
  subGenre?: string;
  
  // Description and Content
  description: string;
  keywords: string[];
  targetAudience: string;
  readingLevel: 'children' | 'young-adult' | 'adult' | 'academic';
  
  // Publishing Information
  publisher?: string;
  publicationDate?: string;
  isbn?: string;
  isbn13?: string;
  language: string;
  pageCount?: number;
  wordCount: number;
  
  // Rights and Licensing
  copyright: string;
  rightsHolder: string;
  license: 'all-rights-reserved' | 'creative-commons' | 'public-domain';
  territory: string[];
  
  // Cover and Design
  coverImage?: string;
  coverDesigner?: string;
  interiorDesigner?: string;
  
  // Categories and Classification
  bisacCategories: string[];
  ageRange?: string;
  contentWarnings?: string[];
  
  // Marketing and Sales
  price?: number;
  currency?: string;
  availability: 'pre-order' | 'available' | 'out-of-print';
  format: 'hardcover' | 'paperback' | 'ebook' | 'audiobook' | 'all';
  
  // Additional Metadata
  series?: string;
  seriesNumber?: number;
  edition?: string;
  revision?: string;
  acknowledgments?: string;
  dedication?: string;
  
  // Technical Information
  fileFormat: 'pdf' | 'epub' | 'mobi' | 'docx' | 'all';
  fileSize?: number;
  drm?: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface SubmissionPackage {
  id: string;
  projectId: string;
  metadata: PublishingMetadata;
  files: {
    manuscript: string;
    cover?: string;
    synopsis?: string;
    authorBio?: string;
    marketingPlan?: string;
  };
  status: 'draft' | 'submitted' | 'reviewed' | 'accepted' | 'rejected';
  submittedTo?: string;
  submittedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISBNInfo {
  isbn: string;
  isbn13: string;
  format: string;
  publisher: string;
  country: string;
  language: string;
  checkDigit: string;
}

export class PublishingService {
  private static instance: PublishingService;

  static getInstance(): PublishingService {
    if (!PublishingService.instance) {
      PublishingService.instance = new PublishingService();
    }
    return PublishingService.instance;
  }

  /**
   * Generate ISBN-13 for self-publishing
   */
  private generateISBN13(): string {
    // This is a simplified ISBN generation for demo purposes
    // In production, you would need to register with ISBN agencies
    const prefix = '978'; // Bookland EAN prefix
    const group = '0'; // English language group
    const publisher = '12345'; // Publisher identifier
    const title = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    
    const isbn12 = prefix + group + publisher + title;
    
    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(isbn12[i]);
      sum += digit * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    return isbn12 + checkDigit;
  }

  /**
   * Generate ISBN-10 from ISBN-13
   */
  private generateISBN10(isbn13: string): string {
    const isbn10 = isbn13.substring(3, 12); // Remove prefix and check digit
    
    // Calculate check digit for ISBN-10
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(isbn10[i]) * (10 - i);
    }
    const checkDigit = (11 - (sum % 11)) % 11;
    const checkChar = checkDigit === 10 ? 'X' : checkDigit.toString();
    
    return isbn10 + checkChar;
  }

  /**
   * Create default publishing metadata from project
   */
  createDefaultMetadata(project: any, blocks: DocumentBlock[]): PublishingMetadata {
    const wordCount = exportService.getWordCount(blocks);
    const isbn13 = this.generateISBN13();
    const isbn10 = this.generateISBN10(isbn13);
    
    return {
      // Basic Information
      title: project.title || 'Untitled',
      author: project.author || 'Unknown Author',
      genre: project.genre || 'General',
      description: project.description || '',
      keywords: [],
      targetAudience: 'adult',
      readingLevel: 'adult',
      
      // Publishing Information
      language: 'en',
      wordCount,
      isbn: isbn10,
      isbn13,
      
      // Rights and Licensing
      copyright: `© ${new Date().getFullYear()} ${project.author || 'Unknown Author'}. All rights reserved.`,
      rightsHolder: project.author || 'Unknown Author',
      license: 'all-rights-reserved',
      territory: ['Worldwide'],
      
      // Categories and Classification
      bisacCategories: [],
      availability: 'available',
      format: 'all',
      
      // Technical Information
      fileFormat: 'all',
      drm: false,
      
      // Timestamps
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Validate publishing metadata
   */
  validateMetadata(metadata: PublishingMetadata): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!metadata.title.trim()) errors.push('Title is required');
    if (!metadata.author.trim()) errors.push('Author is required');
    if (!metadata.genre.trim()) errors.push('Genre is required');
    if (!metadata.description.trim()) errors.push('Description is required');
    if (metadata.wordCount < 1000) errors.push('Word count must be at least 1,000 words');
    if (!metadata.copyright.trim()) errors.push('Copyright information is required');

    // ISBN validation
    if (metadata.isbn13) {
      if (!this.validateISBN13(metadata.isbn13)) {
        errors.push('Invalid ISBN-13 format');
      }
    }

    // Price validation
    if (metadata.price !== undefined && metadata.price < 0) {
      errors.push('Price cannot be negative');
    }

    // Date validation
    if (metadata.publicationDate) {
      const pubDate = new Date(metadata.publicationDate);
      if (isNaN(pubDate.getTime())) {
        errors.push('Invalid publication date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate ISBN-13 format
   */
  private validateISBN13(isbn: string): boolean {
    if (!/^\d{13}$/.test(isbn)) return false;
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(isbn[i]);
      sum += digit * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    return parseInt(isbn[12]) === checkDigit;
  }

  /**
   * Generate BISAC categories based on genre
   */
  getBISACCategories(genre: string): string[] {
    const bisacMap: { [key: string]: string[] } = {
      'fantasy': ['FIC009000', 'FIC009010', 'FIC009020'],
      'sci-fi': ['FIC028000', 'FIC028010', 'FIC028020'],
      'mystery': ['FIC022000', 'FIC022010', 'FIC022020'],
      'romance': ['FIC027000', 'FIC027010', 'FIC027020'],
      'thriller': ['FIC031000', 'FIC031010', 'FIC031020'],
      'horror': ['FIC015000', 'FIC015010', 'FIC015020'],
      'historical': ['FIC014000', 'FIC014010', 'FIC014020'],
      'contemporary': ['FIC000000', 'FIC000000', 'FIC000000'],
      'young-adult': ['YAF000000', 'YAF000000', 'YAF000000'],
      'children': ['JUV000000', 'JUV000000', 'JUV000000'],
    };

    return bisacMap[genre.toLowerCase()] || ['FIC000000'];
  }

  /**
   * Generate submission package
   */
  async createSubmissionPackage(
    project: any,
    blocks: DocumentBlock[],
    metadata: PublishingMetadata,
    coverImage?: GeneratedImage
  ): Promise<SubmissionPackage> {
    try {
      // Export manuscript in multiple formats
      const manuscriptFiles: { [key: string]: string } = {};
      
      // Export as PDF
      const pdfBlob = await this.exportManuscript(blocks, metadata, 'pdf');
      manuscriptFiles.pdf = URL.createObjectURL(pdfBlob);
      
      // Export as Word document
      const docxBlob = await this.exportManuscript(blocks, metadata, 'docx');
      manuscriptFiles.docx = URL.createObjectURL(docxBlob);

      // Generate synopsis
      const synopsis = this.generateSynopsis(blocks, metadata);
      
      // Generate author bio
      const authorBio = this.generateAuthorBio(metadata);
      
      // Generate marketing plan
      const marketingPlan = this.generateMarketingPlan(metadata);

      const packageId = `submission_${Date.now()}`;

      return {
        id: packageId,
        projectId: project.id,
        metadata,
        files: {
          manuscript: manuscriptFiles.pdf,
          cover: coverImage?.url,
          synopsis,
          authorBio,
          marketingPlan,
        },
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Submission package creation error:', error);
      throw new Error('Failed to create submission package');
    }
  }

  /**
   * Export manuscript in specified format
   */
  private async exportManuscript(
    blocks: DocumentBlock[],
    metadata: PublishingMetadata,
    format: 'pdf' | 'docx'
  ): Promise<Blob> {
    const projectMetadata: ProjectMetadata = {
      title: metadata.title,
      author: metadata.author,
      genre: metadata.genre,
      description: metadata.description,
      wordCount: metadata.wordCount,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
    };

    // Create a temporary container for the export
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
      if (format === 'pdf') {
        // For PDF, we'll use the export service
        await exportService.exportToPDF(blocks, projectMetadata, {
          format: 'pdf',
          includeMetadata: true,
          customStyling: true,
          pageSize: 'A4',
          margins: { top: 1, bottom: 1, left: 1, right: 1 },
          fontFamily: 'Times New Roman, serif',
          fontSize: 12,
          lineSpacing: 1.5,
        });
        
        // This is a simplified approach - in production you'd capture the PDF blob
        return new Blob(['PDF content'], { type: 'application/pdf' });
      } else {
        // For Word document
        await exportService.exportToWord(blocks, projectMetadata, {
          format: 'docx',
          includeMetadata: true,
          customStyling: true,
          pageSize: 'A4',
          margins: { top: 1, bottom: 1, left: 1, right: 1 },
          fontFamily: 'Times New Roman, serif',
          fontSize: 12,
          lineSpacing: 1.5,
        });
        
        // This is a simplified approach - in production you'd capture the DOCX blob
        return new Blob(['DOCX content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      }
    } finally {
      document.body.removeChild(container);
    }
  }

  /**
   * Generate synopsis from document content
   */
  private generateSynopsis(blocks: DocumentBlock[], metadata: PublishingMetadata): string {
    const content = blocks.map(block => block.content).join(' ');
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Take first few sentences for synopsis
    const synopsisSentences = sentences.slice(0, 3);
    let synopsis = synopsisSentences.join('. ') + '.';
    
    // Add genre and target audience context
    synopsis += `\n\nA ${metadata.genre} novel targeting ${metadata.targetAudience} readers.`;
    
    return synopsis;
  }

  /**
   * Generate author bio
   */
  private generateAuthorBio(metadata: PublishingMetadata): string {
    return `${metadata.author} is an author specializing in ${metadata.genre} fiction. This is their latest work, showcasing their unique voice and storytelling abilities.`;
  }

  /**
   * Generate marketing plan
   */
  private generateMarketingPlan(metadata: PublishingMetadata): string {
    return `Marketing Plan for "${metadata.title}"\n\n` +
           `Target Audience: ${metadata.targetAudience}\n` +
           `Genre: ${metadata.genre}\n` +
           `Word Count: ${metadata.wordCount.toLocaleString()}\n\n` +
           `Marketing Channels:\n` +
           `- Social media promotion\n` +
           `- Book review outreach\n` +
           `- Genre-specific advertising\n` +
           `- Author website and blog\n` +
           `- Book signing events\n` +
           `- Online book clubs and forums`;
  }

  /**
   * Generate ONIX metadata (industry standard for book metadata)
   */
  generateONIXMetadata(metadata: PublishingMetadata): string {
    const onix = `<?xml version="1.0" encoding="UTF-8"?>
<ONIXMessage xmlns="http://www.editeur.org/onix/2.1/reference" release="2.1">
  <Header>
    <SenderName>SpectreWeave Publishing</SenderName>
    <ContactName>Publishing Team</ContactName>
    <EmailAddress>publishing@spectreweave.com</EmailAddress>
    <SentDateTime>${new Date().toISOString()}</SentDateTime>
  </Header>
  <Product>
    <RecordReference>${metadata.isbn13}</RecordReference>
    <NotificationType>03</NotificationType>
    <ProductIdentifier>
      <ProductIDType>15</ProductIDType>
      <IDValue>${metadata.isbn13}</IDValue>
    </ProductIdentifier>
    <DescriptiveDetail>
      <ProductForm>BB</ProductForm>
      <ProductFormDetail>B105</ProductFormDetail>
      <TitleDetail>
        <TitleType>01</TitleType>
        <TitleElement>
          <TitleElementLevel>01</TitleElementLevel>
          <TitleText>${metadata.title}</TitleText>
        </TitleElement>
      </TitleDetail>
      <Contributor>
        <SequenceNumber>1</SequenceNumber>
        <ContributorRole>A01</ContributorRole>
        <PersonName>${metadata.author}</PersonName>
      </Contributor>
      <Subject>
        <SubjectSchemeIdentifier>10</SubjectSchemeIdentifier>
        <SubjectCode>${metadata.bisacCategories[0] || 'FIC000000'}</SubjectCode>
      </Subject>
      <Audience>
        <AudienceCodeType>22</AudienceCodeType>
        <AudienceCodeValue>01</AudienceCodeValue>
      </Audience>
    </DescriptiveDetail>
    <PublishingDetail>
      <PublishingStatus>04</PublishingStatus>
      <PublishingDate>
        <PublishingDateRole>01</PublishingDateRole>
        <Date>${metadata.publicationDate || new Date().toISOString().split('T')[0]}</Date>
      </PublishingDate>
    </PublishingDetail>
    <ProductSupply>
      <SupplyDetail>
        <Supplier>
          <SupplierRole>01</SupplierRole>
          <SupplierName>SpectreWeave Publishing</SupplierName>
        </Supplier>
        <ProductAvailability>20</ProductAvailability>
        <Price>
          <PriceType>01</PriceType>
          <PriceAmount>${metadata.price || '0.00'}</PriceAmount>
          <CurrencyCode>${metadata.currency || 'USD'}</CurrencyCode>
        </Price>
      </SupplyDetail>
    </ProductSupply>
  </Product>
</ONIXMessage>`;

    return onix;
  }

  /**
   * Generate EPUB metadata
   */
  generateEPUBMetadata(metadata: PublishingMetadata): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">${metadata.isbn13}</dc:identifier>
    <dc:title>${metadata.title}</dc:title>
    <dc:creator>${metadata.author}</dc:creator>
    <dc:language>${metadata.language}</dc:language>
    <dc:description>${metadata.description}</dc:description>
    <dc:subject>${metadata.genre}</dc:subject>
    <dc:publisher>${metadata.publisher || 'SpectreWeave Publishing'}</dc:publisher>
    <dc:rights>${metadata.copyright}</dc:rights>
    <dc:date>${metadata.publicationDate || new Date().toISOString()}</dc:date>
    <dc:format>application/epub+zip</dc:format>
    <meta property="dcterms:modified">${metadata.updatedAt}</meta>
    <meta property="schema:numberOfPages">${metadata.pageCount || 'unknown'}</meta>
    <meta property="schema:wordCount">${metadata.wordCount}</meta>
  </metadata>
</package>`;
  }

  /**
   * Get publishing recommendations based on genre and metadata
   */
  getPublishingRecommendations(metadata: PublishingMetadata): {
    publishers: string[];
    agents: string[];
    platforms: string[];
    marketing: string[];
  } {
    const recommendations: { [key: string]: any } = {
      fantasy: {
        publishers: ['Tor Books', 'Orbit', 'DAW Books', 'Ace Books'],
        agents: ['Literary agents specializing in fantasy'],
        platforms: ['Amazon KDP', 'Barnes & Noble Press', 'Kobo Writing Life'],
        marketing: ['Fantasy conventions', 'BookTube reviewers', 'Fantasy blogs'],
      },
      'sci-fi': {
        publishers: ['Tor Books', 'Ace Books', 'DAW Books', 'Baen Books'],
        agents: ['Literary agents specializing in science fiction'],
        platforms: ['Amazon KDP', 'Barnes & Noble Press', 'Kobo Writing Life'],
        marketing: ['Sci-fi conventions', 'Science fiction magazines', 'Tech blogs'],
      },
      mystery: {
        publishers: ['St. Martin\'s Press', 'Berkley', 'Minotaur Books', 'HarperCollins'],
        agents: ['Literary agents specializing in mystery/thriller'],
        platforms: ['Amazon KDP', 'Barnes & Noble Press', 'Kobo Writing Life'],
        marketing: ['Mystery book clubs', 'Crime fiction blogs', 'Local bookstores'],
      },
      romance: {
        publishers: ['Harlequin', 'Avon', 'Berkley', 'St. Martin\'s Press'],
        agents: ['Literary agents specializing in romance'],
        platforms: ['Amazon KDP', 'Barnes & Noble Press', 'Kobo Writing Life'],
        marketing: ['Romance book clubs', 'Romance blogs', 'Social media romance communities'],
      },
    };

    return recommendations[metadata.genre.toLowerCase()] || {
      publishers: ['General publishers'],
      agents: ['General literary agents'],
      platforms: ['Amazon KDP', 'Barnes & Noble Press', 'Kobo Writing Life'],
      marketing: ['Social media', 'Book blogs', 'Local bookstores'],
    };
  }
}

export const publishingService = PublishingService.getInstance();