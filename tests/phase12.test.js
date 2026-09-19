import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';

const mainSrc = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const cssSrc = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
const indexSrc = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('home hero: the approved cinematic photo asset actually exists on disk (not a missing/placeholder path)', () => {
  const heroPath = new URL('../public/images/arcana/home-hero.jpg', import.meta.url);
  assert.ok(existsSync(heroPath), 'public/images/arcana/home-hero.jpg is missing — Home would fall back to a broken image');
  const stat = statSync(heroPath);
  assert.ok(stat.size > 10000, 'home-hero.jpg looks empty/truncated');
});

test('home hero: main.js references the real hero photo path, with a real functional CTA button (not the JPG pasted over the whole app)', () => {
  assert.match(mainSrc, /src="\/public\/images\/arcana\/home-hero\.jpg"/);
  assert.match(mainSrc, /class="primary hero-cta" data-action="begin"/, 'the CTA must remain a real clickable button, not part of the image');
});

test('mobile nav: a menu toggle exists so every nav item (not just language) is reachable under 900px', () => {
  assert.match(mainSrc, /class="menu-toggle"/, 'a menu toggle button should exist in the header');
  assert.match(mainSrc, /aria-expanded="\$\{state\.menuOpen/, 'the toggle should expose its open/closed state to assistive tech');
  // the old behavior — hiding every nav button except language on mobile, with no way to reach them — must be gone
  assert.ok(!cssSrc.includes('.top nav button:not(.lang){display:none}'), 'nav items must not be permanently hidden on mobile with no way to open them');
  assert.match(cssSrc, /\.top nav\.open\{/, 'an open-state style for the mobile nav dropdown should exist');
});

test('mobile nav: opening the menu is a distinct action from navigating, and any navigation closes it', () => {
  assert.match(mainSrc, /a==='toggle-menu'/);
  assert.match(mainSrc, /state\.menuOpen=false;if\(a==='begin'\)/, 'every action other than toggle-menu should close the mobile menu');
});

test('mobile nav: menuOpen defaults to closed on reset', async () => {
  const { resetState } = await import('../src/app-state.js');
  assert.equal(resetState().menuOpen, false);
});

test('performance: below-the-fold thumbnails are lazy-loaded; above-the-fold hero and the single reveal image load eagerly', () => {
  // the home hero photo is the very first thing painted — lazy-loading it causes a
  // visible flash of blank placeholder, which is exactly the "broken card" symptom this
  // app must never show. It must load eagerly.
  const heroImg = mainSrc.match(/<img class="hero-background"[^>]*>/)?.[0] ?? '';
  assert.ok(heroImg.length > 0, 'expected to find the home hero background image tag');
  assert.ok(!heroImg.includes('loading="lazy"'), 'the home hero photo is above-the-fold and must load eagerly, not lazily');
  const revealImgs = [...mainSrc.matchAll(/<img src="\$\{cardImageUrl\(c,state\.deckId\)\}" alt="\$\{esc\(c\.name\)\} — \$\{c\.orientation\}">/g)];
  assert.ok(revealImgs.length >= 1, 'expected to find the reveal-screen image pattern');
  for (const m of revealImgs) assert.ok(!m[0].includes('loading="lazy"'), 'the single primary reveal image should load eagerly, not lazily');
  // spread-summary / My Readings thumbnails are genuinely below the fold and benefit from lazy loading
  const thumbImgs = [...mainSrc.matchAll(/<img src="\$\{cardImageUrl\(c,state\.deckId\)\}" alt="\$\{esc\(c\.name\)\}"[^>]*>/g)];
  assert.ok(thumbImgs.length >= 1, 'expected to find secondary thumbnail image patterns');
  for (const m of thumbImgs) assert.match(m[0], /loading="lazy"/, 'secondary thumbnails should stay lazy-loaded');
});

test('app shell: a web manifest is linked and declares the required installable-app fields', () => {
  assert.match(indexSrc, /<link rel="manifest" href="[^"]+manifest\.json"/);
  const manifestPath = new URL('../public/manifest.json', import.meta.url);
  assert.ok(existsSync(manifestPath), 'public/manifest.json should exist');
});

test('app shell: manifest.json is valid JSON with the fields a browser needs to consider the app installable', async () => {
  const raw = await readFile(new URL('../public/manifest.json', import.meta.url), 'utf8');
  const manifest = JSON.parse(raw);
  for (const field of ['name', 'short_name', 'start_url', 'display', 'background_color', 'theme_color', 'icons']) {
    assert.ok(field in manifest, `manifest.json is missing "${field}"`);
  }
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'manifest must declare at least one icon');
  for (const icon of manifest.icons) {
    assert.ok(icon.src && icon.sizes && icon.type, 'each icon needs src, sizes, and type');
  }
});

test('app shell: the manifest icon references a real, already-licensed image bundled with the app (not a placeholder URL)', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/manifest.json', import.meta.url), 'utf8'));
  for (const icon of manifest.icons) {
    assert.ok(!/^https?:\/\//.test(icon.src), 'icon should be served locally, not from a remote placeholder');
    const localPath = icon.src.replace(/^\//, '');
    assert.ok(existsSync(new URL(`../${localPath}`, import.meta.url)), `manifest icon file ${icon.src} should exist in the project`);
  }
});
