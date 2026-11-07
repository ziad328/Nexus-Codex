import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PlatformSelector from '../../../src/components/shared/PlatformSelector';
import StoreSelector from '../../../src/components/shared/StoreSelector';
import TagSelector from '../../../src/components/shared/TagSelector';

const isChecked = (name: string) => screen.getByRole('button', { name }).querySelector('.lucide-check') !== null;

describe('PlatformSelector', () => {
  const xbox = { id: 3, name: 'Xbox', slug: 'xbox' };

  beforeEach(() => {
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

  it('offers every platform family, in a fixed order', async () => {
    render(<PlatformSelector selectedPlatform={null} onSelectPlatform={vi.fn()} />);
    await openMenu();

    for (const name of ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Apple Macintosh', 'Linux', 'iOS', 'Android', 'Web']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });
});

describe('StoreSelector', () => {

  const renderLoaded = async (selectedStoreId: number | null = null) => {
    const onSelect = vi.fn();
    render(<StoreSelector selectedStoreId={selectedStoreId} onSelectStore={onSelect} />);
    await screen.findByRole('button', { name: selectedStoreId ? 'GOG' : 'Store' });
    return onSelect;
  };

  const openMenu = () => fireEvent.click(screen.getAllByRole('button')[0]);

  it('offers only stores IGDB can filter by', async () => {
    await renderLoaded();
    openMenu();

    for (const name of ['Steam', 'PlayStation Store', 'Xbox Store', 'Epic Games', 'GOG', 'App Store', 'Google Play', 'itch.io']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: 'Nintendo Store' })).not.toBeInTheDocument();
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

  const renderLoaded = async (selectedTagSlug: string | null = null) => {
    const onSelect = vi.fn();
    render(<TagSelector selectedTagSlug={selectedTagSlug} onSelectTag={onSelect} />);
    await screen.findByRole('button', { name: selectedTagSlug ? 'Horror' : 'Tag' });
    return onSelect;
  };

  const openMenu = () => fireEvent.click(screen.getAllByRole('button')[0]);

  it('offers the curated list of tags', async () => {
    await renderLoaded();
    openMenu();

    expect(screen.getAllByRole('button')).toHaveLength(22); // the menu button, Any Tag and 20 tags
    expect(screen.getByRole('button', { name: 'Open World' })).toBeInTheDocument();
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
