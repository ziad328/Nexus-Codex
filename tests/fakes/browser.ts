import { vi } from 'vitest';

const blockedRequest = (target: string) =>
  new Error(`Blocked real network request in a test: ${target}`);

class FakeIntersectionObserver implements IntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly root = null;
  readonly rootMargin = '';
  readonly scrollMargin = '';
  readonly thresholds = [];
  elements = new Set<Element>();
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  observe = (element: Element) => { this.elements.add(element); };
  unobserve = (element: Element) => { this.elements.delete(element); };
  disconnect = () => { this.elements.clear(); };
  takeRecords = () => [];
}

/** Tells every observer watching an element that it entered or left the viewport. */
export const triggerIntersection = (isIntersecting = true) => {
  FakeIntersectionObserver.instances.forEach((observer) => {
    const entries = [...observer.elements].map(
      (target) => ({ isIntersecting, target }) as IntersectionObserverEntry,
    );
    if (entries.length > 0) observer.callback(entries, observer);
  });
};

/** Fills in what jsdom lacks and makes real network access fail loudly. */
export const installBrowserFakes = () => {
  vi.stubGlobal('fetch', (input: RequestInfo | URL) => Promise.reject(blockedRequest(String(input))));
  XMLHttpRequest.prototype.send = function send() {
    throw blockedRequest('XMLHttpRequest');
  };

  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;

  window.scrollTo = () => {};
  Element.prototype.scrollTo = () => {};
  Element.prototype.scrollBy = () => {};
  HTMLMediaElement.prototype.play = () => Promise.resolve();
  HTMLMediaElement.prototype.pause = () => {};
  Element.prototype.requestFullscreen = () => Promise.resolve();
  document.exitFullscreen = () => Promise.resolve();
};

export const resetBrowserFakes = () => {
  FakeIntersectionObserver.instances = [];
};
