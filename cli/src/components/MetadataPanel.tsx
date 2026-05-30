import React from 'react';
import { Box, Text } from 'ink';
import type { LogMetadata, NetworkStats } from '@zwift-log-parser/core';
import { Section } from './Section.js';

interface MetaRowProps {
  label: string;
  value?: string;
  valueColor?: string;
}

function MetaRow({ label, value, valueColor = 'cyan' }: MetaRowProps) {
  if (!value) return null;
  return (
    <Text>
      {'  '}
      {label.padEnd(16)}
      <Text color={valueColor}>{value}</Text>
    </Text>
  );
}

interface NetworkRowProps {
  label: string;
  value: number;
}

function NetworkRow({ label, value }: NetworkRowProps) {
  const color = value === 0 ? 'green' : 'red';
  return (
    <Text>
      {'  '}
      {label.padEnd(16)}
      <Text color={color}>{String(value)}</Text>
    </Text>
  );
}

interface MetadataPanelProps {
  metadata: LogMetadata;
  duration?: string;
  networkStats?: NetworkStats;
}

export function MetadataPanel({ metadata, duration, networkStats }: MetadataPanelProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Section title="Session Information" color="cyan" />
      <MetaRow label="Log Date/Time:" value={metadata.logTime} />
      <MetaRow label="Duration:" value={duration} />
      <MetaRow label="Game Version:" value={metadata.gameVersion} />
      <MetaRow label="Device:" value={metadata.device} />
      <MetaRow label="Config:" value={metadata.config} />
      <MetaRow label="Launcher:" value={metadata.launcherVersion} />

      <Box marginTop={1}>
        <Section title="System Information" color="green" />
      </Box>
      <MetaRow label="GPU:" value={metadata.gpu} valueColor="yellow" />
      <MetaRow label="Driver:" value={metadata.gpuDriver} valueColor="yellow" />
      <MetaRow label="CPU:" value={metadata.cpu} valueColor="yellow" />
      <MetaRow label="RAM:" value={metadata.ram} valueColor="yellow" />
      <MetaRow label="Resolution:" value={metadata.resolution} valueColor="yellow" />
      <MetaRow label="Shadow Res:" value={metadata.shadowResolution} valueColor="yellow" />
      <MetaRow label="Graphics:" value={metadata.graphicsProfile} valueColor="yellow" />

      {networkStats !== undefined && (
        <Box flexDirection="column">
          <Box marginTop={1}>
            <Section title="Network" color="blue" />
          </Box>
          <NetworkRow label="TCP Disconnects:" value={networkStats.tcpDisconnects} />
          <NetworkRow label="UDP Timeouts:" value={networkStats.udpTimeouts} />
        </Box>
      )}
    </Box>
  );
}
