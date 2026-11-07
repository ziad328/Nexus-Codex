import { render, screen } from '@testing-library/react';
import PlatformIconList from '../../../src/components/shared/PlatformIconList';

const platform = (slug: string, name = slug) => ({ id: slug.length, name, slug });

describe('PlatformIconList', () => {
  it.each(['pc', 'playstation', 'xbox', 'nintendo', 'mac', 'linux', 'android', 'ios', 'web'])(
    'shows an icon for %s, titled with its name',
    (slug) => {
      render(<PlatformIconList platforms={[platform(slug, `Name of ${slug}`)]} />);

      expect(screen.getByTitle(`Name of ${slug}`)).toBeInTheDocument();
    },
  );

  it('skips a platform it has no icon for', () => {
    const { container } = render(<PlatformIconList platforms={[platform('atari'), platform('pc')]} />);

    expect(screen.queryByTitle('atari')).not.toBeInTheDocument();
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });

  it('shows no icons for an empty list', () => {
    const { container } = render(<PlatformIconList platforms={[]} />);

    expect(container.querySelectorAll('svg')).toHaveLength(0);
  });
});
