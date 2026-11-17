import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseCatalog } from '../src/chalice-engine.mjs';

test('research maps have unique IDs, valid template records and separate reported crashes', () => {
  const raw=JSON.parse(fs.readFileSync(new URL('../public/data/dungeons.json',import.meta.url)));
  const entries=parseCatalog(raw), research=entries.filter(x=>x.category==='research'||x.category==='research_crash');
  assert.equal(raw.research.length,242); assert.equal(raw.research_crash.length,145);
  const ids=research.map(x=>x.bytes.slice(0,4).join(','));
  assert.equal(new Set(ids).size,ids.length);
  for(const item of research) assert.deepEqual(item.bytes.slice(0,4),item.bytes.slice(12,16));
  assert.ok(research.some(x=>x.glyph==='1D 05 00 0A' && x.desc.includes('Sheet row 387')));
  assert.ok(research.some(x=>x.glyph==='1D 05 0A 0A' && x.desc.includes('not independently verified')));
  assert.ok(research.some(x=>x.category==='research_crash' && x.desc.includes('Crash')));
});
