import React from 'react';
import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Seo } from './Seo';

test('real SEO component updates metadata, removes stale schema and excludes query strings', () => {
  window.history.replaceState(null, '', '/contact?services=private-brief#section');
  const view = render(<Seo title="First" description="Old" noIndex jsonLd={{ '@type': 'FAQPage' }} />);
  expect(document.querySelector('meta[name="robots"]').content).toBe('noindex,follow');
  view.rerender(<Seo title="Contact" description="Say hi" jsonLd={{ '@type': 'ContactPage' }} />);
  expect(document.title).toBe('Contact');
  expect(document.querySelector('meta[name="description"]').content).toBe('Say hi');
  expect(document.querySelector('link[rel="canonical"]').href).toBe(window.location.origin + '/contact');
  expect(document.querySelector('meta[property="og:url"]').content).toBe(window.location.origin + '/contact');
  expect(document.querySelector('meta[name="robots"]').content).toBe('index,follow');
  expect(document.querySelector('meta[name="twitter:card"]').content).toBe('summary_large_image');
  expect(document.querySelectorAll('meta[name="description"]').length).toBe(1);
  const schemas = [...document.querySelectorAll('script[data-seo-jsonld]')].map(el => JSON.parse(el.textContent)['@type']);
  expect(schemas).toEqual(['ProfessionalService', 'ContactPage']);
});
