import { vi } from 'vitest';

export const pwaFake = {
  needRefresh: false,
  setNeedRefresh: vi.fn(),
  updateServiceWorker: vi.fn(),
};

export const useRegisterSW = () => ({
  needRefresh: [pwaFake.needRefresh, pwaFake.setNeedRefresh] as const,
  offlineReady: [false, vi.fn()] as const,
  updateServiceWorker: pwaFake.updateServiceWorker,
});
