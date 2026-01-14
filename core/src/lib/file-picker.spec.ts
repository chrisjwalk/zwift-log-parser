import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pickFile } from './file-picker';
import * as fs from 'fs';
import * as path from 'path';
import * as inquirer from '@inquirer/prompts';

// Mock the modules
vi.mock('fs');
vi.mock('@inquirer/prompts');

describe('pickFile', () => {
  const mockReaddirSync = vi.mocked(fs.readdirSync) as ReturnType<typeof vi.mocked<typeof fs.readdirSync>>;
  const mockStatSync = vi.mocked(fs.statSync);
  const mockSelect = vi.mocked(inquirer.select) as ReturnType<typeof vi.mocked<typeof inquirer.select>>;
  const mockInput = vi.mocked(inquirer.input) as ReturnType<typeof vi.mocked<typeof inquirer.input>>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return selected file path', async () => {
    const testDir = '/test/dir';
    const mockDirEntry = {
      name: 'test.log',
      isDirectory: () => false,
      isFile: () => true,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isFIFO: () => false,
      isSocket: () => false,
      isSymbolicLink: () => false,
    } as fs.Dirent;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockReaddirSync.mockReturnValue([mockDirEntry] as any);
    mockStatSync.mockReturnValue({ isDirectory: () => false } as fs.Stats);
    mockSelect.mockResolvedValue('test.log');

    const result = await pickFile({ startDir: testDir });

    expect(result).toBe(path.join(testDir, 'test.log'));
    expect(mockReaddirSync).toHaveBeenCalledWith(testDir, { withFileTypes: true });
  });

  it('should navigate into directory and then select file', async () => {
    const testDir = '/test/dir';
    const mockDirEntry = {
      name: 'subdir',
      isDirectory: () => true,
      isFile: () => false,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isFIFO: () => false,
      isSocket: () => false,
      isSymbolicLink: () => false,
    } as fs.Dirent;
    
    const mockFileEntry = {
      name: 'file.txt',
      isDirectory: () => false,
      isFile: () => true,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isFIFO: () => false,
      isSocket: () => false,
      isSymbolicLink: () => false,
    } as fs.Dirent;

    mockReaddirSync
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValueOnce([mockDirEntry] as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValueOnce([mockFileEntry] as any);
    
    mockStatSync
      .mockReturnValueOnce({ isDirectory: () => true } as fs.Stats)
      .mockReturnValueOnce({ isDirectory: () => false } as fs.Stats);
    
    mockSelect
      .mockResolvedValueOnce('subdir')
      .mockResolvedValueOnce('file.txt');

    const result = await pickFile({ startDir: testDir });

    expect(result).toBe(path.join(testDir, 'subdir', 'file.txt'));
    expect(mockReaddirSync).toHaveBeenCalledTimes(2);
  });

  it('should navigate to parent directory', async () => {
    const testDir = '/test/dir/subdir';
    const parentDir = '/test/dir';
    
    const mockFileEntry = {
      name: 'file.log',
      isDirectory: () => false,
      isFile: () => true,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isFIFO: () => false,
      isSocket: () => false,
      isSymbolicLink: () => false,
    } as fs.Dirent;

    mockReaddirSync
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValueOnce([mockFileEntry] as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValueOnce([mockFileEntry] as any);
    
    mockStatSync.mockReturnValue({ isDirectory: () => false } as fs.Stats);
    
    mockSelect
      .mockResolvedValueOnce('..')
      .mockResolvedValueOnce('file.log');

    const result = await pickFile({ startDir: testDir });

    expect(result).toBe(path.join(parentDir, 'file.log'));
    expect(mockReaddirSync).toHaveBeenCalledWith(testDir, { withFileTypes: true });
    expect(mockReaddirSync).toHaveBeenCalledWith(parentDir, { withFileTypes: true });
  });

  it('should handle manual path entry', async () => {
    const testDir = '/test/dir';
    const manualPath = '/custom/path/file.log';
    
    mockReaddirSync.mockReturnValue([]);
    mockSelect.mockResolvedValue('__manual__');
    mockInput.mockResolvedValue(manualPath);

    const result = await pickFile({ startDir: testDir });

    expect(result).toBe(manualPath);
    expect(mockInput).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Enter the path to your file:',
        default: './Log.txt',
      })
    );
  });

  it('should use custom defaultPath for manual entry', async () => {
    const testDir = '/test/dir';
    const customDefault = './custom/default.log';
    
    mockReaddirSync.mockReturnValue([]);
    mockSelect.mockResolvedValue('__manual__');
    mockInput.mockResolvedValue('/some/path.log');

    await pickFile({ startDir: testDir, defaultPath: customDefault });

    expect(mockInput).toHaveBeenCalledWith(
      expect.objectContaining({
        default: customDefault,
      })
    );
  });

  it('should filter files by extensions', async () => {
    const testDir = '/test/dir';
    
    const mockEntries = [
      { name: 'file.log', isDirectory: () => false },
      { name: 'file.txt', isDirectory: () => false },
      { name: 'file.pdf', isDirectory: () => false },
      { name: 'dir', isDirectory: () => true },
    ] as fs.Dirent[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockReaddirSync.mockReturnValue(mockEntries as any);
    mockStatSync.mockReturnValue({ isDirectory: () => false } as fs.Stats);
    mockSelect.mockResolvedValue('file.log');

    await pickFile({ 
      startDir: testDir, 
      fileExtensions: ['.log', '.txt'] 
    });

    // Verify select was called with choices containing only .log, .txt files and directories
    const selectCall = mockSelect.mock.calls[0][0];
    const choices = selectCall.choices as Array<{ name: string; value: string; disabled?: boolean }>;
    
    // Should have: .., manual entry, separator, dir, file.log, file.txt (not file.pdf)
    const fileChoices = choices.filter((c) => 
      !['..', '__manual__', '__separator__'].includes(c.value)
    );
    
    expect(fileChoices).toHaveLength(3); // dir, file.log, file.txt
    expect(fileChoices.some((c) => c.value === 'file.pdf')).toBe(false);
  });

  it('should return null when user cancels', async () => {
    const testDir = '/test/dir';
    
    mockReaddirSync.mockReturnValue([]);
    mockSelect.mockRejectedValue(new Error('User cancelled'));

    const result = await pickFile({ startDir: testDir });

    expect(result).toBeNull();
  });

  it('should use custom message and pageSize', async () => {
    const testDir = '/test/dir';
    const customMessage = 'Choose your file';
    const customPageSize = 20;
    
    mockReaddirSync.mockReturnValue([]);
    mockSelect.mockResolvedValue('__manual__');
    mockInput.mockResolvedValue('/path/to/file');

    await pickFile({ 
      startDir: testDir,
      message: customMessage,
      pageSize: customPageSize
    });

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(customMessage),
        pageSize: customPageSize,
      })
    );
  });

  it('should sort directories before files alphabetically', async () => {
    const testDir = '/test/dir';
    
    const mockEntries = [
      { name: 'z-file.log', isDirectory: () => false },
      { name: 'a-dir', isDirectory: () => true },
      { name: 'b-file.txt', isDirectory: () => false },
      { name: 'c-dir', isDirectory: () => true },
    ] as fs.Dirent[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockReaddirSync.mockReturnValue(mockEntries as any);
    mockStatSync.mockReturnValue({ isDirectory: () => false } as fs.Stats);
    mockSelect.mockResolvedValue('z-file.log');

    await pickFile({ startDir: testDir });

    const selectCall = mockSelect.mock.calls[0][0];
    const choices = selectCall.choices as Array<{ name: string; value: string; disabled?: boolean }>;
    const fileChoices = choices.filter((c) => 
      !['..', '__manual__', '__separator__'].includes(c.value)
    );

    // Directories should come first: a-dir, c-dir, then files: b-file.txt, z-file.log
    expect(fileChoices[0].value).toBe('a-dir');
    expect(fileChoices[1].value).toBe('c-dir');
    expect(fileChoices[2].value).toBe('b-file.txt');
    expect(fileChoices[3].value).toBe('z-file.log');
  });

  it('should not navigate above root directory', async () => {
    const rootDir = '/';
    
    const mockFileEntry = {
      name: 'file.log',
      isDirectory: () => false,
      isFile: () => true,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isFIFO: () => false,
      isSocket: () => false,
      isSymbolicLink: () => false,
    } as fs.Dirent;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockReaddirSync.mockReturnValue([mockFileEntry] as any);
    mockStatSync.mockReturnValue({ isDirectory: () => false } as fs.Stats);
    
    mockSelect
      .mockResolvedValueOnce('..')  // Try to go above root
      .mockResolvedValueOnce('file.log');

    const result = await pickFile({ startDir: rootDir });

    // Should stay at root and select file
    expect(result).toBe(path.join(rootDir, 'file.log'));
    expect(mockReaddirSync).toHaveBeenCalledWith(rootDir, { withFileTypes: true });
  });
});
