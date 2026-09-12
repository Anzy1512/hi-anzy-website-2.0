import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ConstellationFallback } from './Fallbacks';
import { NETWORK_SUBCATS } from '@/data/content';

describe('Network without WebGL', () => {
  it('makes every discipline and every selected branch available', () => {
    render(<ConstellationFallback categories={Object.keys(NETWORK_SUBCATS)} subs={NETWORK_SUBCATS} active="Creators" onSelect={() => {}} />);
    for (const name of Object.keys(NETWORK_SUBCATS)) {
      expect(screen.getByRole('button', { name: `Explore ${name}` })).toBeTruthy();
    }
    for (const name of NETWORK_SUBCATS.Creators) expect(screen.getByText(name)).toBeTruthy();
  });

  it('previews branches on hover and supports keyboard selection', () => {
    const select = vi.fn();
    render(<ConstellationFallback categories={['Strategy']} subs={NETWORK_SUBCATS} onSelect={select} />);
    const node = screen.getByRole('button', { name: 'Explore Strategy' });
    fireEvent.mouseEnter(node);
    expect(screen.getByText('Pricing')).toBeTruthy();
    fireEvent.mouseLeave(node);
    expect(screen.queryByText('Pricing')).toBeNull();
    fireEvent.keyDown(node, { key: 'Enter' });
    expect(select).toHaveBeenCalledWith('Strategy');
  });

  it('keeps touch taps on the two-step touch handler even with a mouse click event', () => {
    const select = vi.fn();
    const touch = vi.fn();
    render(<ConstellationFallback categories={['Strategy']} subs={NETWORK_SUBCATS} onSelect={select} onTouchTap={touch} />);
    const node = screen.getByRole('button', { name: 'Explore Strategy' });
    const down = new Event('pointerdown', { bubbles: true });
    Object.defineProperty(down, 'pointerType', { value: 'touch' });
    fireEvent(node, down);
    fireEvent.click(node);
    expect(touch).toHaveBeenCalledWith('Strategy');
    expect(select).not.toHaveBeenCalled();
    fireEvent.click(node);
    expect(select).toHaveBeenCalledWith('Strategy');
  });
});
