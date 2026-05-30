import React from 'react';
import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { Banner } from './Banner.js';

describe('Banner', () => {
  it('renders the version string', () => {
    const { lastFrame } = render(<Banner version="1.2.3" />);
    expect(lastFrame()).toContain('Zwift Log Parser v1.2.3');
  });

  it('renders the cycling emoji', () => {
    const { lastFrame } = render(<Banner version="0.0.1" />);
    expect(lastFrame()).toContain('🚴');
  });

  it('renders different versions correctly', () => {
    const { lastFrame } = render(<Banner version="dev" />);
    expect(lastFrame()).toContain('Zwift Log Parser vdev');
  });
});
