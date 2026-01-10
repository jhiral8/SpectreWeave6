import { Command } from './types';

class CommandRegistryClass {
  private commands: Map<string, Command> = new Map();

  register(command: Command): void {
    this.commands.set(command.id, command);
  }

  unregister(id: string): void {
    this.commands.delete(id);
  }

  get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  search(query: string): Command[] {
    const lower = query.toLowerCase();
    return this.getAll().filter(cmd => 
      cmd.title.toLowerCase().includes(lower) ||
      cmd.id.toLowerCase().includes(lower)
    );
  }
}

export const commandRegistry = new CommandRegistryClass();
