import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import { rehypeBase, rehypeConsentEmbed } from './src/lib/rehype.mjs';
import { legacyRedirects } from './src/lib/redirects.mjs';

// Alte Joomla-Adressen → neue Seiten (GitHub Pages kann keine echten 301)
const redirects = JSON.parse(readFileSync('./src/data/redirects.json', 'utf8'));

const site = process.env.SITE_URL || 'https://sebutd.github.io';
const base = process.env.BASE_PATH ?? '/EintrachtBerssen';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [legacyRedirects(redirects, base, site)],
  build: { format: 'directory' },
  markdown: {
    rehypePlugins: [rehypeConsentEmbed, [rehypeBase, { base }]],
  },
});
