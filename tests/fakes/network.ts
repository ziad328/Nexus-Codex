import { AxiosError, CanceledError } from 'axios';
import type { AxiosAdapter, GenericAbortSignal } from 'axios';
import apiClient from '../../src/services/api-client';

export interface RecordedRequest {
  url: string;
  params: Record<string, unknown>;
  signal?: GenericAbortSignal;
}

type Handler = (request: RecordedRequest) => unknown;

const routes = new Map<string, Handler>();

/** Every request the app made in the current test, oldest first. */
export const apiRequests: RecordedRequest[] = [];

/** Answers `url` with this data, or with whatever the function returns or resolves to. */
export const mockApi = (url: string, response: unknown) => {
  routes.set(url, typeof response === 'function' ? (response as Handler) : () => response);
};

/** Makes `url` fail the way a real HTTP error does. */
export const mockApiError = (url: string, status = 500) => {
  routes.set(url, () => {
    throw new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_RESPONSE');
  });
};

/** A promise a test settles by hand, to hold a response open while something else happens. */
export const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const untilAborted = (signal?: GenericAbortSignal) =>
  new Promise<never>((_, reject) => {
    if (!signal) return;
    if (signal.aborted) reject(new CanceledError());
    signal.addEventListener?.('abort', () => reject(new CanceledError()));
  });

const fakeAdapter: AxiosAdapter = async (config) => {
  const url = config.url ?? '';
  const request: RecordedRequest = { url, params: config.params ?? {}, signal: config.signal };
  apiRequests.push(request);

  const handler = routes.get(url);
  if (!handler) throw new Error(`No fake API route for ${url}`);

  const data = await Promise.race([
    Promise.resolve().then(() => handler(request)),
    untilAborted(config.signal),
  ]);
  return { data, status: 200, statusText: 'OK', headers: {}, config };
};

export const installFakeApi = () => {
  apiClient.defaults.adapter = fakeAdapter;
};

export const resetFakeApi = () => {
  routes.clear();
  apiRequests.length = 0;
};
