import { defineConfig } from 'astro/config';

const site = process.env.SITE_URL || 'https://sebutd.github.io';
const base = process.env.BASE_PATH ?? '/EintrachtBerssen';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
});
