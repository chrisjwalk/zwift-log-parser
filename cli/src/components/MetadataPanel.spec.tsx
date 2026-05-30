import React from 'react';
import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import type { LogMetadata } from '@zwift-log-parser/core';
import { MetadataPanel } from './MetadataPanel.js';

describe('MetadataPanel', () => {
  const fullMetadata: LogMetadata = {
    logTime: '10:00:00 2024-01-15',
    gameVersion: '1.2.3.4',
    device: 'PC',
    config: 'Ultra',
    launcherVersion: '3.5.0',
    gpu: 'NVIDIA RTX 3080',
    gpuDriver: '551.86',
    cpu: 'Intel i9-13900K',
    ram: '32GB',
    resolution: '2560x1440',
    shadowResolution: '2048',
    graphicsProfile: 'Ultra',
  };

  it('renders all metadata fields when provided', () => {
    const { lastFrame } = render(<MetadataPanel metadata={fullMetadata} />);
    const frame = lastFrame()!;
    expect(frame).toContain('10:00:00 2024-01-15');
    expect(frame).toContain('1.2.3.4');
    expect(frame).toContain('PC');
    expect(frame).toContain('3.5.0');
    expect(frame).toContain('NVIDIA RTX 3080');
    expect(frame).toContain('551.86');
    expect(frame).toContain('Intel i9-13900K');
    expect(frame).toContain('32GB');
    expect(frame).toContain('2560x1440');
    expect(frame).toContain('2048');
  });

  it('renders section headers', () => {
    const { lastFrame } = render(<MetadataPanel metadata={fullMetadata} />);
    const frame = lastFrame()!;
    expect(frame).toContain('Session Information');
    expect(frame).toContain('System Information');
  });

  it('omits rows with undefined values', () => {
    const { lastFrame } = render(<MetadataPanel metadata={{ gameVersion: '1.0.0' }} />);
    const frame = lastFrame()!;
    expect(frame).toContain('1.0.0');
    expect(frame).not.toContain('NVIDIA');
    expect(frame).not.toContain('Intel');
  });

  it('omits rows with empty string values', () => {
    const { lastFrame } = render(<MetadataPanel metadata={{ gpu: '', gameVersion: '2.0.0' }} />);
    const frame = lastFrame()!;
    expect(frame).toContain('2.0.0');
    // Empty string is falsy — MetaRow returns null and the label should not appear
    expect(frame).not.toContain('GPU:');
  });

  it('renders duration when provided', () => {
    const { lastFrame } = render(<MetadataPanel metadata={fullMetadata} duration="1 hr 37 mins" />);
    const frame = lastFrame()!;
    expect(frame).toContain('Duration:');
    expect(frame).toContain('1 hr 37 mins');
  });

  it('omits duration row when not provided', () => {
    const { lastFrame } = render(<MetadataPanel metadata={fullMetadata} />);
    const frame = lastFrame()!;
    expect(frame).not.toContain('Duration:');
  });

  it('renders with completely empty metadata without crashing', () => {
    const { lastFrame } = render(<MetadataPanel metadata={{}} />);
    const frame = lastFrame()!;
    expect(frame).toContain('Session Information');
    expect(frame).toContain('System Information');
  });

  it('renders network stats section when networkStats is provided', () => {
    const { lastFrame } = render(
      <MetadataPanel
        metadata={fullMetadata}
        networkStats={{ tcpDisconnects: 1, udpRxErrors: 0, udpTxErrors: 0 }}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain('Network');
    expect(frame).toContain('TCP Disconnects:');
    expect(frame).toContain('UDP Rx Errors:');
    expect(frame).toContain('UDP Tx Errors:');
  });

  it('omits network section when networkStats is not provided', () => {
    const { lastFrame } = render(<MetadataPanel metadata={fullMetadata} />);
    const frame = lastFrame()!;
    expect(frame).not.toContain('TCP Disconnects:');
  });

  it('shows network values including non-zero TCP disconnects', () => {
    const { lastFrame } = render(
      <MetadataPanel
        metadata={fullMetadata}
        networkStats={{ tcpDisconnects: 3, udpRxErrors: 5, udpTxErrors: 2 }}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain('3');
    expect(frame).toContain('5');
    expect(frame).toContain('2');
  });
});
