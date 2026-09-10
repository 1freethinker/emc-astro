// @ts-check
import { defineConfig } from 'astro/config';

import redirects from './src/data/redirects.json' with { type: 'json' };

// Drop any entry whose source == target (ignoring trailing slash) — an identity
// redirect would overwrite the real page's index.html with a self-refresh loop.
/** @param {string} p */
const norm = (p) => p.replace(/\/+$/, '') || '/';
const redirectMap = Object.fromEntries(
  Object.entries(redirects.map).filter(([from, to]) => norm(from) !== norm(to)),
);

// `site` is a placeholder — update before deploy.
export default defineConfig({
  site: 'https://example.com',

  // Old WordPress URLs (nested) -> new flat routes. See src/data/redirects.json.
  redirects: redirectMap,
});
