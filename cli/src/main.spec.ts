import { describe, expect, it } from 'vitest';
import { ZwiftLogParser } from '@zwift-log-parser/core';

describe('CLI', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should be able to import from core', () => {
    expect(ZwiftLogParser).toBeDefined();
    const parser = new ZwiftLogParser();
    expect(parser).toBeInstanceOf(ZwiftLogParser);
  });
});
