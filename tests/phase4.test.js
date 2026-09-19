import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const mainSrc = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const cssSrc = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

test('phase 4: already-drawn cards are disabled instead of silently failing on click', () => {
  assert.match(mainSrc, /disabled aria-disabled="true"/, 'drawn cards should be rendered disabled');
  assert.match(mainSrc, /const drawn=new Set\(state\.reading\.selected/, 'core select() should track drawn card ids');
  assert.match(mainSrc, /const drawn=new Set\(r\.selected/, 'packageSelect() should track drawn card ids');
  assert.match(mainSrc, /if\(el\.disabled\)return/, 'click handlers should bail out on disabled (already-drawn) cards');
});

test('phase 4: card selection and shuffle interactions respect prefers-reduced-motion', () => {
  assert.match(mainSrc, /reduceMotion\s*=\s*\(\)\s*=>/, 'a reduced-motion check should exist');
  assert.match(mainSrc, /if\(reduceMotion\(\)\)\{fn\(\);return\}/, 'animations must skip straight to the outcome under reduced motion');
  assert.match(cssSrc, /prefers-reduced-motion:reduce\)\{[^}]*animation:none!important/, 'reduced-motion media query must disable animations globally');
});

test('phase 4: card selection has a progress announcement for assistive tech', () => {
  assert.match(mainSrc, /role="status" aria-live="polite"/);
  assert.match(mainSrc, /class="sr-only"/);
});

test('phase 4: reveal, shuffle, and card-lift have restrained CSS animations defined', () => {
  assert.match(cssSrc, /@keyframes reveal-in/);
  assert.match(cssSrc, /@keyframes deck-shuffle/);
  assert.match(cssSrc, /\.deck-card\.lifting/);
});

test('phase 4: mobile deck-card touch target meets the 44px minimum', () => {
  const widthMatch = cssSrc.match(/\.deck-card\{width:(\d+)px/);
  assert.ok(widthMatch, 'mobile deck-card width rule should exist');
  assert.ok(Number(widthMatch[1]) >= 44, 'deck-card touch target must be at least 44px wide on mobile');
});
