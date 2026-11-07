import getCroppedImageUrl from '../../src/services/image-url';

describe('getCroppedImageUrl', () => {
  it('asks RAWG for a 600x400 crop', () => {
    expect(getCroppedImageUrl('https://media.rawg.io/media/games/abc/def.jpg'))
      .toBe('https://media.rawg.io/media/crop/600/400/games/abc/def.jpg');
  });

  it('returns an empty string when there is no image', () => {
    expect(getCroppedImageUrl('')).toBe('');
  });

  it('leaves an IGDB URL unchanged (BUG-11, fixed)', () => {
    const url = 'https://images.igdb.com/igdb/image/upload/t_cover_big/abc.jpg';
    expect(getCroppedImageUrl(url)).toBe(url);
  });
});
