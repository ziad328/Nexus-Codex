import { fireEvent, render, screen } from '@testing-library/react';
import ViewToggle from '../../../src/components/shared/ViewToggle';

describe('ViewToggle', () => {
  it.each([
    ['grid', 'Grid view', 'List view'],
    ['list', 'List view', 'Grid view'],
  ] as const)('highlights only %s when active', (viewMode, active, inactive) => {
    render(<ViewToggle viewMode={viewMode} onToggle={vi.fn()} />);

    expect(screen.getByRole('button', { name: active })).toHaveClass('bg-accent');
    expect(screen.getByRole('button', { name: inactive })).not.toHaveClass('bg-accent');
  });

  it.each([
    ['Grid view', 'grid'],
    ['List view', 'list'],
  ])('reports a click on %s', (name, mode) => {
    const onToggle = vi.fn();
    render(<ViewToggle viewMode="grid" onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('button', { name }));

    expect(onToggle).toHaveBeenCalledWith(mode);
  });
});
