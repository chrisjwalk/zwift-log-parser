import React from 'react';
import { Box, Text } from 'ink';
import * as asciichart from 'asciichart';
import type { FPSEntry, WorldSession, ZwiftLogParser } from '@zwift-log-parser/core';
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
  duration?: string;
  avg: number;
  min: number;
  max: number;
}

function StatsRow({ duration, avg, min, max }: StatsRowProps) {
  return (
    <Text>
      {'  '}
      {duration && (
        <>
          Time: <Text color="cyan">{duration}</Text>
          {' | '}
        </>
      )}
      Average: <Text color="green">{avg.toFixed(2)}</Text>
      {' | '}Min: <Text color="red">{min.toFixed(2)}</Text>
      {' | '}Max: <Text color="green">{max.toFixed(2)}</Text>
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

  return (
    <Box flexDirection="column">
      {worlds.length > 1 && (
        <Box flexDirection="column" marginBottom={1}>
          <Section title="Overall FPS Over Time" color="cyan" />
          <Text color="cyan">{overallChart}</Text>

          <Box marginTop={1}>
            <Section title="Overall FPS Statistics" color="magenta" />
          </Box>
          <StatsRow avg={fpsStats.avg} min={fpsStats.min} max={fpsStats.max} />
        </Box>
      )}

      <Box marginTop={1}>
        <Section title="FPS Analysis" color="blue" />
      </Box>

      {worlds.map((world) => {
        const data = worldFpsMap.get(world.name);

        if (!data || data.fps.length === 0) {
          return (
            <Box key={world.name} marginTop={1} paddingLeft={2}>
              <Text color="yellow">{world.name} — No FPS data available</Text>
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
          <Box key={world.name} flexDirection="column" marginTop={1}>
            <Text color="blue" bold>
              {'  '}📍 {world.name}
            </Text>
            <Box marginTop={1}>
              <Text color="blue">{chart}</Text>
            </Box>
            <Box marginTop={1} marginBottom={1}>
              <StatsRow duration={duration} avg={stats.avg} min={stats.min} max={stats.max} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
