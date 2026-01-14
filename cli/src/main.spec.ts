import { describe, it, expect, vi } from 'vitest';

describe('CLI', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should be able to import from core', async () => {
    const { ZwiftLogParser } = await import('@zwift-log-parser/core');
    expect(ZwiftLogParser).toBeDefined();
    const parser = new ZwiftLogParser();
    expect(parser).toBeInstanceOf(ZwiftLogParser);
  });
});
