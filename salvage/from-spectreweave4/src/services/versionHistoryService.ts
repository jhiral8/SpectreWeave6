import { supabase } from '../lib/supabase';
import { DocumentBlockService } from './documentBlockService';
// import { DocumentVersion } from '../types/document';

// Temporary interface definition to test
interface DocumentVersion {
  id: string;
  project_id: string;
  version_number: number;
  content_snapshot: any;
  change_summary?: string;
  created_by?: string;
  created_at: string;
  ai_interaction_id?: string; // Track AI interactions that led to this version
}

export class VersionHistoryService {
  // Create a new version with content snapshot
  static async createVersion(
    projectId: string, 
    contentSnapshot: any, 
    changeSummary?: string,
    aiInteractionId?: string
  ): Promise<DocumentVersion | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get the next version number
      const { data: existingVersions } = await supabase
        .from('document_versions')
        .select('version_number')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersion = existingVersions && existingVersions.length > 0 
        ? Math.max(...existingVersions.map(v => v.version_number)) + 1 
        : 1;

      const { data, error } = await supabase
        .from('document_versions')
        .insert({
          project_id: projectId,
          version_number: nextVersion,
          content_snapshot: contentSnapshot,
          change_summary: changeSummary,
          created_by: user.id,
          ai_interaction_id: aiInteractionId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating version:', error);
        return null;
      }

      console.log(`Version ${nextVersion} created successfully`);
      return data as DocumentVersion;
    } catch (error) {
      console.error('Error creating version:', error);
      return null;
    }
  }

  // Create version from document blocks
  static async createVersionFromBlocks(
    projectId: string,
    changeSummary?: string,
    aiInteractionId?: string
  ): Promise<DocumentVersion | null> {
    try {
      // Load current document blocks
      const blocks = await DocumentBlockService.loadDocumentBlocks(projectId);
      
      // Create content snapshot
      const contentSnapshot = {
        blocks: blocks,
        reconstructed_content: DocumentBlockService.reconstructContentFromBlocks(blocks),
        word_count: DocumentBlockService.calculateWordCountFromBlocks(blocks),
        timestamp: new Date().toISOString()
      };

      return await this.createVersion(projectId, contentSnapshot, changeSummary, aiInteractionId);
    } catch (error) {
      console.error('Error creating version from blocks:', error);
      return null;
    }
  }

  // Create version from simple content (for backward compatibility)
  static async createVersionFromContent(
    projectId: string,
    content: string,
    changeSummary?: string,
    aiInteractionId?: string
  ): Promise<DocumentVersion | null> {
    try {
      const contentSnapshot = {
        content: content,
        word_count: content.split(/\s+/).filter(word => word.length > 0).length,
        timestamp: new Date().toISOString()
      };

      return await this.createVersion(projectId, contentSnapshot, changeSummary, aiInteractionId);
    } catch (error) {
      console.error('Error creating version from content:', error);
      return null;
    }
  }

  // Load all versions for a project
  static async loadVersions(projectId: string): Promise<DocumentVersion[]> {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false });

      if (error) {
        console.error('Error loading versions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error loading versions:', error);
      return [];
    }
  }

  // Get a specific version
  static async getVersion(projectId: string, versionNumber: number): Promise<DocumentVersion | null> {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('project_id', projectId)
        .eq('version_number', versionNumber)
        .single();

      if (error) {
        console.error('Error loading version:', error);
        return null;
      }

      return data as DocumentVersion;
    } catch (error) {
      console.error('Error loading version:', error);
      return null;
    }
  }

  // Delete a version (only for project owners)
  static async deleteVersion(versionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('document_versions')
        .delete()
        .eq('id', versionId);

      if (error) {
        console.error('Error deleting version:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting version:', error);
      return false;
    }
  }

  // Compare two versions and generate diff summary
  static generateDiffSummary(oldVersion: DocumentVersion, newVersion: DocumentVersion): string {
    try {
      const oldContent = oldVersion.content_snapshot?.content || 
                        oldVersion.content_snapshot?.reconstructed_content || '';
      const newContent = newVersion.content_snapshot?.content || 
                        newVersion.content_snapshot?.reconstructed_content || '';

      const oldWords = oldContent.split(/\s+/).filter(word => word.length > 0).length;
      const newWords = newContent.split(/\s+/).filter(word => word.length > 0).length;
      const wordDiff = newWords - oldWords;

      if (wordDiff > 0) {
        return `Added ${wordDiff} words`;
      } else if (wordDiff < 0) {
        return `Removed ${Math.abs(wordDiff)} words`;
      } else {
        return 'Content modified';
      }
    } catch (error) {
      console.error('Error generating diff summary:', error);
      return 'Content changed';
    }
  }

  // Create version for AI-generated content
  static async createAIVersion(
    projectId: string,
    aiInteractionId: string,
    changeSummary?: string
  ): Promise<DocumentVersion | null> {
    try {
      // Get AI interaction details
      const { data: aiInteraction } = await supabase
        .from('ai_interactions')
        .select('*')
        .eq('id', aiInteractionId)
        .single();

      if (!aiInteraction) {
        console.error('AI interaction not found:', aiInteractionId);
        return null;
      }

      // Create version with AI context
      const summary = changeSummary || `AI ${aiInteraction.interaction_type} using ${aiInteraction.ai_provider}`;
      
      return await this.createVersionFromBlocks(projectId, summary, aiInteractionId);
    } catch (error) {
      console.error('Error creating AI version:', error);
      return null;
    }
  }

  // Auto-save with version history integration
  static async autoSaveWithVersion(
    projectId: string,
    content: string,
    changeSummary?: string
  ): Promise<{ saved: boolean; version?: DocumentVersion }> {
    try {
      // First, update the project content
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update project content
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          content: content,
          word_count: content.split(/\s+/).filter(word => word.length > 0).length,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating project:', updateError);
        return { saved: false };
      }

      // Skip document block updates for auto-save to prevent hanging
      // Document blocks will be updated when explicitly needed (version restoration, etc.)

      // Create version snapshot
      const version = await this.createVersionFromContent(projectId, content, changeSummary);

      return { 
        saved: true, 
        version: version || undefined 
      };
    } catch (error) {
      console.error('Error in auto-save with version:', error);
      return { saved: false };
    }
  }
} 