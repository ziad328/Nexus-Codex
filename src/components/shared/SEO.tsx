import type { FC } from 'react';
import { Helmet } from 'react-helmet-async';

interface Props {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO: FC<Props> = ({ 
  title = 'Nexus Codex | The Ultimate Game Library',
  description = 'Discover, track, and organize your favorite video games. Nexus Codex provides an immersive platform to manage your custom collections and explore rich gaming metadata.',
  image = 'https://nexus-codex-lib.vercel.app/nexus_logo.png',
  url = 'https://nexus-codex-lib.vercel.app/',
  type = 'website'
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
