import React from 'react';
import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { Section } from './Section.js';

describe('Section', () => {
  it('renders the title text', () => {
    const { lastFrame } = render(<Section title="My Section" color="cyan" />);
    expect(lastFrame()).toContain('My Section');
  });

  it('renders the border lines', () => {
    const { lastFrame } = render(<Section title="Test" color="green" />);
    const borderLine = '═'.repeat(51);
    expect(lastFrame()).toContain(borderLine);
  });

  it('renders different titles', () => {
    const { lastFrame } = render(<Section title="FPS Analysis" color="blue" />);
    expect(lastFrame()).toContain('FPS Analysis');
  });
});
