import { defineConfig } from 'astro/config';
import { rehypeBase, rehypeConsentEmbed } from './src/lib/rehype.mjs';

const site = process.env.SITE_URL || 'https://sebutd.github.io';
const base = process.env.BASE_PATH ?? '/EintrachtBerssen';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: {
    rehypePlugins: [rehypeConsentEmbed, [rehypeBase, { base }]],
  },
});
