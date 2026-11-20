import test from 'node:test';
import assert from 'node:assert/strict';
import {gemAvailability,specialGemDefaults,reportedFlatPairs} from '../src/gem-availability.js';
import fs from 'node:fs';
const n=0xffffffff;
test('availability labels distinguish fixed special records and unassessed combinations',()=>{
  const extra=specialGemDefaults(3126204,[n,n,n,n,n]);
  assert.deepEqual(extra,[3045204,n,n,n,n]);
  assert.equal(gemAvailability(3126204,63,extra).label,'Verified');
  assert.equal(gemAvailability(3126204,63,[n,n,n,n,n]).label,'Unobtainable from this source');
  assert.equal(gemAvailability(126619,1,[n,n,n,n,n]).label,'Not verified');
  assert.equal(gemAvailability(null,1,[n,n,n,n,n]).label,'Not assessed');
});
test('glyph limits identify bloodtinge conflicts without claiming unlisted drops are legitimate',()=>{
  const effects=JSON.parse(fs.readFileSync(new URL('../public/data/upgrades.json',import.meta.url))).gemEffects;
  assert.equal(gemAvailability(22619,1,[n,n,n,n,n],effects).label,'Not verified');
  assert.deepEqual(reportedFlatPairs('Bloodtinge gems').map(x=>[x.value,x.record.glyphs]),[[28.7,['4n5vdyhj']]]);
  assert.equal(gemAvailability(122619,1,[13119,n,n,n,n],effects).label,'Above listed flat-bonus examples');
  assert.match(gemAvailability(22619,1,[17218,n,n,n,n],effects).detail,/28\.7% \(4n5vdyhj\)/);
  assert.equal(gemAvailability(22519,8,[13119,n,n,n,n],effects).label,'Not verified');
  assert.equal(gemAvailability(26619,1,[17218,n,n,n,n],effects).label,'Above listed flat-bonus examples');
  assert.equal(gemAvailability(22619,1,[47520,n,n,n,n],effects).label,'Not verified');
  const fabricated={...effects,123:{effect:'Blood ATK UP +33%'}};
  assert.equal(gemAvailability(123,1,[n,n,n,n,n],fabricated).label,'Above the reported maximum');
  assert.equal(gemAvailability(999999,1,[n,n,n,n,n],effects).label,'Not verified');
});
