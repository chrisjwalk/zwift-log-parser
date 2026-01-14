import { describe, it, expect } from 'vitest';
import { ZwiftLogParser } from './parser';

describe('ZwiftLogParser', () => {
  const parser = new ZwiftLogParser();

  describe('parseMetadata', () => {
    it('should extract log time from content', () => {
      const content = '[12:34:56] Log Time: 14:30:45 2026-01-14';
      const metadata = parser.parseMetadata(content);
      expect(metadata.logTime).toBe('14:30:45 2026-01-14');
    });

    it('should extract game version', () => {
      const content = '[12:34:56] Game Version: 1.104.4(157262) rc/1.104.4';
      const metadata = parser.parseMetadata(content);
      expect(metadata.gameVersion).toBe('1.104.4(157262) rc/1.104.4');
    });

    it('should extract device', () => {
      const content = '[12:34:56] Device: PC';
      const metadata = parser.parseMetadata(content);
      expect(metadata.device).toBe('PC');
    });

    it('should extract GPU info', () => {
      const content = 'Graphics Renderer: NVIDIA GeForce RTX 3080';
      const metadata = parser.parseMetadata(content);
      expect(metadata.gpu).toBe('NVIDIA GeForce RTX 3080');
    });
  });

  describe('parseFPSLines', () => {
    it('should parse FPS entries', () => {
      const content = `[12:34:56] FPS 60.5, 100, 200, 300
[12:34:57] FPS 58.2, 150, 250, 350`;
      const entries = parser.parseFPSLines(content);
      expect(entries).toHaveLength(2);
      expect(entries[0]).toEqual({
        timestamp: '12:34:56',
        fps: 60.5,
        value1: 100,
        value2: 200,
        value3: 300,
      });
    });

    it('should return empty array when no FPS entries', () => {
      const content = 'No FPS data here';
      const entries = parser.parseFPSLines(content);
      expect(entries).toHaveLength(0);
    });
  });

  describe('downsampleData', () => {
    it('should return original data if length is less than target', () => {
      const data = [1, 2, 3];
      const result = parser.downsampleData(data, 10);
      expect(result).toEqual(data);
    });

    it('should downsample data to target width', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = parser.downsampleData(data, 5);
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe('calculateFpsStats', () => {
    it('should calculate average, min, and max', () => {
      const fpsValues = [50, 60, 70];
      const stats = parser.calculateFpsStats(fpsValues);
      expect(stats.avg).toBe(60);
      expect(stats.min).toBe(50);
      expect(stats.max).toBe(70);
    });

    it('should return zeros for empty array', () => {
      const stats = parser.calculateFpsStats([]);
      expect(stats.avg).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
    });
  });

  describe('formatDistance', () => {
    it('should format distance in kilometers when >= 1km', () => {
      const result = parser.formatDistance(100000); // 1000m = 1km
      expect(result).toBe('1.00 km');
    });

    it('should format distance in meters when < 1km', () => {
      const result = parser.formatDistance(50000); // 500m
      expect(result).toBe('500 m');
    });
  });

  describe('formatElevation', () => {
    it('should format elevation in meters', () => {
      const result = parser.formatElevation(15000); // 150m
      expect(result).toBe('150 m');
    });
  });

  describe('timeToSeconds', () => {
    it('should convert time string to seconds', () => {
      const result = parser.timeToSeconds('01:30:45');
      expect(result).toBe(5445); // 1*3600 + 30*60 + 45
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration between two times', () => {
      const result = parser.calculateDuration('12:00:00', '12:30:45');
      expect(result).toBe('30m 45s');
    });

    it('should handle hour duration', () => {
      const result = parser.calculateDuration('12:00:00', '13:15:30');
      expect(result).toBe('1h 15m 30s');
    });

    it('should handle day boundary', () => {
      const result = parser.calculateDuration('23:50:00', '00:10:00');
      expect(result).toBe('20m 0s');
    });
  });
});
