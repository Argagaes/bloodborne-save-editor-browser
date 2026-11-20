import test from 'node:test';
import assert from 'node:assert/strict';
import {copySaveSlot, readSaveSlots, sourceSlot} from '../src/save-slots.js';

test('copy preserves all other system data and rejects unsafe destinations', () => {
  const system=new Uint8Array(262144); system[0x108f]=1;
  const name=new Uint8Array(32); name.set([72,0,117,0,110,0,116,0]);
  system.set(name,0x1096+3*0x192); system[0x1096+3*0x192+100]=123;
  const original=system.slice(), out=copySaveSlot(system,3,6,name);
  assert.deepEqual(system,original);
  assert.equal(readSaveSlots(out)[6].name,'Hunt'); assert.equal(readSaveSlots(out)[6].occupied,true);
  assert.deepEqual(out.slice(0x1096+6*0x192,0x1096+7*0x192),system.slice(0x1096+3*0x192,0x1096+4*0x192));
  for(let i=0;i<system.length;i++) if(i!==0x1092 && (i<0x1096+6*0x192||i>=0x1096+7*0x192)) assert.equal(out[i],system[i]);
  assert.throws(()=>copySaveSlot(system,3,3,name),/occupied/);
  assert.throws(()=>copySaveSlot(system,2,6,name),/source slot is empty/);
  assert.throws(()=>copySaveSlot(system,3,6,new Uint8Array(32)),/does not match/);
  assert.throws(()=>readSaveSlots(new Uint8Array(42)),/system file/);
  assert.equal(sourceSlot('userdata0003'),3); assert.throws(()=>sourceSlot('userdata0010'));
});
