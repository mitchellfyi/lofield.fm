/**
 * Command registry for the command palette
 * Provides a centralized list of all available commands with their handlers
 */

export interface Command {
  id: string;
  name: string;
  shortcut?: string;
  section: "playback" | "file" | "edit" | "view" | "navigation";
  handler: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export type CommandHandler = () => void;

export interface CommandRegistry {
  commands: Command[];
  registerCommand: (command: Command) => void;
  unregisterCommand: (id: string) => void;
  getCommand: (id: string) => Command | undefined;
  executeCommand: (id: string) => boolean;
}

/**
 * Create a new command registry instance
 */
export function createCommandRegistry(): CommandRegistry {
  const commands: Command[] = [];

  return {
    commands,

    registerCommand(command: Command) {
      // Remove existing command with same ID if present
      const existingIndex = commands.findIndex((c) => c.id === command.id);
      if (existingIndex >= 0) {
        commands.splice(existingIndex, 1);
      }
      commands.push(command);
    },

    unregisterCommand(id: string) {
      const index = commands.findIndex((c) => c.id === id);
      if (index >= 0) {
        commands.splice(index, 1);
      }
    },

    getCommand(id: string) {
      return commands.find((c) => c.id === id);
    },

    executeCommand(id: string) {
      const command = commands.find((c) => c.id === id);
      if (command && !command.disabled) {
        command.handler();
        return true;
      }
      return false;
    },
  };
}

/**
 * Section display names
 */
export const SECTION_LABELS: Record<Command["section"], string> = {
  playback: "Playback",
  file: "File",
  edit: "Edit",
  view: "View",
  navigation: "Navigation",
};

/**
 * Fuzzy search commands by name
 */
export function searchCommands(commands: Command[], query: string): Command[] {
  if (!query.trim()) return commands;

  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/);

  return commands
    .filter((command) => {
      const name = command.name.toLowerCase();
      // Match if all query words appear in the command name
      return queryWords.every((word) => name.includes(word));
    })
    .sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      // Prioritize commands that start with the query
      const aStarts = aName.startsWith(lowerQuery);
      const bStarts = bName.startsWith(lowerQuery);
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;
      return a.name.localeCompare(b.name);
    });
}
