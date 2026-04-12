import React from 'react';
import { Box, Text } from 'ink';

interface SectionProps {
  title: string;
  color: string;
}

export function Section({ title, color }: SectionProps) {
  const line = '═'.repeat(51);
  return (
    <Box flexDirection="column">
      <Text color={color}>{line}</Text>
      <Text color={color} bold>
        {'  '}
        {title}
      </Text>
      <Text color={color}>{line}</Text>
    </Box>
  );
}
