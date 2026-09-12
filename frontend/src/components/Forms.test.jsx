import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import { submitContact, subscribe } from '@/lib/api';
import Contact from '@/pages/Contact';
import { NotesSubscribe } from './NotesSubscribe';

vi.mock('@/lib/api', () => ({ submitContact: vi.fn(), subscribe: vi.fn(), track: vi.fn() }));
vi.mock('@/lib/motion', () => ({ useRevealObserver: () => null, prefersReducedMotion: () => true }));
vi.mock('@/components/Reveal', () => ({ Reveal: ({ children }) => <div>{children}</div> }));
vi.mock('@/components/NextSteps', () => ({ NextSteps: () => null }));
vi.mock('@/components/PopIllustration', () => ({ PopIllustration: () => null }));
vi.mock('@/components/Picture', () => ({ Picture: () => null }));
beforeEach(() => { vi.clearAllMocks(); });

test('contact prevents duplicate submissions and disables the actual submit button', async () => {
  let finish;
  submitContact.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  render(<MemoryRouter><Contact /></MemoryRouter>);
  fireEvent.change(screen.getByTestId('contact-form-field-name'), { target: { value: 'Local Tester' } });
  fireEvent.change(screen.getByTestId('contact-form-field-email'), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByTestId('contact-form-field-message'), { target: { value: 'A valid test message.' } });
  const form = screen.getByTestId('contact-form');
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(submitContact).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('contact-form-submit-button').disabled).toBe(true);
  finish({ ok: true, id: 'local-only' });
  await waitFor(() => expect(screen.getByTestId('contact-form-success-message')).toBeTruthy());
});

test('contact validates before sending and bounds message input', () => {
  render(<MemoryRouter><Contact /></MemoryRouter>);
  fireEvent.submit(screen.getByTestId('contact-form'));
  expect(submitContact).not.toHaveBeenCalled();
  expect(screen.getByTestId('contact-form-error-email')).toBeTruthy();
  expect(screen.getByTestId('contact-form-field-message').maxLength).toBe(4000);
});

test('subscription network failure is not described as an invalid address', async () => {
  subscribe.mockRejectedValue(new Error('offline'));
  render(<NotesSubscribe />);
  fireEvent.change(screen.getByTestId('notes-subscribe-input'), { target: { value: 'test@example.com' } });
  fireEvent.submit(screen.getByTestId('notes-subscribe'));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('could not save'));
  expect(screen.queryByTestId('notes-subscribe-done')).toBeNull();
});

test('subscription rate limit explains when to retry', async () => {
  subscribe.mockRejectedValue({ response: { status: 429 } });
  render(<NotesSubscribe />);
  fireEvent.change(screen.getByTestId('notes-subscribe-input'), { target: { value: 'test@example.com' } });
  fireEvent.submit(screen.getByTestId('notes-subscribe'));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('few minutes'));
});
