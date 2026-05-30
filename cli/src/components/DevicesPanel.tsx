import React from 'react';
import { Box, Text } from 'ink';
import type { PairedDevice } from '@zwift-log-parser/core';
import { Section } from './Section.js';

interface DevicesPanelProps {
  devices: PairedDevice[];
}

export function DevicesPanel({ devices }: DevicesPanelProps) {
  if (devices.length === 0) return null;

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Section title="Devices" color="magenta" />
      {devices.map((device) => (
        <Text key={device.name}>
          {'  '}
          <Text color="white">{device.name.padEnd(24)}</Text>
          <Text color="magenta">{device.roles.join(', ')}</Text>
        </Text>
      ))}
    </Box>
  );
}
