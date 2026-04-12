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

export function App({ logfile, options, version }: AppProps) {
  const { exit } = useApp();

  let error: string | null = null;
  let content: ReturnType<ZwiftLogParser['parseFile']> | null = null;
  let worlds: ReturnType<ZwiftLogParser['parseWorlds']> = [];
  let worldFpsMap = new Map<string, WorldFpsData>();
  const parser = new ZwiftLogParser();

  try {
    content = parser.parseFile(logfile);
    const rawContent = parser.readFile(logfile);
    worlds = parser.parseWorlds(rawContent, content.routes);
    if (options.fps) worldFpsMap = parser.parseFpsPerWorld(rawContent);
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

  if (!content) return null;
  const { metadata, fps: entries, routes } = content;

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
