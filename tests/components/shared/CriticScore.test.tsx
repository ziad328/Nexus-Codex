import { render, screen } from '@testing-library/react';
import CriticScore from '../../../src/components/shared/CriticScore';

describe('CriticScore', () => {
  it.each([
    [100, 'text-green-400'],
    [75, 'text-green-400'],
    [74, 'text-yellow-400'],
    [50, 'text-yellow-400'],
    [49, 'text-red-400'],
    [1, 'text-red-400'],
  ])('shows %i in the right colour', (score, colour) => {
    render(<CriticScore score={score} />);

    expect(screen.getByText(String(score))).toHaveClass(colour);
  });

  it('shows nothing without a score', () => {
    const { container } = render(<CriticScore score={0} />);

    expect(container).toBeEmptyDOMElement();
  });
});
