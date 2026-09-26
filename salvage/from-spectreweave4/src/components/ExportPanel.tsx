import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Download, FileText, FileImage, FileCode, FileType, Settings, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { exportService, type ExportOptions, type ProjectMetadata } from '../services/exportService';
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

interface ExportPanelProps {
  project: any;
  blocks: DocumentBlock[];
  onClose?: () => void;
}

const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF Document', icon: FileText, description: 'Professional PDF with custom formatting' },
  { value: 'docx', label: 'Word Document', icon: FileType, description: 'Microsoft Word compatible format' },
  { value: 'epub', label: 'EPUB E-book', icon: FileImage, description: 'E-book format for digital publishing' },
  { value: 'markdown', label: 'Markdown', icon: FileCode, description: 'Plain text with markdown formatting' },
];

const PAGE_SIZES = [
  { value: 'A4', label: 'A4 (210 × 297 mm)' },
  { value: 'Letter', label: 'Letter (8.5 × 11 in)' },
  { value: 'Legal', label: 'Legal (8.5 × 14 in)' },
];

const FONT_FAMILIES = [
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Courier New, monospace', label: 'Courier New' },
];

export const ExportPanel: React.FC<ExportPanelProps> = ({ project, blocks, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportOptions['format']>('pdf');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeMetadata: true,
    includeCover: true,
    customStyling: true,
    pageSize: 'A4',
    margins: { top: 1, bottom: 1, left: 1, right: 1 },
    fontFamily: 'Times New Roman, serif',
    fontSize: 12,
    lineSpacing: 1.5,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Update export options when format changes
  useEffect(() => {
    setExportOptions(prev => ({ ...prev, format: selectedFormat }));
  }, [selectedFormat]);

  // Get project metadata
  const getProjectMetadata = (): ProjectMetadata => {
    const wordCount = exportService.getWordCount(blocks);
    return {
      title: project.title || 'Untitled Project',
      author: project.author || 'Unknown Author',
      genre: project.genre || 'General',
      description: project.description,
      coverImage: project.cover_image,
      wordCount,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    };
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('idle');
    setErrorMessage('');

    try {
      const metadata = getProjectMetadata();
      await exportService.exportDocument(blocks, metadata, exportOptions);
      setExportStatus('success');
      
      // Auto-close after success
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Export error:', error);
      setExportStatus('error');
      setErrorMessage(error.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Update export options
  const updateExportOptions = (updates: Partial<ExportOptions>) => {
    setExportOptions(prev => ({ ...prev, ...updates }));
  };

  // Get format icon
  const getFormatIcon = (format: string) => {
    const formatInfo = EXPORT_FORMATS.find(f => f.value === format);
    return formatInfo ? React.createElement(formatInfo.icon, { size: 20 }) : <FileText size={20} />;
  };

  const metadata = getProjectMetadata();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Document
        </CardTitle>
        <CardDescription>
          Export your document in various formats with customizable options
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Document Info */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Document Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Title:</span>
              <p className="font-medium">{metadata.title}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Author:</span>
              <p className="font-medium">{metadata.author}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Genre:</span>
              <p className="font-medium">{metadata.genre}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Word Count:</span>
              <p className="font-medium">{metadata.wordCount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Export Format</Label>
          <div className="grid grid-cols-2 gap-3">
            {EXPORT_FORMATS.map((format) => (
              <div
                key={format.value}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedFormat === format.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedFormat(format.value as ExportOptions['format'])}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${
                    selectedFormat === format.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {React.createElement(format.icon, { size: 16 })}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{format.label}</p>
                    <p className="text-sm text-muted-foreground">{format.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Export Options */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <Label className="text-base font-medium">Export Options</Label>
          </div>

          {/* Basic Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="include-metadata">Include Metadata</Label>
                <p className="text-sm text-muted-foreground">Add title page with project information</p>
              </div>
              <Switch
                id="include-metadata"
                checked={exportOptions.includeMetadata}
                onCheckedChange={(checked) => updateExportOptions({ includeMetadata: checked })}
              />
            </div>

            {selectedFormat === 'epub' && (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="include-cover">Include Cover Image</Label>
                  <p className="text-sm text-muted-foreground">Add cover image to e-book</p>
                </div>
                <Switch
                  id="include-cover"
                  checked={exportOptions.includeCover}
                  onCheckedChange={(checked) => updateExportOptions({ includeCover: checked })}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="custom-styling">Custom Styling</Label>
                <p className="text-sm text-muted-foreground">Apply professional formatting</p>
              </div>
              <Switch
                id="custom-styling"
                checked={exportOptions.customStyling}
                onCheckedChange={(checked) => updateExportOptions({ customStyling: checked })}
              />
            </div>
          </div>

          {/* Advanced Options for PDF and Word */}
          {(selectedFormat === 'pdf' || selectedFormat === 'docx') && exportOptions.customStyling && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Advanced Formatting</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="page-size">Page Size</Label>
                  <Select
                    value={exportOptions.pageSize}
                    onValueChange={(value) => updateExportOptions({ pageSize: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-family">Font Family</Label>
                  <Select
                    value={exportOptions.fontFamily}
                    onValueChange={(value) => updateExportOptions({ fontFamily: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="font-size">Font Size (pt)</Label>
                  <Input
                    id="font-size"
                    type="number"
                    min="8"
                    max="24"
                    value={exportOptions.fontSize}
                    onChange={(e) => updateExportOptions({ fontSize: parseInt(e.target.value) || 12 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="line-spacing">Line Spacing</Label>
                  <Input
                    id="line-spacing"
                    type="number"
                    min="1"
                    max="3"
                    step="0.1"
                    value={exportOptions.lineSpacing}
                    onChange={(e) => updateExportOptions({ lineSpacing: parseFloat(e.target.value) || 1.5 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Margins (inches)</Label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label htmlFor="margin-top" className="text-xs">Top</Label>
                    <Input
                      id="margin-top"
                      type="number"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={exportOptions.margins?.top}
                      onChange={(e) => updateExportOptions({
                        margins: { ...exportOptions.margins!, top: parseFloat(e.target.value) || 1 }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="margin-bottom" className="text-xs">Bottom</Label>
                    <Input
                      id="margin-bottom"
                      type="number"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={exportOptions.margins?.bottom}
                      onChange={(e) => updateExportOptions({
                        margins: { ...exportOptions.margins!, bottom: parseFloat(e.target.value) || 1 }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="margin-left" className="text-xs">Left</Label>
                    <Input
                      id="margin-left"
                      type="number"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={exportOptions.margins?.left}
                      onChange={(e) => updateExportOptions({
                        margins: { ...exportOptions.margins!, left: parseFloat(e.target.value) || 1 }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="margin-right" className="text-xs">Right</Label>
                    <Input
                      id="margin-right"
                      type="number"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={exportOptions.margins?.right}
                      onChange={(e) => updateExportOptions({
                        margins: { ...exportOptions.margins!, right: parseFloat(e.target.value) || 1 }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export Status */}
        {exportStatus !== 'idle' && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            exportStatus === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {exportStatus === 'success' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Export Successful!</p>
                  <p className="text-sm text-green-600">Your document has been exported successfully.</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Export Failed</p>
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                {getFormatIcon(selectedFormat)}
                <span className="ml-2">Export as {EXPORT_FORMATS.find(f => f.value === selectedFormat)?.label}</span>
              </>
            )}
          </Button>
          
          {onClose && (
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};