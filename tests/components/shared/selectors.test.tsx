import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PlatformSelector from '../../../src/components/shared/PlatformSelector';
import StoreSelector from '../../../src/components/shared/StoreSelector';
import TagSelector from '../../../src/components/shared/TagSelector';
import { deferred, mockApi, mockApiError } from '../../fakes/network';

const isChecked = (name: string) => screen.getByRole('button', { name }).querySelector('.lucide-check') !== null;

describe('PlatformSelector', () => {
  const pc = { id: 1, name: 'PC', slug: 'pc' };
  const xbox = { id: 3, name: 'Xbox', slug: 'xbox' };

  beforeEach(() => {
    mockApi('/platforms/lists/parents', { results: [pc, xbox] });
  });

  const openMenu = async () => {
    fireEvent.click(screen.getByRole('button', { name: /platform/i }));
    await screen.findByRole('button', { name: 'Xbox' });
  };

  it('shows "Platform" when nothing is chosen, with the menu closed', async () => {
    render(<PlatformSelector selectedPlatform={null} onSelectPlatform={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Platform' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'PC' })).not.toBeInTheDocument());
  });

  it('shows the chosen platform', () => {
    render(<PlatformSelector selectedPlatform={xbox} onSelectPlatform={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Xbox' })).toBeInTheDocument();
  });

  it('chooses a platform and closes', async () => {
    const onSelect = vi.fn();
    render(<PlatformSelector selectedPlatform={null} onSelectPlatform={onSelect} />);
    await openMenu();

    fireEvent.click(screen.getByRole('button', { name: 'Xbox' }));

    expect(onSelect).toHaveBeenCalledWith(xbox);
    expect(screen.queryByRole('button', { name: 'All Platforms' })).not.toBeInTheDocument();
  });

  it('clears the choice with All Platforms', async () => {
    const onSelect = vi.fn();
    render(<PlatformSelector selectedPlatform={null} onSelectPlatform={onSelect} />);
    await openMenu();

    fireEvent.click(screen.getByRole('button', { name: 'All Platforms' }));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('ticks the current choice', async () => {
    render(<PlatformSelector selectedPlatform={null} onSelectPlatform={vi.fn()} />);
    await openMenu();

    expect(isChecked('All Platforms')).toBe(true);
    expect(isChecked('PC')).toBe(false);
  });

  it('closes when clicking elsewhere', async () => {
    render(<PlatformSelector selectedPlatform={null} onSelectPlatform={vi.fn()} />);
    await openMenu();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('button', { name: 'All Platforms' })).not.toBeInTheDocument();
  });

  it('hides itself when platforms fail to load', async () => {
    mockApiError('/platforms/lists/parents');
    const { container } = render(<PlatformSelector selectedPlatform={null} onSelectPlatform={vi.fn()} />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});

describe('StoreSelector', () => {
  const steam = { id: 1, name: 'Steam', slug: 'steam', domain: 'steampowered.com' };
  const gog = { id: 5, name: 'GOG', slug: 'gog', domain: 'gog.com' };

  const renderLoaded = async (selectedStoreId: number | null = null) => {
    mockApi('/stores', { results: [steam, gog] });
    const onSelect = vi.fn();
    render(<StoreSelector selectedStoreId={selectedStoreId} onSelectStore={onSelect} />);
    await screen.findByRole('button', { name: selectedStoreId ? 'GOG' : 'Store' });
    return onSelect;
  };

  const openMenu = () => fireEvent.click(screen.getAllByRole('button')[0]);

  it('shows nothing while loading', () => {
    mockApi('/stores', () => deferred().promise);

    const { container } = render(<StoreSelector selectedStoreId={null} onSelectStore={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows nothing when there are no stores', async () => {
    mockApi('/stores', { results: [] });

    const { container } = render(<StoreSelector selectedStoreId={null} onSelectStore={vi.fn()} />);

    await new Promise((resolve) => setTimeout(resolve));
    expect(container).toBeEmptyDOMElement();
  });

  it('shows nothing when loading fails', async () => {
    mockApiError('/stores');

    const { container } = render(<StoreSelector selectedStoreId={null} onSelectStore={vi.fn()} />);

    await new Promise((resolve) => setTimeout(resolve));
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the chosen store', async () => {
    await renderLoaded(5);

    expect(screen.getByRole('button', { name: 'GOG' })).toBeInTheDocument();
  });

  it('passes the id of the chosen store and closes', async () => {
    const onSelect = await renderLoaded();
    openMenu();

    fireEvent.click(screen.getByRole('button', { name: 'GOG' }));

    expect(onSelect).toHaveBeenCalledWith(5);
    expect(screen.queryByRole('button', { name: 'Any Store' })).not.toBeInTheDocument();
  });

  it('clears the choice with Any Store', async () => {
    const onSelect = await renderLoaded(5);
    openMenu();

    fireEvent.click(screen.getByRole('button', { name: 'Any Store' }));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('ticks the current choice', async () => {
    await renderLoaded(5);
    openMenu();

    expect(isChecked('Any Store')).toBe(false);
    expect(isChecked('Steam')).toBe(false);
    const [, menuItem] = screen.getAllByRole('button', { name: 'GOG' });
    expect(menuItem.querySelector('.lucide-check')).toBeInTheDocument();
  });

  it('closes when clicking elsewhere', async () => {
    await renderLoaded();
    openMenu();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('button', { name: 'Any Store' })).not.toBeInTheDocument();
  });
});

describe('TagSelector', () => {
  const coop = { id: 1, name: 'Co-op', slug: 'co-op' };
  const horror = { id: 2, name: 'Horror', slug: 'horror' };

  const renderLoaded = async (selectedTagSlug: string | null = null) => {
    mockApi('/tags', { results: [coop, horror] });
    const onSelect = vi.fn();
    render(<TagSelector selectedTagSlug={selectedTagSlug} onSelectTag={onSelect} />);
    await screen.findByRole('button', { name: selectedTagSlug ? 'Horror' : 'Tag' });
    return onSelect;
  };

  const openMenu = () => fireEvent.click(screen.getAllByRole('button')[0]);

  it('shows nothing while loading', () => {
    mockApi('/tags', () => deferred().promise);

    const { container } = render(<TagSelector selectedTagSlug={null} onSelectTag={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows nothing when loading fails', async () => {
    mockApiError('/tags');

    const { container } = render(<TagSelector selectedTagSlug={null} onSelectTag={vi.fn()} />);

    await new Promise((resolve) => setTimeout(resolve));
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the chosen tag', async () => {
    await renderLoaded('horror');

    expect(screen.getByRole('button', { name: 'Horror' })).toBeInTheDocument();
  });

  it('passes the slug of the chosen tag and closes', async () => {
    const onSelect = await renderLoaded();
    openMenu();

    fireEvent.click(screen.getByRole('button', { name: 'Horror' }));

    expect(onSelect).toHaveBeenCalledWith('horror');
    expect(screen.queryByRole('button', { name: 'Any Tag' })).not.toBeInTheDocument();
  });

  it('clears the choice with Any Tag', async () => {
    const onSelect = await renderLoaded('horror');
    openMenu();

    fireEvent.click(screen.getByRole('button', { name: 'Any Tag' }));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('ticks Any Tag when nothing is chosen', async () => {
    await renderLoaded();
    openMenu();

    expect(isChecked('Any Tag')).toBe(true);
    expect(isChecked('Horror')).toBe(false);
  });

  it('closes when clicking elsewhere', async () => {
    await renderLoaded();
    openMenu();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('button', { name: 'Any Tag' })).not.toBeInTheDocument();
  });
});
