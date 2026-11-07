import { render } from '@testing-library/react';
import GameCardSkeleton from '../../../src/components/shared/GameCardSkeleton';
import GenreSkeleton from '../../../src/components/shared/GenreSkeleton';

describe.each([
  ['GameCardSkeleton', GameCardSkeleton],
  ['GenreSkeleton', GenreSkeleton],
])('%s', (_name, Skeleton) => {
  it('shows an animated placeholder with no text', () => {
    const { container } = render(<Skeleton />);

    expect(container.querySelector('.animate-shimmer')).toBeInTheDocument();
    expect(container).toHaveTextContent('');
  });
});
