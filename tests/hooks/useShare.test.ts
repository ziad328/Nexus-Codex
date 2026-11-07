import { act, renderHook } from '@testing-library/react';
import useShare from '../../src/hooks/useShare';

const data = { title: 'Portal', text: 'Play it', url: 'https://nexus.test/?game=1' };

const stubNavigator = (values: Partial<Record<'share' | 'canShare' | 'clipboard', unknown>>) => {
  (['share', 'canShare', 'clipboard'] as const).forEach((key) => {
    Object.defineProperty(navigator, key, { value: values[key], configurable: true, writable: true });
  });
};

const abortError = () => new DOMException('Cancelled', 'AbortError');

describe('useShare', () => {
  let writeText: ReturnType<typeof vi.fn>;
  let nativeShare: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    writeText = vi.fn().mockResolvedValue(undefined);
    nativeShare = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    stubNavigator({});
  });

  const shareOnce = async () => {
    const view = renderHook(() => useShare());
    await act(() => view.result.current.share(data));
    return view;
  };

  it('starts idle', () => {
    expect(renderHook(() => useShare()).result.current.status).toBe('idle');
  });

  it('uses the native share sheet when the browser can share', async () => {
    stubNavigator({ share: nativeShare, canShare: () => true, clipboard: { writeText } });

    const { result } = await shareOnce();

    expect(nativeShare).toHaveBeenCalledWith(data);
    expect(writeText).not.toHaveBeenCalled();
    expect(result.current.status).toBe('shared');
  });

  it('copies the link when the browser has no native share', async () => {
    stubNavigator({ clipboard: { writeText } });

    const { result } = await shareOnce();

    expect(writeText).toHaveBeenCalledWith(data.url);
    expect(result.current.status).toBe('copied');
  });

  it('copies the link when the browser refuses this data', async () => {
    stubNavigator({ share: nativeShare, canShare: () => false, clipboard: { writeText } });

    const { result } = await shareOnce();

    expect(nativeShare).not.toHaveBeenCalled();
    expect(result.current.status).toBe('copied');
  });

  it('does nothing when the user cancels the share sheet', async () => {
    nativeShare.mockRejectedValue(abortError());
    stubNavigator({ share: nativeShare, canShare: () => true, clipboard: { writeText } });

    const { result } = await shareOnce();

    expect(writeText).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('falls back to copying when native share fails', async () => {
    nativeShare.mockRejectedValue(new Error('Share failed'));
    stubNavigator({ share: nativeShare, canShare: () => true, clipboard: { writeText } });

    const { result } = await shareOnce();

    expect(writeText).toHaveBeenCalledWith(data.url);
    expect(result.current.status).toBe('copied');
  });

  it('reports an error when copying fails too', async () => {
    writeText.mockRejectedValue(new Error('Denied'));
    stubNavigator({ clipboard: { writeText } });

    const { result } = await shareOnce();

    expect(result.current.status).toBe('error');
  });

  it.each([
    ['shared', { canShare: () => true }],
    ['copied', {}],
  ])('returns to idle 2 seconds after %s', async (status, extra) => {
    stubNavigator({ share: 'canShare' in extra ? nativeShare : undefined, clipboard: { writeText }, ...extra });

    const { result } = await shareOnce();
    expect(result.current.status).toBe(status);

    act(() => { vi.advanceTimersByTime(1999); });
    expect(result.current.status).toBe(status);

    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current.status).toBe('idle');
  });

  it('returns to idle 2 seconds after an error', async () => {
    writeText.mockRejectedValue(new Error('Denied'));
    stubNavigator({ clipboard: { writeText } });

    const { result } = await shareOnce();
    act(() => { vi.advanceTimersByTime(2000); });

    expect(result.current.status).toBe('idle');
  });
});
