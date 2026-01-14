import * as fs from 'fs';
import * as path from 'path';
import { select, input } from '@inquirer/prompts';
import chalk from 'chalk';

export interface FilePickerOptions {
  /**
   * Starting directory for file browsing
   * @default process.cwd()
   */
  startDir?: string;
  
  /**
   * File extensions to filter (e.g., ['.log', '.txt'])
   * @default ['.log', '.txt']
   */
  fileExtensions?: string[];
  
  /**
   * Message to display in the file picker
   * @default 'Select a log file'
   */
  message?: string;
  
  /**
   * Number of items to show per page
   * @default 15
   */
  pageSize?: number;
  
  /**
   * Default path for manual entry
   * @default './Log.txt'
   */
  defaultPath?: string;
}

/**
 * Interactive file picker that allows browsing directories and selecting files
 * @param options Configuration options for the file picker
 * @returns Selected file path or null if cancelled
 */
export async function pickFile(options: FilePickerOptions = {}): Promise<string | null> {
  const {
    startDir = process.cwd(),
    fileExtensions = ['.log', '.txt'],
    message = 'Select a log file',
    pageSize = 15,
    defaultPath = './Log.txt'
  } = options;

  try {
    let currentDir = startDir;

    while (true) {
      // Get current directory contents
      const items = fs.readdirSync(currentDir, { withFileTypes: true });
      
      // Filter and format items
      const choices = [
        { name: chalk.dim('.. (parent directory)'), value: '..' },
        { name: chalk.cyan('📝 Enter path manually'), value: '__manual__' },
        { name: '─'.repeat(50), value: '__separator__', disabled: true },
        ...items
          .filter(item => {
            // Show directories and files with matching extensions
            if (item.isDirectory()) return true;
            return fileExtensions.some(ext => item.name.endsWith(ext));
          })
          .sort((a, b) => {
            // Directories first, then files
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
          })
          .map(item => ({
            name: item.isDirectory() 
              ? chalk.blue(`📁 ${item.name}/`)
              : chalk.white(`📄 ${item.name}`),
            value: item.name
          }))
      ];

      const selectedPath = await select({
        message: `${message} (${chalk.dim(currentDir)}):`,
        choices,
        pageSize
      });

      // Handle manual entry
      if (selectedPath === '__manual__') {
        const manualPath = await input({
          message: 'Enter the path to your file:',
          default: defaultPath,
          validate: (value: string) => {
            if (!value.trim()) {
              return 'Please provide a file path';
            }
            return true;
          }
        });
        return manualPath;
      } else if (selectedPath === '..') {
        // Navigate to parent directory
        const parentDir = path.dirname(currentDir);
        if (parentDir !== currentDir) { // Prevent going above root
          currentDir = parentDir;
        }
      } else {
        const fullPath = path.join(currentDir, selectedPath);
        
        // If directory selected, navigate into it
        if (fs.statSync(fullPath).isDirectory()) {
          currentDir = fullPath;
        } else {
          // File selected, return it
          return fullPath;
        }
      }
    }
  } catch {
    // User cancelled (Ctrl+C) or other error
    return null;
  }

  return null;
}
