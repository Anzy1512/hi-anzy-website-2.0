import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { expect, test } from 'vitest';
import { LegacyRedirect } from './LegacyRedirect';
import { LEGACY_ROUTES } from '@/data/content';

const Probe = () => {
  const l = useLocation();
  return <p data-testid="loc">{l.pathname + l.search + l.hash}</p>;
};

test('a legacy URL becomes its hub section, keeping the query string', () => {
  render(
    <MemoryRouter initialEntries={['/network/collaborators?utm=x']}>
      <Routes>
        {LEGACY_ROUTES.map((r) => <Route key={r.from} path={r.from} element={<LegacyRedirect to={r.to} />} />)}
        <Route path="/network" element={<Probe />} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByTestId('loc').textContent).toBe('/network?utm=x#collaborators');
});

test('every legacy route lands on a hub path with a section hash and never on another legacy route', () => {
  const hubs = new Set(['/work', '/network', '/why-hi-anzy']);
  const retired = new Set(LEGACY_ROUTES.map((r) => r.from));
  expect(LEGACY_ROUTES).toHaveLength(9);
  for (const r of LEGACY_ROUTES) {
    const [pathname, hash] = r.to.split('#');
    expect(hubs.has(pathname)).toBe(true);
    expect(hash).toBeTruthy();
    expect(r.from.startsWith('/')).toBe(true);
    expect(r.from.includes('#')).toBe(false);
    expect(retired.has(pathname)).toBe(false); // no loop
  }
});
