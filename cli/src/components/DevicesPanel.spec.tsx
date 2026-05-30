import React from 'react';
import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import type { PairedDevice } from '@zwift-log-parser/core';
import { DevicesPanel } from './DevicesPanel.js';

describe('DevicesPanel', () => {
  const devices: PairedDevice[] = [
    { name: 'Wahoo KICKR B087', roles: ['Power', 'Cadence', 'Controllable Trainer'] },
    { name: 'Zwift Ride 3A16', roles: ['ZP User Input'] },
    { name: 'Zwift Click C865', roles: ['Virtual Shifter Input'] },
  ];

  it('renders nothing when devices array is empty', () => {
    const { lastFrame } = render(<DevicesPanel devices={[]} />);
    const frame = lastFrame()!;
    expect(frame.trim()).toBe('');
  });

  it('renders the section header when devices are present', () => {
    const { lastFrame } = render(<DevicesPanel devices={devices} />);
    expect(lastFrame()).toContain('Devices');
  });

  it('renders all device names', () => {
    const { lastFrame } = render(<DevicesPanel devices={devices} />);
    const frame = lastFrame()!;
    expect(frame).toContain('Wahoo KICKR B087');
    expect(frame).toContain('Zwift Ride 3A16');
    expect(frame).toContain('Zwift Click C865');
  });

  it('renders roles joined by comma', () => {
    const { lastFrame } = render(<DevicesPanel devices={devices} />);
    const frame = lastFrame()!;
    expect(frame).toContain('Power, Cadence, Controllable Trainer');
    expect(frame).toContain('ZP User Input');
    expect(frame).toContain('Virtual Shifter Input');
  });

  it('renders a single device with a single role', () => {
    const single: PairedDevice[] = [{ name: 'HR Strap 62300', roles: ['HR'] }];
    const { lastFrame } = render(<DevicesPanel devices={single} />);
    const frame = lastFrame()!;
    expect(frame).toContain('HR Strap 62300');
    expect(frame).toContain('HR');
  });
});
