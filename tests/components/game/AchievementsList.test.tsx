import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AchievementsList from '../../../src/components/game/AchievementsList';
import { apiRequests, deferred, mockApi, mockApiError } from '../../fakes/network';

const achievement = {
  id: 1,
  name: 'First Steps',
  description: 'Finish the tutorial',
  image: 'https://img.test/a.jpg',
  percent: '42.5',
};

const URL = '/games/1/achievements';
const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('AchievementsList', () => {
  it('shows nothing while loading', () => {
    mockApi(URL, () => deferred().promise);

    const { container } = render(<AchievementsList gameId={1} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows nothing when the game has none', async () => {
    mockApi(URL, { results: [] });

    const { container } = render(<AchievementsList gameId={1} />);

    await waitFor(() => expect(apiRequests).toHaveLength(1));
    await settle();
    expect(container).toBeEmptyDOMElement();
  });

  it('shows nothing when loading fails', async () => {
    mockApiError(URL);

    const { container } = render(<AchievementsList gameId={1} />);

    await waitFor(() => expect(apiRequests).toHaveLength(1));
    await settle();
    expect(container).toBeEmptyDOMElement();
  });

  it('lists achievements with image, name, description and percentage', async () => {
    mockApi(URL, { results: [achievement] });

    render(<AchievementsList gameId={1} />);

    expect(await screen.findByText('Top Achievements')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'First Steps' })).toHaveAttribute('src', achievement.image);
    expect(screen.getByRole('heading', { name: 'First Steps' })).toBeInTheDocument();
    expect(screen.getByText('Finish the tutorial')).toBeInTheDocument();
    expect(screen.getByText('42.5%')).toBeInTheDocument();
  });

  it('hides the percentage when there is none', async () => {
    mockApi(URL, { results: [{ ...achievement, percent: '' }] });

    render(<AchievementsList gameId={1} />);
    await screen.findByText('Top Achievements');

    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
  });

  it('expands and collapses, showing the description once', async () => {
    mockApi(URL, { results: [achievement] });
    render(<AchievementsList gameId={1} />);
    const item = await screen.findByRole('button', { name: /first steps/i });
    const heading = screen.getByRole('heading', { name: 'First Steps' });
    expect(heading).toHaveClass('truncate');

    fireEvent.click(item);
    expect(heading).toHaveClass('whitespace-normal');
    expect(screen.getByText('Finish the tutorial')).not.toHaveClass('line-clamp-1');

    fireEvent.click(item);
    expect(heading).toHaveClass('truncate');
    await waitFor(() => expect(screen.getAllByText('Finish the tutorial')).toHaveLength(1));
    expect(screen.getByText('Finish the tutorial')).toHaveClass('line-clamp-1');
  });

  it('expands one achievement at a time', async () => {
    mockApi(URL, { results: [achievement, { ...achievement, id: 2, name: 'Second' }] });
    render(<AchievementsList gameId={1} />);

    fireEvent.click(await screen.findByRole('button', { name: /first steps/i }));

    expect(screen.getByRole('heading', { name: 'First Steps' })).toHaveClass('whitespace-normal');
    expect(screen.getByRole('heading', { name: 'Second' })).toHaveClass('truncate');
  });
});
