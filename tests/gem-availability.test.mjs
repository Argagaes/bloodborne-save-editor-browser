import test from 'node:test';
import assert from 'node:assert/strict';
import {gemAvailability,specialGemDefaults} from '../src/gem-availability.js';
const n=0xffffffff;
test('availability labels distinguish fixed special records and unassessed combinations',()=>{
  const extra=specialGemDefaults(3126204,[n,n,n,n,n]);
  assert.deepEqual(extra,[3045204,n,n,n,n]);
  assert.equal(gemAvailability(3126204,63,extra).label,'Verified');
  assert.equal(gemAvailability(3126204,63,[n,n,n,n,n]).label,'Unobtainable from this source');
  assert.equal(gemAvailability(126619,1,[n,n,n,n,n]).label,'Potentially obtainable');
  assert.equal(gemAvailability(null,1,[n,n,n,n,n]).label,'Not assessed');
});
