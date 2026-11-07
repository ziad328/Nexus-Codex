// RAWG images could be cropped through their URL. IGDB URLs already name their size, so they pass through unchanged.
const getCroppedImageUrl = (url: string) => {
  if (!url) return '';
  const target = 'media.rawg.io/media/';
  const index = url.indexOf(target);
  if (index === -1) return url;
  const at = index + target.length;
  return url.slice(0, at) + 'crop/600/400/' + url.slice(at);
};

export default getCroppedImageUrl;
