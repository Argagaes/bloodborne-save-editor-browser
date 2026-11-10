import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runeIconFile } from '../src/rune-icons.js';

const catalog = JSON.parse(readFileSync(new URL('../public/data/upgrades.json', import.meta.url)));

test('every named rune effect has a bundled icon', () => {
  const images = new Set();
  for (const [id, rune] of Object.entries(catalog.runeEffects)) {
    const icon = runeIconFile(Number(id), catalog);
    if (!rune.name) {
      assert.equal(icon, null);
      continue;
    }
    assert.ok(icon, `${id}: ${rune.name}`);
    images.add(icon);
  }
  assert.equal(images.size, 52);
  for (const icon of images) {
    const bytes = readFileSync(new URL(`../public/assets/runes/${icon}`, import.meta.url));
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF', icon);
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP', icon);
  }
});

test('tier variants and oath effects use the matching game artwork', () => {
  assert.equal(runeIconFile(1100002, catalog), 'moon/2.webp');
  assert.equal(runeIconFile(1105000, catalog), 'anti-clockwise_metamorphosis/0.webp');
  assert.equal(runeIconFile(1125000, catalog), 'deep_sea/0.webp');
  assert.equal(catalog.runeEffects[1125000].name, 'Clear Deep Sea');
  assert.equal(catalog.runeEffects[1126002].name, 'Stunning Deep Sea');
  assert.equal(runeIconFile(2128005, catalog), "oath/beast's_embrace.webp");
  assert.equal(runeIconFile(2129002, catalog), 'oath/milkweed.webp');
  assert.equal(runeIconFile(1, catalog), null);
});
