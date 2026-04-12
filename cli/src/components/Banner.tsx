import React from 'react';
import { Box, Text } from 'ink';

interface BannerProps {
  version: string;
}

export function Banner({ version }: BannerProps) {
  return (
    <Box marginBottom={1}>
      <Text color="cyan" bold>
        🚴 Zwift Log Parser v{version}
      </Text>
    </Box>
  );
}
