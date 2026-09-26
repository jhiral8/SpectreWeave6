import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BookOpen, FileText, Download, Settings, CheckCircle, AlertCircle, Loader2, Globe, Copyright, Users, Target, Calendar, DollarSign, Tag, Award, FileCheck, Send, Eye, Edit3, RefreshCw } from 'lucide-react';
import { publishingService, type PublishingMetadata, type SubmissionPackage } from '../services/publishingService';
import { coverArtService, type GeneratedImage } from '../services/coverArtService';
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

interface PublishingWorkflowProps {
  project: any;
  blocks: DocumentBlock[];
  onClose?: () => void;
}

const READING_LEVELS = [
  { value: 'children', label: 'Children' },
  { value: 'young-adult', label: 'Young Adult' },
  { value: 'adult', label: 'Adult' },
  { value: 'academic', label: 'Academic' },
];

const LICENSES = [
  { value: 'all-rights-reserved', label: 'All Rights Reserved' },
  { value: 'creative-commons', label: 'Creative Commons' },
  { value: 'public-domain', label: 'Public Domain' },
];

const FORMATS = [
  { value: 'hardcover', label: 'Hardcover' },
  { value: 'paperback', label: 'Paperback' },
  { value: 'ebook', label: 'E-book' },
  { value: 'audiobook', label: 'Audiobook' },
  { value: 'all', label: 'All Formats' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'pre-order', label: 'Pre-order' },
  { value: 'available', label: 'Available' },
  { value: 'out-of-print', label: 'Out of Print' },
];

const TERRITORIES = [
  'Worldwide',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'European Union',
  'Asia',
  'Latin America',
];

export const PublishingWorkflow: React.FC<PublishingWorkflowProps> = ({ project, blocks, onClose }) => {
  const [activeTab, setActiveTab] = useState('metadata');
  const [metadata, setMetadata] = useState<PublishingMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submissionPackage, setSubmissionPackage] = useState<SubmissionPackage | null>(null);
  const [coverImage, setCoverImage] = useState<GeneratedImage | null>(null);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);

  // Initialize metadata when component mounts
  useEffect(() => {
    if (project && blocks.length > 0) {
      const defaultMetadata = publishingService.createDefaultMetadata(project, blocks);
      setMetadata(defaultMetadata);
    }
  }, [project, blocks]);

  // Validate metadata when it changes
  useEffect(() => {
    if (metadata) {
      const validation = publishingService.validateMetadata(metadata);
      setValidationErrors(validation.errors);
    }
  }, [metadata]);

  // Update metadata field
  const updateMetadata = (updates: Partial<PublishingMetadata>) => {
    if (metadata) {
      setMetadata({ ...metadata, ...updates, updatedAt: new Date().toISOString() });
    }
  };

  // Generate cover art
  const handleGenerateCover = async () => {
    if (!metadata) return;
    
    setIsGeneratingCover(true);
    try {
      const image = await coverArtService.generateCoverArt(
        metadata.title,
        metadata.genre,
        blocks,
        {
          style: 'realistic',
          aspectRatio: 'portrait',
          resolution: '640x1536',
          mood: 'mysterious',
          includeText: true,
        }
      );
      setCoverImage(image);
      updateMetadata({ coverImage: image.url });
    } catch (error) {
      console.error('Cover generation error:', error);
    } finally {
      setIsGeneratingCover(false);
    }
  };

  // Create submission package
  const handleCreateSubmissionPackage = async () => {
    if (!metadata) return;
    
    setIsLoading(true);
    try {
      const package_ = await publishingService.createSubmissionPackage(
        project,
        blocks,
        metadata,
        coverImage || undefined
      );
      setSubmissionPackage(package_);
      setActiveTab('submission');
    } catch (error) {
      console.error('Submission package creation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Download metadata files
  const handleDownloadMetadata = (format: 'onix' | 'epub') => {
    if (!metadata) return;
    
    let content: string;
    let filename: string;
    let mimeType: string;
    
    if (format === 'onix') {
      content = publishingService.generateONIXMetadata(metadata);
      filename = `${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_onix.xml`;
      mimeType = 'application/xml';
    } else {
      content = publishingService.generateEPUBMetadata(metadata);
      filename = `${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_epub.xml`;
      mimeType = 'application/xml';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Get publishing recommendations
  const getRecommendations = () => {
    if (!metadata) return null;
    return publishingService.getPublishingRecommendations(metadata);
  };

  if (!metadata) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const recommendations = getRecommendations();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Publishing Workflow
          </CardTitle>
          <CardDescription>
            Prepare your manuscript for professional publishing with comprehensive metadata management
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metadata" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Metadata
          </TabsTrigger>
          <TabsTrigger value="cover" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Cover Design
          </TabsTrigger>
          <TabsTrigger value="submission" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Submission
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={metadata.title}
                    onChange={(e) => updateMetadata({ title: e.target.value })}
                    placeholder="Book title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={metadata.subtitle || ''}
                    onChange={(e) => updateMetadata({ subtitle: e.target.value })}
                    placeholder="Optional subtitle"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={metadata.author}
                    onChange={(e) => updateMetadata({ author: e.target.value })}
                    placeholder="Author name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genre">Genre *</Label>
                  <Input
                    id="genre"
                    value={metadata.genre}
                    onChange={(e) => updateMetadata({ genre: e.target.value })}
                    placeholder="Primary genre"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subgenre">Sub-genre</Label>
                  <Input
                    id="subgenre"
                    value={metadata.subGenre || ''}
                    onChange={(e) => updateMetadata({ subGenre: e.target.value })}
                    placeholder="Sub-genre"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={metadata.description}
                    onChange={(e) => updateMetadata({ description: e.target.value })}
                    placeholder="Book description"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-audience">Target Audience</Label>
                  <Select
                    value={metadata.targetAudience}
                    onValueChange={(value) => updateMetadata({ targetAudience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="children">Children</SelectItem>
                      <SelectItem value="young-adult">Young Adult</SelectItem>
                      <SelectItem value="adult">Adult</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reading-level">Reading Level</Label>
                  <Select
                    value={metadata.readingLevel}
                    onValueChange={(value) => updateMetadata({ readingLevel: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {READING_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    value={metadata.keywords.join(', ')}
                    onChange={(e) => updateMetadata({ keywords: e.target.value.split(',').map(k => k.trim()) })}
                    placeholder="Comma-separated keywords"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Publishing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Publishing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN-10</Label>
                    <Input
                      id="isbn"
                      value={metadata.isbn || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isbn13">ISBN-13</Label>
                    <Input
                      id="isbn13"
                      value={metadata.isbn13 || ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input
                    id="publisher"
                    value={metadata.publisher || ''}
                    onChange={(e) => updateMetadata({ publisher: e.target.value })}
                    placeholder="Publisher name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publication-date">Publication Date</Label>
                  <Input
                    id="publication-date"
                    type="date"
                    value={metadata.publicationDate || ''}
                    onChange={(e) => updateMetadata({ publicationDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    value={metadata.language}
                    onChange={(e) => updateMetadata({ language: e.target.value })}
                    placeholder="Language code (e.g., en)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="word-count">Word Count</Label>
                    <Input
                      id="word-count"
                      value={metadata.wordCount.toLocaleString()}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="page-count">Page Count</Label>
                    <Input
                      id="page-count"
                      type="number"
                      value={metadata.pageCount || ''}
                      onChange={(e) => updateMetadata({ pageCount: parseInt(e.target.value) || undefined })}
                      placeholder="Estimated pages"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rights and Licensing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rights and Licensing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="copyright">Copyright *</Label>
                  <Textarea
                    id="copyright"
                    value={metadata.copyright}
                    onChange={(e) => updateMetadata({ copyright: e.target.value })}
                    placeholder="Copyright information"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rights-holder">Rights Holder</Label>
                  <Input
                    id="rights-holder"
                    value={metadata.rightsHolder}
                    onChange={(e) => updateMetadata({ rightsHolder: e.target.value })}
                    placeholder="Rights holder name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license">License</Label>
                  <Select
                    value={metadata.license}
                    onValueChange={(value) => updateMetadata({ license: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LICENSES.map((license) => (
                        <SelectItem key={license.value} value={license.value}>
                          {license.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Territory</Label>
                  <Select
                    value={metadata.territory[0] || 'Worldwide'}
                    onValueChange={(value) => updateMetadata({ territory: [value] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TERRITORIES.map((territory) => (
                        <SelectItem key={territory} value={territory}>
                          {territory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Sales and Marketing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sales and Marketing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={metadata.price || ''}
                      onChange={(e) => updateMetadata({ price: parseFloat(e.target.value) || undefined })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={metadata.currency || 'USD'}
                      onChange={(e) => updateMetadata({ currency: e.target.value })}
                      placeholder="USD"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select
                    value={metadata.format}
                    onValueChange={(value) => updateMetadata({ format: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATS.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability">Availability</Label>
                  <Select
                    value={metadata.availability}
                    onValueChange={(value) => updateMetadata({ availability: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABILITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <h3 className="font-medium text-red-800">Validation Errors</h3>
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-red-700">{error}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => setActiveTab('cover')}
              disabled={validationErrors.length > 0}
            >
              Next: Cover Design
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleDownloadMetadata('onix')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download ONIX
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDownloadMetadata('epub')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download EPUB Metadata
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Cover Design Tab */}
        <TabsContent value="cover" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cover Design</CardTitle>
              <CardDescription>
                Generate AI-powered cover art or upload your own cover image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {coverImage ? (
                <div className="space-y-4">
                  <div className="aspect-[2/3] max-w-xs mx-auto">
                    <img
                      src={coverImage.url}
                      alt="Generated cover"
                      className="w-full h-full object-cover rounded-lg shadow-lg"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Generated Cover Art</p>
                    <Button
                      variant="outline"
                      onClick={handleGenerateCover}
                      disabled={isGeneratingCover}
                    >
                      {isGeneratingCover ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Generate New Cover
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No cover image generated yet</p>
                  <Button
                    onClick={handleGenerateCover}
                    disabled={isGeneratingCover}
                  >
                    {isGeneratingCover ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Cover...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Generate Cover Art
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setActiveTab('metadata')}>
              Back: Metadata
            </Button>
            <Button
              onClick={() => setActiveTab('submission')}
              disabled={!coverImage}
            >
              Next: Submission Package
            </Button>
          </div>
        </TabsContent>

        {/* Submission Package Tab */}
        <TabsContent value="submission" className="space-y-6">
          {submissionPackage ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submission Package Created</CardTitle>
                  <CardDescription>
                    Your submission package is ready for publishers and agents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Package ID</Label>
                      <p className="text-sm text-muted-foreground">{submissionPackage.id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Badge variant="secondary">{submissionPackage.status}</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Created</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(submissionPackage.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Files</Label>
                      <p className="text-sm text-muted-foreground">
                        Manuscript, Cover, Synopsis, Bio, Marketing Plan
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Synopsis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{submissionPackage.files.synopsis}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Author Bio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{submissionPackage.files.authorBio}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Marketing Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{submissionPackage.files.marketingPlan}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create Submission Package</CardTitle>
                <CardDescription>
                  Generate a complete submission package for publishers and literary agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleCreateSubmissionPackage}
                  disabled={isLoading || validationErrors.length > 0}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Package...
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4 mr-2" />
                      Create Submission Package
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setActiveTab('cover')}>
              Back: Cover Design
            </Button>
            <Button
              onClick={() => setActiveTab('recommendations')}
              disabled={!submissionPackage}
            >
              Next: Recommendations
            </Button>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          {recommendations && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommended Publishers</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendations.publishers.map((publisher, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{publisher}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommended Platforms</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendations.platforms.map((platform, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{platform}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Marketing Channels</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendations.marketing.map((channel, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{channel}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Literary Agents</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendations.agents.map((agent, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{agent}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setActiveTab('submission')}>
              Back: Submission Package
            </Button>
            <Button onClick={onClose}>
              Complete Publishing Setup
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};