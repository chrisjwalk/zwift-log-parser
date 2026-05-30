import React from 'react';
import { render } from 'ink-testing-library';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ZwiftLogParser } from '@zwift-log-parser/core';
import { App } from './App.js';

const defaultMetadata = { gameVersion: '1.0.0', device: 'PC' };
const defaultRoutes = [
  { name: 'Figure 8', startTime: '10:00:00', endTime: '10:30:00', distanceCm: 1000, elevationCm: 100 },
];
const defaultWorlds = [{ name: 'Watopia', activities: [{ name: 'Figure 8' }] }];
const allOptions = { fps: true, routes: true, metadata: true };

describe('App', () => {
  let mockMethods: ZwiftLogParser;
  let parserFactory: () => ZwiftLogParser;

  beforeEach(() => {
    mockMethods = {
      parseFile: vi.fn().mockReturnValue({ metadata: defaultMetadata, fps: [], routes: defaultRoutes }),
      readFile: vi.fn().mockReturnValue('raw log content'),
      parseWorlds: vi.fn().mockReturnValue(defaultWorlds),
      parseFpsPerWorld: vi.fn().mockReturnValue(new Map()),
      parseDevices: vi.fn().mockReturnValue([]),
      parseNetworkStats: vi.fn().mockReturnValue({ tcpDisconnects: 0, udpRxErrors: 0, udpTxErrors: 0 }),
      calculateFpsStats: vi.fn().mockReturnValue({ avg: 60, min: 55, max: 65, p1: 55, p95: 65, count: 10 }),
      downsampleData: vi.fn().mockImplementation((data: number[]) => data),
      calculateDuration: vi.fn().mockReturnValue('30m 0s'),
    } as unknown as ZwiftLogParser;
    parserFactory = () => mockMethods;
  });

  it('renders the Banner with the given version', () => {
    const { frames } = render(
      <App logfile="fake.log" options={allOptions} version="1.2.3" parserFactory={parserFactory} />,
    );
    expect(frames[0]).toContain('Zwift Log Parser v1.2.3');
  });

  it('renders error state when parseFile throws', () => {
    (mockMethods.parseFile as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('File not found');
    });
    const { frames } = render(
      <App logfile="bad.log" options={allOptions} version="1.0.0" parserFactory={parserFactory} />,
    );
    expect(frames[0]).toContain('Error:');
    expect(frames[0]).toContain('File not found');
  });

  it('renders error state when readFile throws', () => {
    (mockMethods.readFile as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Read failed');
    });
    const { frames } = render(
      <App logfile="bad.log" options={allOptions} version="1.0.0" parserFactory={parserFactory} />,
    );
    expect(frames[0]).toContain('Error:');
    expect(frames[0]).toContain('Read failed');
  });

  it('renders error state when parseWorlds throws', () => {
    (mockMethods.parseWorlds as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Worlds parse error');
    });
    const { frames } = render(
      <App logfile="bad.log" options={allOptions} version="1.0.0" parserFactory={parserFactory} />,
    );
    expect(frames[0]).toContain('Error:');
    expect(frames[0]).toContain('Worlds parse error');
  });

  it('renders MetadataPanel when metadata option is true', () => {
    const { frames } = render(
      <App logfile="fake.log" options={allOptions} version="1.0.0" parserFactory={parserFactory} />,
    );
    expect(frames[0]).toContain('Session Information');
  });

  it('hides MetadataPanel when metadata option is false', () => {
    const { frames } = render(
      <App logfile="fake.log" options={{ ...allOptions, metadata: false }} version="1.0.0" parserFactory={parserFactory} />,
    );
    expect(frames[0]).not.toContain('Session Information');
  });

  it('renders WorldsPanel when routes option is true and worlds exist', () => {
    const { frames } = render(
      <App logfile="fake.log" options={allOptions} version="1.0.0" parserFactory={parserFactory} />,
    );
    expect(frames[0]).toContain('Worlds');
  });

  it('hides WorldsPanel when routes option is false', () => {
    const { frames } = render(
      <App logfile="fake.log" options={{ ...allOptions, routes: false }} version="1.0.0" parserFactory={parserFactory} />,
    );
    expect(frames[0]).not.toContain('Worlds');
  });

  it('shows "No route/world data found" when routes is empty and worlds is empty', () => {
    (mockMethods.parseFile as ReturnType<typeof vi.fn>).mockReturnValue({
      metadata: defaultMetadata,
      fps: [],
      routes: [],
    });
    (mockMethods.parseWorlds as ReturnType<typeof vi.fn>).mockReturnValue([]);
    const { frames } = render(
      <App logfile="fake.log" options={{ ...allOptions, routes: true }} version="1.0.0" parserFactory={parserFactory} />,
    );
    expect(frames[0]).toContain('No route/world data found');
  });

  it('does not call parseFpsPerWorld when fps option is false', () => {
    render(
      <App logfile="fake.log" options={{ ...allOptions, fps: false }} version="1.0.0" parserFactory={parserFactory} />,
    );
    expect(mockMethods.parseFpsPerWorld).not.toHaveBeenCalled();
  });

  it('calls parseFpsPerWorld with raw content when fps option is true', () => {
    render(
      <App logfile="fake.log" options={{ ...allOptions, fps: true }} version="1.0.0" parserFactory={parserFactory} />,
    );
    expect(mockMethods.parseFpsPerWorld).toHaveBeenCalledWith('raw log content');
  });

  it('always calls parseWorlds regardless of routes option', () => {
    render(
      <App logfile="fake.log" options={{ ...allOptions, routes: false }} version="1.0.0" parserFactory={parserFactory} />,
    );
    expect(mockMethods.parseWorlds).toHaveBeenCalled();
  });

  it('renders session duration in MetadataPanel when FPS entries exist', () => {
    (mockMethods.parseFile as ReturnType<typeof vi.fn>).mockReturnValue({
      metadata: defaultMetadata,
      fps: [
        { timestamp: '10:00:00', fps: 60, value1: 0, value2: 0, value3: 0 },
        { timestamp: '11:37:00', fps: 60, value1: 0, value2: 0, value3: 0 },
      ],
      routes: defaultRoutes,
    });
    (mockMethods.calculateDuration as ReturnType<typeof vi.fn>).mockReturnValue('1 hr 37 mins');
    const { frames } = render(
      <App logfile="fake.log" options={allOptions} version="1.0.0" parserFactory={parserFactory} />,
    );
    expect(frames[0]).toContain('Duration:');
    expect(frames[0]).toContain('1 hr 37 mins');
  });

  it('calls parseFile and readFile with the provided logfile path', () => {
    render(
      <App logfile="/path/to/Log.txt" options={allOptions} version="1.0.0" parserFactory={parserFactory} />,
    );
    expect(mockMethods.parseFile).toHaveBeenCalledWith('/path/to/Log.txt');
    expect(mockMethods.readFile).toHaveBeenCalledWith('/path/to/Log.txt');
  });

  it('renders DevicesPanel when devices are returned', () => {
    (mockMethods.parseDevices as ReturnType<typeof vi.fn>).mockReturnValue([
      { name: 'Wahoo KICKR B087', roles: ['Power', 'Cadence'] },
    ]);
    const { frames } = render(
      <App logfile="fake.log" options={allOptions} version="1.0.0" parserFactory={parserFactory} />,
    );
    expect(frames[0]).toContain('Wahoo KICKR B087');
    expect(frames[0]).toContain('Power, Cadence');
  });

  it('hides DevicesPanel when no devices are returned', () => {
    (mockMethods.parseDevices as ReturnType<typeof vi.fn>).mockReturnValue([]);
    const { frames } = render(
      <App logfile="fake.log" options={allOptions} version="1.0.0" parserFactory={parserFactory} />,
    );
    expect(frames[0]).not.toContain('Devices');
  });

  it('renders network stats in MetadataPanel', () => {
    (mockMethods.parseNetworkStats as ReturnType<typeof vi.fn>).mockReturnValue({
      tcpDisconnects: 2,
      udpRxErrors: 0,
      udpTxErrors: 0,
    });
    const { frames } = render(
      <App logfile="fake.log" options={allOptions} version="1.0.0" parserFactory={parserFactory} />,
    );
    expect(frames[0]).toContain('Network');
    expect(frames[0]).toContain('TCP Disconnects:');
  });
});
