import { expect, test } from 'vitest';
import { searchCommands } from '@/lib/commandIndex';

const top = (q) => searchCommands(q)[0];

test('legacy terminology lands on the consolidated sections, not the top of a hub', () => {
  expect(top('built here').to).toBe('/work#built-here');
  expect(top('built together').to).toBe('/work#built-together');
  expect(top('collaborators').to).toBe('/network#collaborators');
  expect(top('venue partners').to).toBe('/network#venues');
  expect(top('partners').to).toBe('/network#partners');
  expect(top('collaborate').to).toBe('/network#collaborate');
  expect(top('careers').to).toBe('/network#careers');
  expect(top('who we work with').to).toBe('/why-hi-anzy#who-we-work-with');
  expect(searchCommands('artists').some((i) => i.to === '/network#creators')).toBe(true);
  expect(searchCommands('creators').some((i) => i.to === '/network#creators')).toBe(true);
});

test('the Venues discipline still wins the exact match over the venue partners roster', () => {
  expect(top('venues').to).toBe('/network/venues');
  expect(searchCommands('venues').some((i) => i.to === '/network#venues')).toBe(true);
});

test('each consolidated section is a distinct result with its own wording', () => {
  const hints = new Set();
  for (const q of ['built here', 'built together', 'collaborators', 'venue partners', 'partners', 'collaborate', 'careers', 'who we work with']) {
    const item = top(q);
    expect(item.hint).toBeTruthy();
    hints.add(`${item.label}|${item.hint}`);
  }
  expect(hints.size).toBe(8);
});

test('no search destination points at a retired route', () => {
  const retired = [
    '/work/built-here', '/work/built-together', '/network/collaborators', '/network/artists-creators',
    '/network/venue-partners', '/network/partners', '/collaborate', '/careers', '/who-we-work-with',
  ];
  for (const q of ['built', 'network', 'collaborate', 'careers', 'who', 'partners', 'venue', 'creators', 'work', 'orbit']) {
    for (const item of searchCommands(q, 200)) expect(retired).not.toContain(item.to);
  }
});
