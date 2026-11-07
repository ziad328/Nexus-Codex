import { waitFor } from '@testing-library/react';
import SEO from '../../../src/components/shared/SEO';
import { renderWithProviders } from '../../render';

const meta = (selector: string) => document.head.querySelector(`meta[${selector}]`)?.getAttribute('content');

describe('SEO', () => {
  it('fills in the site defaults', async () => {
    renderWithProviders(<SEO />);

    await waitFor(() => expect(document.title).toBe('Nexus Codex | The Ultimate Game Library'));
    expect(meta('property="og:image"')).toBe('https://nexus-codex-lib.vercel.app/nexus_logo.png');
    expect(meta('property="og:url"')).toBe('https://nexus-codex-lib.vercel.app/');
    expect(meta('property="og:type"')).toBe('website');
  });

  it('uses the given title, description, image, URL and type everywhere', async () => {
    renderWithProviders(
      <SEO title="Portal" description="A puzzle game" image="https://img.test/p.jpg" url="https://nexus.test/p" type="article" />,
    );

    await waitFor(() => expect(document.title).toBe('Portal'));
    expect(meta('name="title"')).toBe('Portal');
    expect(meta('name="description"')).toBe('A puzzle game');
    expect(meta('property="og:title"')).toBe('Portal');
    expect(meta('property="og:description"')).toBe('A puzzle game');
    expect(meta('property="og:image"')).toBe('https://img.test/p.jpg');
    expect(meta('property="og:url"')).toBe('https://nexus.test/p');
    expect(meta('property="og:type"')).toBe('article');
    expect(meta('property="twitter:title"')).toBe('Portal');
    expect(meta('property="twitter:description"')).toBe('A puzzle game');
    expect(meta('property="twitter:image"')).toBe('https://img.test/p.jpg');
    expect(meta('property="twitter:url"')).toBe('https://nexus.test/p');
    expect(meta('property="twitter:card"')).toBe('summary_large_image');
  });
});
