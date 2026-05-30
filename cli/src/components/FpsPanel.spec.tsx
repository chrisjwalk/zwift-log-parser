import React from 'react';
import { render } from 'ink-testing-library';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import type { FPSEntry, WorldSession } from '@zwift-log-parser/core';
import { ZwiftLogParser } from '@zwift-log-parser/core';
import { FpsPanel, type WorldFpsData } from './FpsPanel.js';

describe('FpsPanel', () => {
  const parser = new ZwiftLogParser();

  const originalColumns = Object.getOwnPropertyDescriptor(process.stdout, 'columns');

  beforeEach(() => {
    Object.defineProperty(process.stdout, 'columns', {
      value: 80,
      configurable: true,
    });
  });

  afterEach(() => {
    if (originalColumns) {
      Object.defineProperty(process.stdout, 'columns', originalColumns);
    }
  });

  const makeFpsEntries = (count: number, fps = 60): FPSEntry[] =>
    Array.from({ length: count }, (_, i) => ({
      timestamp: `10:00:${String(i).padStart(2, '0')}`,
      fps,
      value1: 0,
      value2: 0,
      value3: 0,
    }));

  it('shows empty state when there are no FPS entries', () => {
    const { lastFrame } = render(
      <FpsPanel entries={[]} worlds={[]} worldFpsMap={new Map()} parser={parser} />,
    );
    expect(lastFrame()).toContain('No FPS entries found');
  });

  it('renders world name, chart, and stats for a world with FPS data', () => {
    const entries = makeFpsEntries(10);
    const worlds: WorldSession[] = [{ name: 'Watopia', activities: [] }];
    const worldFpsMap = new Map<string, WorldFpsData>([
      ['Watopia', { fps: entries.map((e) => e.fps), startTime: '10:00:00', endTime: '10:00:09' }],
    ]);

    const { lastFrame } = render(
      <FpsPanel entries={entries} worlds={worlds} worldFpsMap={worldFpsMap} parser={parser} />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain('Watopia');
    expect(frame).toContain('Average');
    expect(frame).toContain('Min');
    expect(frame).toContain('Max');
    expect(frame).toContain('Time:');
  });

  it('shows duration as "unknown" when startTime/endTime are absent', () => {
    const entries = makeFpsEntries(3);
    const worlds: WorldSession[] = [{ name: 'Watopia', activities: [] }];
    const worldFpsMap = new Map<string, WorldFpsData>([['Watopia', { fps: [60, 60, 60] }]]);

    const { lastFrame } = render(
      <FpsPanel entries={entries} worlds={worlds} worldFpsMap={worldFpsMap} parser={parser} />,
    );
    expect(lastFrame()).toContain('unknown');
  });

  it('shows "No FPS data available" for a world not in worldFpsMap', () => {
    const entries = makeFpsEntries(1);
    const worlds: WorldSession[] = [{ name: 'London', activities: [] }];

    const { lastFrame } = render(
      <FpsPanel entries={entries} worlds={worlds} worldFpsMap={new Map()} parser={parser} />,
    );
    expect(lastFrame()).toContain('London — No FPS data available');
  });

  it('shows "No FPS data available" for a world with an empty fps array', () => {
    const entries = makeFpsEntries(1);
    const worlds: WorldSession[] = [{ name: 'Watopia', activities: [] }];
    const worldFpsMap = new Map<string, WorldFpsData>([['Watopia', { fps: [] }]]);

    const { lastFrame } = render(
      <FpsPanel entries={entries} worlds={worlds} worldFpsMap={worldFpsMap} parser={parser} />,
    );
    expect(lastFrame()).toContain('Watopia — No FPS data available');
  });

  it('shows "Overall FPS" section when there are multiple worlds', () => {
    const entries = makeFpsEntries(5);
    const worlds: WorldSession[] = [
      { name: 'Watopia', activities: [] },
      { name: 'London', activities: [] },
    ];
    const worldFpsMap = new Map<string, WorldFpsData>([
      ['Watopia', { fps: [60, 60, 60], startTime: '10:00:00', endTime: '10:00:02' }],
      ['London', { fps: [55, 58, 60], startTime: '10:00:03', endTime: '10:00:05' }],
    ]);

    const { lastFrame } = render(
      <FpsPanel entries={entries} worlds={worlds} worldFpsMap={worldFpsMap} parser={parser} />,
    );
    expect(lastFrame()).toContain('Overall FPS');
  });

  it('does not show "Overall FPS" section for a single world', () => {
    const entries = makeFpsEntries(5);
    const worlds: WorldSession[] = [{ name: 'Watopia', activities: [] }];
    const worldFpsMap = new Map<string, WorldFpsData>([
      ['Watopia', { fps: [60, 60, 60], startTime: '10:00:00', endTime: '10:00:02' }],
    ]);

    const { lastFrame } = render(
      <FpsPanel entries={entries} worlds={worlds} worldFpsMap={worldFpsMap} parser={parser} />,
    );
    expect(lastFrame()).not.toContain('Overall FPS');
  });

  it('renders FPS Analysis section heading', () => {
    const entries = makeFpsEntries(3);
    const worlds: WorldSession[] = [{ name: 'Watopia', activities: [] }];
    const worldFpsMap = new Map<string, WorldFpsData>([
      ['Watopia', { fps: [60, 60, 60], startTime: '10:00:00', endTime: '10:00:02' }],
    ]);

    const { lastFrame } = render(
      <FpsPanel entries={entries} worlds={worlds} worldFpsMap={worldFpsMap} parser={parser} />,
    );
    expect(lastFrame()).toContain('FPS Analysis');
  });
});
