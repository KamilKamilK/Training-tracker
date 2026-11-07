import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom has no native dialog API or focus trapping; keyboard modality is covered in E2E.
HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
  this.open = true;
});
HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
  this.open = false;
});

// Vitest runs without globals, so Testing Library cannot register its automatic cleanup.
afterEach(() => {
  cleanup();
});
