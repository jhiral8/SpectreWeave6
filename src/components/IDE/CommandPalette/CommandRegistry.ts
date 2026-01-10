/**
 * Command Registry
 * 
 * Central registry for all commands available in the command palette.
 * Commands can be registered, searched, and executed through this registry.
 */

import { Command, CommandContext, CommandCategory } from './types';

class CommandRegistryImpl {
  private commands: Map<string, Command> = new Map();
  private listeners: Set<() => void> = new Set();

  /**
   * Register a new command
   */
  register(command: Command): void {
    this.commands.set(command.id, command);
    this.notifyListeners();
  }

  /**
   * Register multiple commands at once
   */
  registerAll(commands: Command[]): void {
    commands.forEach(cmd => this.commands.set(cmd.id, cmd));
    this.notifyListeners();
  }

  /**
   * Unregister a command by ID
   */
  unregister(id: string): void {
    this.commands.delete(id);
    this.notifyListeners();
  }

  /**
   * Get a command by ID
   */
  get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  /**
   * Get all registered commands
   */
  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get commands filtered by category
   */
  getByCategory(category: CommandCategory): Command[] {
    return this.getAll().filter(cmd => cmd.category === category);
  }

  /**
   * Search commands by query string with fuzzy matching
   */
  search(query: string, context: CommandContext): Command[] {
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) {
      return this.getVisibleCommands(context);
    }

    const results = this.getAll()
      .filter(cmd => {
        // Check visibility
        if (cmd.isVisible && !cmd.isVisible(context)) return false;
        
        // Match against label, id, keywords
        const searchTargets = [
          cmd.label.toLowerCase(),
          cmd.id.toLowerCase(),
          ...(cmd.keywords || []).map(k => k.toLowerCase()),
          cmd.description?.toLowerCase() || '',
        ];
        
        return searchTargets.some(target => target.includes(lowerQuery));
      })
      .map(cmd => ({
        cmd,
        score: this.calculateMatchScore(cmd, lowerQuery),
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ cmd }) => cmd);

    return results;
  }

  /**
   * Get all visible commands for current context
   */
  getVisibleCommands(context: CommandContext): Command[] {
    return this.getAll()
      .filter(cmd => !cmd.isVisible || cmd.isVisible(context))
      .sort((a, b) => {
        // Sort by category first, then by label
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.label.localeCompare(b.label);
      });
  }

  /**
   * Calculate match score for sorting results
   */
  private calculateMatchScore(cmd: Command, query: string): number {
    let score = 0;
    const label = cmd.label.toLowerCase();
    
    // Exact match on label start = highest score
    if (label.startsWith(query)) score += 100;
    // Exact match anywhere in label
    else if (label.includes(query)) score += 50;
    
    // Match in keywords
    if (cmd.keywords?.some(k => k.toLowerCase().includes(query))) {
      score += 30;
    }
    
    // Match in ID
    if (cmd.id.toLowerCase().includes(query)) score += 20;
    
    // Has shortcut (likely more important)
    if (cmd.shortcut) score += 10;
    
    return score;
  }

  /**
   * Execute a command by ID
   */
  execute(id: string, context: CommandContext): void {
    const command = this.get(id);
    if (!command) {
      console.warn(`Command not found: ${id}`);
      return;
    }

    if (command.isEnabled && !command.isEnabled(context)) {
      console.warn(`Command ${id} is not enabled in current context`);
      return;
    }

    try {
      command.execute(context);
    } catch (error) {
      console.error(`Error executing command ${id}:`, error);
    }
  }

  /**
   * Subscribe to registry changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// Singleton instance
export const commandRegistry = new CommandRegistryImpl();
