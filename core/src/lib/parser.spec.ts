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

  describe('parseFpsPerWorld', () => {
    // Minimal log fragment helpers
    const worldLoad = (worldId: number) =>
      `[10:00:00] INFO LEVEL: [SaveActivityService] GameLoadLevel: Creating New Activity {worldId: ${worldId}}`;
    const saveActivity = (name: string) =>
      `[10:00:01] INFO LEVEL: [SaveActivityService] ZNet::SaveActivity calling zwift_network::save_activity with {name: Zwift - ${name}, uploadTo3P: True}`;
    const fpsLine = (time: string, fps: number) =>
      `[${time}] FPS ${fps.toFixed(2)}, 0, 0, 0`;

    it('groups FPS entries under the correct world name', () => {
      const content = [
        worldLoad(1),
        saveActivity('Triple Flat Loops in Watopia'),
        fpsLine('10:01:00', 90),
        fpsLine('10:02:00', 100),
        fpsLine('10:03:00', 110),
      ].join('\n');

      const result = parser.parseFpsPerWorld(content);
      expect(result.has('Watopia')).toBe(true);
      expect(result.get('Watopia')!.fps).toEqual([90, 100, 110]);
    });

    it('extracts world name from plain "WorldName" (no route prefix)', () => {
      const content = [
        worldLoad(2),
        saveActivity('Makuri Islands'),
        fpsLine('10:01:00', 60),
      ].join('\n');

      const result = parser.parseFpsPerWorld(content);
      // No "in " in activity name — world name falls back to the raw value
      expect(result.has('Makuri Islands')).toBe(true);
    });

    it('tracks multiple worlds separately', () => {
      const content = [
        worldLoad(1),
        saveActivity('Triple Flat Loops in Watopia'),
        fpsLine('10:01:00', 100),
        worldLoad(6),
        saveActivity('Chasing the Sun in Makuri Islands'),
        fpsLine('11:01:00', 80),
        fpsLine('11:02:00', 90),
      ].join('\n');

      const result = parser.parseFpsPerWorld(content);
      expect(result.get('Watopia')!.fps).toEqual([100]);
      expect(result.get('Makuri Islands')!.fps).toEqual([80, 90]);
    });

    it('records startTime and endTime correctly', () => {
      const content = [
        worldLoad(1),
        saveActivity('The Big Ring in Watopia'),
        fpsLine('10:00:00', 100),
        fpsLine('10:30:00', 110),
        fpsLine('11:00:00', 90),
      ].join('\n');

      const result = parser.parseFpsPerWorld(content);
      const data = result.get('Watopia')!;
      expect(data.startTime).toBe('10:00:00');
      expect(data.endTime).toBe('11:00:00');
    });

    it('falls back pre-world-load FPS entries to the first known world', () => {
      const content = [
        fpsLine('09:59:00', 60), // before any world load
        fpsLine('09:59:30', 70),
        worldLoad(1),
        saveActivity('Triple Flat Loops in Watopia'),
        fpsLine('10:01:00', 100),
      ].join('\n');

      const result = parser.parseFpsPerWorld(content);
      // All entries (including pre-load) should appear under Watopia
      expect(result.get('Watopia')!.fps).toEqual([60, 70, 100]);
    });

    it('returns empty map when no world loads are present', () => {
      const content = [
        fpsLine('10:00:00', 60),
        fpsLine('10:01:00', 70),
      ].join('\n');

      const result = parser.parseFpsPerWorld(content);
      expect(result.size).toBe(0);
    });

    it('returns empty map when no FPS entries are present', () => {
      const content = [
        worldLoad(1),
        saveActivity('Triple Flat Loops in Watopia'),
      ].join('\n');

      const result = parser.parseFpsPerWorld(content);
      expect(result.size).toBe(0);
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
