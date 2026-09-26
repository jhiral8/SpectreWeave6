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
import { Image, Palette, Sparkles, Download, RefreshCw, Eye, Settings, Loader2, CheckCircle, AlertCircle, BookOpen, Camera } from 'lucide-react';
import { coverArtService, type CoverArtOptions, type IllustrationOptions, type GeneratedImage } from '../services/coverArtService';
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

interface CoverArtGeneratorProps {
  project: any;
  blocks: DocumentBlock[];
  onClose?: () => void;
}

const COVER_STYLES = [
  { value: 'realistic', label: 'Realistic', description: 'Photorealistic artwork' },
  { value: 'artistic', label: 'Artistic', description: 'Creative and expressive' },
  { value: 'minimalist', label: 'Minimalist', description: 'Clean and simple design' },
  { value: 'fantasy', label: 'Fantasy', description: 'Magical and epic style' },
  { value: 'sci-fi', label: 'Sci-Fi', description: 'Futuristic and technological' },
  { value: 'mystery', label: 'Mystery', description: 'Dark and mysterious' },
  { value: 'romance', label: 'Romance', description: 'Soft and romantic' },
];

const ILLUSTRATION_TYPES = [
  { value: 'character', label: 'Character', icon: BookOpen },
  { value: 'scene', label: 'Scene', icon: Camera },
  { value: 'landscape', label: 'Landscape', icon: Camera },
  { value: 'object', label: 'Object', icon: Palette },
  { value: 'concept', label: 'Concept', icon: Sparkles },
];

const ILLUSTRATION_STYLES = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'artistic', label: 'Artistic' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'digital-art', label: 'Digital Art' },
];

const PERSPECTIVES = [
  { value: 'front', label: 'Front View' },
  { value: 'side', label: 'Side View' },
  { value: 'three-quarter', label: 'Three-Quarter' },
  { value: 'bird-eye', label: 'Bird\'s Eye' },
  { value: 'worm-eye', label: 'Worm\'s Eye' },
];

const LIGHTING_OPTIONS = [
  { value: 'natural', label: 'Natural' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'soft', label: 'Soft' },
  { value: 'backlit', label: 'Backlit' },
  { value: 'moonlit', label: 'Moonlit' },
];

const COLOR_PALETTES = [
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'monochrome', label: 'Monochrome' },
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'pastel', label: 'Pastel' },
];

const ASPECT_RATIOS = [
  { value: 'portrait', label: 'Portrait (2:3)' },
  { value: 'landscape', label: 'Landscape (3:2)' },
  { value: 'square', label: 'Square (1:1)' },
];

const RESOLUTIONS = [
  { value: '1024x1024', label: '1024×1024' },
  { value: '1152x896', label: '1152×896' },
  { value: '1216x832', label: '1216×832' },
  { value: '1344x768', label: '1344×768' },
  { value: '1536x640', label: '1536×640' },
  { value: '640x1536', label: '640×1536' },
  { value: '768x1344', label: '768×1344' },
  { value: '832x1216', label: '832×1216' },
  { value: '896x1152', label: '896×1152' },
];

const MOODS = [
  { value: 'dark', label: 'Dark' },
  { value: 'bright', label: 'Bright' },
  { value: 'mysterious', label: 'Mysterious' },
  { value: 'romantic', label: 'Romantic' },
  { value: 'action', label: 'Action' },
  { value: 'peaceful', label: 'Peaceful' },
];

export const CoverArtGenerator: React.FC<CoverArtGeneratorProps> = ({ project, blocks, onClose }) => {
  const [mode, setMode] = useState<'cover' | 'illustration'>('cover');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string>('');

  // Cover art options
  const [coverOptions, setCoverOptions] = useState<CoverArtOptions>({
    style: 'realistic',
    aspectRatio: 'portrait',
    resolution: '1024x1024',
    mood: 'mysterious',
    includeText: true,
    textStyle: 'elegant',
  });

  // Illustration options
  const [illustrationOptions, setIllustrationOptions] = useState<IllustrationOptions>({
    type: 'scene',
    style: 'realistic',
    perspective: 'front',
    lighting: 'natural',
    colorPalette: 'warm',
  });

  // Custom prompt for illustrations
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Update recommended styles when genre changes
  useEffect(() => {
    if (project.genre) {
      const recommendedCoverStyles = coverArtService.getRecommendedCoverStyles(project.genre);
      const recommendedIllustrationStyles = coverArtService.getRecommendedIllustrationStyles(project.genre);
      
      if (recommendedCoverStyles.length > 0 && !recommendedCoverStyles.includes(coverOptions.style)) {
        setCoverOptions(prev => ({ ...prev, style: recommendedCoverStyles[0] }));
      }
      
      if (recommendedIllustrationStyles.length > 0 && !recommendedIllustrationStyles.includes(illustrationOptions.style)) {
        setIllustrationOptions(prev => ({ ...prev, style: recommendedIllustrationStyles[0] }));
      }
    }
  }, [project.genre]);

  // Generate cover art
  const handleGenerateCover = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const image = await coverArtService.generateCoverArt(
        project.title,
        project.genre,
        blocks,
        coverOptions
      );

      setSelectedImage(image);
      setGeneratedImages([image]); // Keep only the latest image in the array for potential future use, but only display selectedImage
    } catch (error: any) {
      console.error('Cover generation error:', error);
      setError(error.message || 'Failed to generate cover art');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate illustration
  const handleGenerateIllustration = async () => {
    setIsGenerating(true);
    setError('');

    try {
      let image: GeneratedImage;

      if (customPrompt.trim()) {
        // Generate scene illustration with custom prompt
        image = await coverArtService.generateSceneIllustration(
          customPrompt,
          project.genre,
          illustrationOptions
        );
      } else {
        // Generate chapter illustration
        const chapterContent = blocks.map(block => block.content).join(' ').substring(0, 500);
        image = await coverArtService.generateChapterIllustration(
          project.title,
          chapterContent,
          project.genre,
          illustrationOptions
        );
      }

      setSelectedImage(image);
      setGeneratedImages([image]); // Keep only the latest image in the array for potential future use, but only display selectedImage
    } catch (error: any) {
      console.error('Illustration generation error:', error);
      setError(error.message || 'Failed to generate illustration');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download image
  const handleDownload = async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download image');
    }
  };

  // Update cover options
  const updateCoverOptions = (updates: Partial<CoverArtOptions>) => {
    setCoverOptions(prev => ({ ...prev, ...updates }));
  };

  // Update illustration options
  const updateIllustrationOptions = (updates: Partial<IllustrationOptions>) => {
    setIllustrationOptions(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            AI Cover Art & Illustration Generator
          </CardTitle>
          <CardDescription>
            Generate professional cover art and illustrations using AI based on your story content
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generation Panel */}
        <div className="space-y-6">
          {/* Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generation Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={mode === 'cover' ? 'default' : 'outline'}
                  onClick={() => setMode('cover')}
                  className="h-16"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  Cover Art
                </Button>
                <Button
                  variant={mode === 'illustration' ? 'default' : 'outline'}
                  onClick={() => setMode('illustration')}
                  className="h-16"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Illustration
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cover Art Options */}
          {mode === 'cover' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cover Art Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select
                    value={coverOptions.style}
                    onValueChange={(value) => updateCoverOptions({ style: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COVER_STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          <div>
                            <div className="font-medium">{style.label}</div>
                            <div className="text-sm text-muted-foreground">{style.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Aspect Ratio</Label>
                    <Select
                      value={coverOptions.aspectRatio}
                      onValueChange={(value) => updateCoverOptions({ aspectRatio: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASPECT_RATIOS.map((ratio) => (
                          <SelectItem key={ratio.value} value={ratio.value}>
                            {ratio.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <Select
                      value={coverOptions.resolution}
                      onValueChange={(value) => updateCoverOptions({ resolution: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOLUTIONS.map((res) => (
                          <SelectItem key={res.value} value={res.value}>
                            {res.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mood</Label>
                  <Select
                    value={coverOptions.mood}
                    onValueChange={(value) => updateCoverOptions({ mood: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOODS.map((mood) => (
                        <SelectItem key={mood.value} value={mood.value}>
                          {mood.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="include-text">Include Text Space</Label>
                    <p className="text-sm text-muted-foreground">Reserve space for title and author</p>
                  </div>
                  <Switch
                    id="include-text"
                    checked={coverOptions.includeText}
                    onCheckedChange={(checked) => updateCoverOptions({ includeText: checked })}
                  />
                </div>

                <Button
                  onClick={handleGenerateCover}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Cover...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Cover Art
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Illustration Options */}
          {mode === 'illustration' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Illustration Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={illustrationOptions.type}
                    onValueChange={(value) => updateIllustrationOptions({ type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ILLUSTRATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {React.createElement(type.icon, { size: 16 })}
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Style</Label>
                    <Select
                      value={illustrationOptions.style}
                      onValueChange={(value) => updateIllustrationOptions({ style: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ILLUSTRATION_STYLES.map((style) => (
                          <SelectItem key={style.value} value={style.value}>
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Perspective</Label>
                    <Select
                      value={illustrationOptions.perspective}
                      onValueChange={(value) => updateIllustrationOptions({ perspective: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERSPECTIVES.map((perspective) => (
                          <SelectItem key={perspective.value} value={perspective.value}>
                            {perspective.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lighting</Label>
                    <Select
                      value={illustrationOptions.lighting}
                      onValueChange={(value) => updateIllustrationOptions({ lighting: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LIGHTING_OPTIONS.map((lighting) => (
                          <SelectItem key={lighting.value} value={lighting.value}>
                            {lighting.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Color Palette</Label>
                    <Select
                      value={illustrationOptions.colorPalette}
                      onValueChange={(value) => updateIllustrationOptions({ colorPalette: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_PALETTES.map((palette) => (
                          <SelectItem key={palette.value} value={palette.value}>
                            {palette.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Custom Prompt (Optional)</Label>
                  <Textarea
                    placeholder="Describe the specific scene or element you want to illustrate..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave empty to use story content analysis
                  </p>
                </div>

                <Button
                  onClick={handleGenerateIllustration}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Illustration...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Illustration
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-800">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Generated Image Display */}
        <div className="space-y-6">

          {/* Selected Image Details */}
          {selectedImage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Image Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative flex justify-center items-center">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.prompt}
                    className="max-w-full h-auto object-contain rounded-lg"
                  />
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Prompt</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedImage.prompt}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Style</Label>
                      <p className="text-sm text-muted-foreground mt-1">{selectedImage.style}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Genre</Label>
                      <p className="text-sm text-muted-foreground mt-1">{selectedImage.metadata.genre}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Mood</Label>
                      <p className="text-sm text-muted-foreground mt-1">{selectedImage.metadata.mood}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Resolution</Label>
                      <p className="text-sm text-muted-foreground mt-1">{selectedImage.metadata.resolution}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedImage.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleDownload(selectedImage)}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Image
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};