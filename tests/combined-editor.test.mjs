import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SaveEditor } from '../src/save-engine.js';
import { parseCatalog, ACTIVE_FLAGS, DUNGEON_OFFSET, FLAGS_OFFSET, STRIDE } from '../src/chalice-engine.mjs';

const json = name => JSON.parse(readFileSync(new URL(`../public/data/${name}.json`, import.meta.url)));
const data = Object.fromEntries(['items', 'weapons', 'armors', 'bosses', 'upgrades', 'offsets'].map(name => [name, json(name)]));
const catalog = parseCatalog(json('dungeons'));
const demo = readFileSync(new URL('../public/userdata0000', import.meta.url));

test('hunter and altar edits share one export and undo history', () => {
  const save = new SaveEditor(demo, data);
  const initial = save.bytes.slice();
  const slot = 6;
  const dungeon = catalog[0];
  assert.equal(save.altars(catalog).length, 6);

  save.transaction('Set Insight', () => save.setStat('Insight', 42));
  const hunterOnly = save.bytes.slice();
  const expected = hunterOnly.slice();
  expected.set(dungeon.bytes, save.inventoryOffset + DUNGEON_OFFSET + STRIDE * (slot - 1));
  expected.set(ACTIVE_FLAGS, save.inventoryOffset + FLAGS_OFFSET + STRIDE * (slot - 1));
  assert.equal(save.transaction('Assign dungeon', () => save.replaceAltar(slot, dungeon)), true);
  assert.deepEqual(save.bytes, expected);
  assert.equal(save.transaction('Same dungeon', () => save.replaceAltar(slot, dungeon)), false);

  const reopened = new SaveEditor(save.bytes, data);
  assert.equal(reopened.stats.Insight, 42);
  assert.equal(reopened.altars(catalog)[slot - 1].dungeon?.glyph, dungeon.glyph);
  assert.deepEqual(save.original, initial);

  save.undo();
  assert.deepEqual(save.bytes, hunterOnly);
  save.undo();
  assert.deepEqual(save.bytes, initial);
  save.redo();
  save.redo();
  assert.deepEqual(save.bytes, expected);

  assert.throws(() => save.transaction('Invalid altar', () => save.replaceAltar(7, dungeon)));
  assert.deepEqual(save.bytes, expected);
  assert.deepEqual(save.history.map(edit => edit.label), ['Set Insight', 'Assign dungeon']);
});

test('custom chalice records and flag bytes round trip and undo without touching other bytes',()=>{
  const save=new SaveEditor(demo,data),initial=save.bytes.slice(),slot=3;
  const before=save.altars(catalog)[slot-1];const bytes=before.bytes.slice(),flags=before.flags.slice();
  bytes[1]^=1;bytes[73]^=0x41;flags[3]^=0x80;flags[123]^=1;
  const expected=initial.slice();expected.set(bytes,save.inventoryOffset+DUNGEON_OFFSET+STRIDE*(slot-1));expected.set(flags,save.inventoryOffset+FLAGS_OFFSET+STRIDE*(slot-1));
  save.transaction('custom chalice',()=>save.replaceAltar(slot,{bytes,flags}));assert.deepEqual(save.bytes,expected);
  const after=new SaveEditor(save.bytes,data).altars(catalog)[slot-1];assert.deepEqual(after.bytes,bytes);assert.deepEqual(after.flags,flags);
  save.undo();assert.deepEqual(save.bytes,initial);
  assert.throws(()=>save.transaction('invalid flags',()=>save.replaceAltar(slot,{bytes,flags:new Uint8Array(3)})));assert.deepEqual(save.bytes,initial);
});
