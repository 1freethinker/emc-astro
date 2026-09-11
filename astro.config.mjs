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

export default defineConfig({
  site: 'https://emckorea.org',

  // Old WordPress URLs (nested) -> new flat routes. See src/data/redirects.json.
  redirects: redirectMap,
});
