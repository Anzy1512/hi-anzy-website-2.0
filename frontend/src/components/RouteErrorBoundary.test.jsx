import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import { RouteErrorBoundary } from './RouteErrorBoundary';

const Boom = () => {
  throw new Error('render failed on purpose');
};

test('a render-time throw becomes a visible, recoverable page state instead of a blank tree', () => {
  const reported = vi.spyOn(console, 'error').mockImplementation(() => {});
  render(<MemoryRouter><RouteErrorBoundary><Boom /></RouteErrorBoundary></MemoryRouter>);
  expect(screen.getByTestId('route-error')).toBeTruthy();
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByText('Reload')).toBeTruthy();
  expect(screen.getByText('Home').getAttribute('href')).toBe('/');
  // the error is reported, not hidden
  expect(reported).toHaveBeenCalled();
});

test('healthy children render untouched', () => {
  render(<MemoryRouter><RouteErrorBoundary><p>fine</p></RouteErrorBoundary></MemoryRouter>);
  expect(screen.getByText('fine')).toBeTruthy();
  expect(screen.queryByTestId('route-error')).toBeNull();
});
