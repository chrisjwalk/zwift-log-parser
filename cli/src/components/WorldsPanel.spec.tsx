import React from 'react';
import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import type { WorldSession } from '@zwift-log-parser/core';
import { WorldsPanel } from './WorldsPanel.js';

describe('WorldsPanel', () => {
  it('renders section title', () => {
    const worlds: WorldSession[] = [{ name: 'Watopia', activities: [] }];
    const { lastFrame } = render(<WorldsPanel worlds={worlds} />);
    expect(lastFrame()).toContain('Worlds');
  });

  it('renders a single world with activities', () => {
    const worlds: WorldSession[] = [
      {
        name: 'Watopia',
        activities: [
          { name: 'Figure 8', startTime: '10:00:00', endTime: '10:30:00' },
          { name: 'Volcano Circuit', startTime: '10:30:00', endTime: '11:00:00' },
        ],
      },
    ];
    const { lastFrame } = render(<WorldsPanel worlds={worlds} />);
    const frame = lastFrame()!;
    expect(frame).toContain('Watopia');
    expect(frame).toContain('Figure 8');
    expect(frame).toContain('Volcano Circuit');
  });

  it('renders multiple worlds', () => {
    const worlds: WorldSession[] = [
      { name: 'Watopia', activities: [{ name: 'Figure 8' }] },
      { name: 'London', activities: [{ name: 'Classique' }] },
    ];
    const { lastFrame } = render(<WorldsPanel worlds={worlds} />);
    const frame = lastFrame()!;
    expect(frame).toContain('Watopia');
    expect(frame).toContain('Figure 8');
    expect(frame).toContain('London');
    expect(frame).toContain('Classique');
  });

  it('deduplicates repeated activity names within a world', () => {
    const worlds: WorldSession[] = [
      {
        name: 'Watopia',
        activities: [{ name: 'Figure 8' }, { name: 'Figure 8' }, { name: 'Figure 8' }],
      },
    ];
    const { lastFrame } = render(<WorldsPanel worlds={worlds} />);
    const frame = lastFrame()!;
    const occurrences = (frame.match(/Figure 8/g) ?? []).length;
    expect(occurrences).toBe(1);
  });

  it('renders a world with no activities without crashing', () => {
    const worlds: WorldSession[] = [{ name: 'Makuri Islands', activities: [] }];
    const { lastFrame } = render(<WorldsPanel worlds={worlds} />);
    expect(lastFrame()).toContain('Makuri Islands');
  });
});
