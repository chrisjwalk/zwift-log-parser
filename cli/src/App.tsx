import React, { useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import { ZwiftLogParser } from '@zwift-log-parser/core';
import { Banner } from './components/Banner.js';
import { MetadataPanel } from './components/MetadataPanel.js';
import { WorldsPanel } from './components/WorldsPanel.js';
import { FpsPanel, type WorldFpsData } from './components/FpsPanel.js';

export interface AppOptions {
  fps: boolean;
  routes: boolean;
  metadata: boolean;
}

interface AppProps {
  logfile: string;
  options: AppOptions;
  version: string;
}

function buildWorldFpsMap(
  parser: ZwiftLogParser,
  logfile: string,
): Map<string, WorldFpsData> {
  const content = parser.readFile(logfile);
  const worldFpsMap = new Map<string, WorldFpsData>();

  // Collect worldId changes in log order
  const worldIdChanges: Array<{ index: number; worldId: number }> = [];
  const worldLoadRegex = /GameLoadLevel: Creating New Activity \{worldId: (\d+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = worldLoadRegex.exec(content)) !== null) {
    worldIdChanges.push({ index: match.index, worldId: parseInt(match[1], 10) });
  }

  // Map worldId → world name via SaveActivity lines
  const worldIdMap = new Map<number, string>();
  const saveActivityRegex = /Zwift - ([^\n]+)/g;
  while ((match = saveActivityRegex.exec(content)) !== null) {
    const worldName = match[1].trim();
    const idx = match.index;
    for (let i = worldIdChanges.length - 1; i >= 0; i--) {
      if (worldIdChanges[i].index < idx) {
        worldIdMap.set(worldIdChanges[i].worldId, worldName);
        break;
      }
    }
  }

  const getWorldAtIndex = (index: number): string | undefined => {
    for (let i = worldIdChanges.length - 1; i >= 0; i--) {
      if (worldIdChanges[i].index <= index) return worldIdMap.get(worldIdChanges[i].worldId);
    }
    return undefined;
  };

  // Walk FPS entries and assign each to a world
  const fpsRegex = /\[([\d:.]+)\] FPS ([\d.]+)/g;
  while ((match = fpsRegex.exec(content)) !== null) {
    const worldName = getWorldAtIndex(match.index);
    if (!worldName) continue;

    const fps = parseFloat(match[2]);
    const timestamp = match[1];

    if (!worldFpsMap.has(worldName)) {
      worldFpsMap.set(worldName, { fps: [], startTime: timestamp, endTime: timestamp });
    }
    const entry = worldFpsMap.get(worldName)!;
    entry.fps.push(fps);
    entry.endTime = timestamp;
  }

  return worldFpsMap;
}

export function App({ logfile, options, version }: AppProps) {
  const { exit } = useApp();

  let error: string | null = null;
  let content: ReturnType<ZwiftLogParser['parseFile']> | null = null;
  let worlds: ReturnType<ZwiftLogParser['parseWorlds']> = [];
  let worldFpsMap = new Map<string, WorldFpsData>();
  const parser = new ZwiftLogParser();

  try {
    content = parser.parseFile(logfile);
    worlds = parser.parseWorlds(parser.readFile(logfile), content.routes);
    if (options.fps) worldFpsMap = buildWorldFpsMap(parser, logfile);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  useEffect(() => {
    exit();
  }, [exit]);

  if (error) {
    return (
      <Box>
        <Text color="red" bold>
          Error:{' '}
        </Text>
        <Text color="red">{error}</Text>
      </Box>
    );
  }

  const { metadata, fps: entries, routes } = content!;

  return (
    <Box flexDirection="column" paddingBottom={1}>
      <Banner version={version} />
      {options.metadata && <MetadataPanel metadata={metadata} />}
      {options.routes && worlds.length > 0 && <WorldsPanel worlds={worlds} />}
      {options.fps && (
        <FpsPanel
          entries={entries}
          worlds={worlds}
          worldFpsMap={worldFpsMap}
          parser={parser}
        />
      )}
      {options.routes && routes.length === 0 && worlds.length === 0 && (
        <Text color="yellow">No route/world data found in log file.</Text>
      )}
    </Box>
  );
}
