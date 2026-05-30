import React from 'react';
import { Box, Text } from 'ink';
import * as asciichart from 'asciichart';
import type { FPSEntry, FpsStats, WorldSession, ZwiftLogParser } from '@zwift-log-parser/core';
import { Section } from './Section.js';

export interface WorldFpsData {
  fps: number[];
  startTime?: string;
  endTime?: string;
}

interface FpsPanelProps {
  entries: FPSEntry[];
  worlds: WorldSession[];
  worldFpsMap: Map<string, WorldFpsData>;
  parser: ZwiftLogParser;
}

interface StatsRowProps {
  stats: FpsStats;
  duration?: string;
}

function StatsRow({ stats, duration }: StatsRowProps) {
  return (
    <Text>
      {'  '}
      {duration && (
        <>
          Time: <Text color="cyan">{duration}</Text>
          {' | '}
        </>
      )}
      Min: <Text color="red">{Math.round(stats.min)}</Text>
      {' | '}P1: <Text color="yellow">{Math.round(stats.p1)}</Text>
      {' | '}Avg: <Text color="green">{stats.avg.toFixed(1)}</Text>
      {' | '}P95: <Text color="cyan">{Math.round(stats.p95)}</Text>
      {' | '}Max: <Text color="green">{Math.round(stats.max)}</Text>
      {' | '}<Text dimColor>{stats.count} samples</Text>
    </Text>
  );
}

export function FpsPanel({ entries, worlds, worldFpsMap, parser }: FpsPanelProps) {
  if (entries.length === 0) {
    return (
      <Box marginTop={1}>
        <Text color="yellow">No FPS entries found in log file.</Text>
      </Box>
    );
  }

  const terminalWidth = process.stdout.columns || 80;
  const graphWidth = Math.min(terminalWidth - 10, 120);
  const fpsValues = entries.map((e) => e.fps);
  const fpsStats = parser.calculateFpsStats(fpsValues);

  const overallChart = asciichart.plot([parser.downsampleData(fpsValues, graphWidth)], {
    height: 20,
    min: Math.floor(fpsStats.min) - 5,
    max: Math.ceil(fpsStats.max) + 5,
  });

  // Build ordered union of world names: worlds first, then any worldFpsMap keys not already present
  const worldNames = [
    ...worlds.map((w) => w.name),
    ...[...worldFpsMap.keys()].filter((k) => !worlds.some((w) => w.name === k)),
  ];

  return (
    <Box flexDirection="column">
      {worldNames.length > 1 && (
        <Box flexDirection="column" marginBottom={1}>
          <Section title="Overall FPS Over Time" color="cyan" />
          <Text color="cyan">{overallChart}</Text>

          <Box marginTop={1}>
            <Section title="Overall FPS Statistics" color="magenta" />
          </Box>
          <StatsRow stats={fpsStats} />
        </Box>
      )}

      <Box marginTop={1}>
        <Section title="FPS Analysis" color="blue" />
      </Box>

      {worldNames.map((worldName) => {
        const data = worldFpsMap.get(worldName);

        if (!data || data.fps.length === 0) {
          return (
            <Box key={worldName} marginTop={1} paddingLeft={2}>
              <Text color="yellow">{worldName} — No FPS data available</Text>
            </Box>
          );
        }

        const stats = parser.calculateFpsStats(data.fps);
        const chart = asciichart.plot([parser.downsampleData(data.fps, graphWidth)], {
          height: 15,
          min: Math.floor(stats.min) - 5,
          max: Math.ceil(stats.max) + 5,
        });
        const duration = parser.calculateDuration(data.startTime, data.endTime);

        return (
          <Box key={worldName} flexDirection="column" marginTop={1}>
            <Text color="blue" bold>
              {'  '}📍 {worldName}
            </Text>
            <Box marginTop={1}>
              <Text color="blue">{chart}</Text>
            </Box>
            <Box marginTop={1} marginBottom={1}>
              <StatsRow stats={stats} duration={duration} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
