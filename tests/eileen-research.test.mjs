import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SaveEditor } from '../src/save-engine.js';
import { inferQuestFlagGroups, readQuestFlag, writeQuestFlag } from '../src/quest-flags.js';
import { prepareEileenFirstEncounter } from '../src/eileen-research.js';
const names=['items','weapons','armors','bosses','upgrades','offsets','lamps','shortcuts','shortcut-auxiliary'];
const data=Object.fromEntries(names.map(name=>[name,JSON.parse(fs.readFileSync(new URL(`../public/data/${name}.json`,import.meta.url)))]));
const make=()=>new SaveEditor(fs.readFileSync(new URL('../public/userdata0000',import.meta.url)),data);
const base=id=>inferQuestFlagGroups(data)[Math.floor(id/1000)];
const read=(e,id)=>readQuestFlag(e,id,base(id));
test('experimental early Eileen reset clears recorded encounter flags while preserving badge state and supports undo',()=>{
  const e=make(), set=(id,value)=>writeQuestFlag(e,id,base(id),value);
  e.transaction('setup',()=>{for(const id of [1368,1369,1700,12410805,12410806,12410807,72410543,72410544,9382,50001900,6643])set(id,true);});
  const before=e.bytes.slice();e.transaction('reset',()=>prepareEileenFirstEncounter(e,base));
  assert.equal(read(e,1361),true);
  for(const id of [1368,1369,1700,12410805,12410806,12410807,72410543,72410544])assert.equal(read(e,id),false,`${id}`);
  for(const id of [9382,50001900,6643])assert.equal(read(e,id),true,`${id}`);
  e.undo();assert.deepEqual(e.bytes,before);
  e.transaction('reset candidate',()=>prepareEileenFirstEncounter(e,base,true));assert.equal(read(e,9382),false);
  assert.equal(read(e,50001900),true);assert.equal(read(e,6643),true);
});
test('missing or invalid mappings reject the entire reset without changing bytes',()=>{
  const e=make(),before=e.bytes.slice();
  assert.throws(()=>e.transaction('reset',()=>prepareEileenFirstEncounter(e,id=>id===72410543?null:base(id))),/No address/);
  assert.deepEqual(e.bytes,before);
});
import {eileenCharacterCandidate,clearEileenCharacterCandidate,setEileenCharacterCandidate,resetEileenFirstEncounterAlive} from '../src/eileen-research.js';
test('character-state candidate is limited to a validated 182-entry Central Yharnam record',()=>{
  const bytes=new Uint8Array(512),view=new DataView(bytes.buffer),editor={bytes,usernameOffset:99,view:()=>view,put:(o,n)=>{bytes[o]=n;}};
  view.setUint32(16,0x10c91+100,true);view.setUint32(60,128,true);view.setUint32(64,59,true);view.setUint32(128,55,true);
  bytes.set([0x20,0x52,0x48,0x43,0,0x17,0x09,0x15],132);view.setUint32(140,0x18010000,true);view.setUint32(144,35,true);view.setUint32(148,182,true);bytes[152]=0x90;view.setUint32(175,0xffffffff,true);
  assert.deepEqual(eileenCharacterCandidate(editor),{offset:152,mask:16,enabled:true});clearEileenCharacterCandidate(editor);assert.equal(bytes[152],0x80);setEileenCharacterCandidate(editor,true);assert.equal(bytes[152],0x90);setEileenCharacterCandidate(editor,false);assert.equal(bytes[152],0x80);
  view.setUint32(148,181,true);assert.throws(()=>eileenCharacterCandidate(editor),/differs/);
  view.setUint32(148,182,true);view.setUint32(144,200,true);assert.throws(()=>eileenCharacterCandidate(editor),/layout/);
});

test('combined first-encounter reset clears the tested character bit and rejects invalid layouts before edits',()=>{
  const bytes=new Uint8Array(4096),view=new DataView(bytes.buffer),editor={bytes,flagOffset:512,lced:4096,usernameOffset:99,view:()=>view,put:(o,n)=>{bytes[o]=n;}};
  view.setUint32(16,0x10c91+100,true);view.setUint32(60,128,true);view.setUint32(64,59,true);view.setUint32(128,55,true);
  bytes.set([0x20,0x52,0x48,0x43,0,0x17,0x09,0x15],132);view.setUint32(140,0x18010000,true);view.setUint32(144,35,true);view.setUint32(148,182,true);bytes[152]=0x90;view.setUint32(175,0xffffffff,true);
  const group=id=>({1:0,12410:125,72410:250})[Math.floor(id/1000)] ?? null;
  resetEileenFirstEncounterAlive(editor,group);
  assert.equal(bytes[152],0x80);assert.equal(readQuestFlag(editor,1361,0),true);
  view.setUint32(148,181,true);const before=bytes.slice();
  assert.throws(()=>resetEileenFirstEncounterAlive(editor,group),/differs/);assert.deepEqual(bytes,before);
});
