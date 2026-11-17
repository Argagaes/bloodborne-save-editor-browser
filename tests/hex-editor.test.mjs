import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SaveEditor } from '../src/save-engine.js';
import { staticSaveMap,parseHexBytes,writeHexBytes } from '../src/hex-editor.js';
const data=Object.fromEntries(['items','weapons','armors','bosses','upgrades','offsets','lamps','shortcuts','shortcut-auxiliary'].map(name=>[name,JSON.parse(fs.readFileSync(new URL(`../public/data/${name}.json`,import.meta.url)))]));
const make=()=>new SaveEditor(fs.readFileSync(new URL('../public/userdata0000',import.meta.url)),data);
test('field map follows relocated character offsets and includes repeated stat fields',()=>{
  const e=make(), map=staticSaveMap(e,data), strength=map.fields.find(x=>x.name==='Strength');
  assert.equal(strength.start,e.usernameOffset+data.offsets.find(x=>x.name==='Strength').rel_offset);
  assert.equal(strength.length,4);assert.ok(map.regions.some(r=>r.name==='Stats and character details'&&strength.start>=r.start&&strength.start+strength.length<=r.start+r.length));
  assert.equal(map.fields.filter(f=>f.name.startsWith('Health (copy')).length,3);
  assert.ok(map.fields.some(f=>f.name==='Altar 1 dungeon record'));
});
test('raw writes are bounded, undoable, and invalid layout changes roll back',()=>{
  const e=make(),before=e.bytes.slice(), pos=e.usernameOffset+data.offsets.find(x=>x.name==='Strength').rel_offset;
  assert.deepEqual([...parseHexBytes('2A 00 00 00')],[42,0,0,0]);assert.throws(()=>parseHexBytes('1 GG'));
  assert.ok(e.transaction('edit bytes',()=>writeHexBytes(e,pos,parseHexBytes('2A 00 00 00'))));assert.equal(e.stats.Strength,42);
  e.undo();assert.deepEqual(e.bytes,before);
  assert.throws(()=>e.transaction('outside',()=>writeHexBytes(e,e.bytes.length-1,Uint8Array.of(1,2))));assert.deepEqual(e.bytes,before);
  assert.throws(()=>e.transaction('bad marker',()=>writeHexBytes(e,e.face-4,Uint8Array.of(0,0,0,0))));assert.deepEqual(e.bytes,before);
});
