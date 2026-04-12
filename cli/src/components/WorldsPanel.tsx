import React from 'react';
import { Box, Text } from 'ink';
import type { WorldSession } from '@zwift-log-parser/core';
import { Section } from './Section.js';

interface WorldsPanelProps {
  worlds: WorldSession[];
}

export function WorldsPanel({ worlds }: WorldsPanelProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Section title="Worlds" color="yellow" />
      {worlds.map((world) => {
        const uniqueActivities = [...new Set(world.activities.map((a) => a.name))];
        return (
          <Box key={world.name} flexDirection="column" marginTop={1} paddingLeft={2}>
            <Text color="white">{world.name}</Text>
            {uniqueActivities.map((name) => (
              <Text key={name}>
                {'  '}• <Text color="magenta">{name}</Text>
              </Text>
            ))}
          </Box>
        );
      })}
    </Box>
  );
}
