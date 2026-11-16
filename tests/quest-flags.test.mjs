import {test} from 'node:test';
import assert from 'node:assert/strict';
import {flagAddress, inferFlagGroups, inferQuestFlagGroups, readQuestFlag, writeQuestFlag} from '../src/quest-flags.js';
import fs from 'node:fs';

test('infers a group only from consistent MSB-first anchors', () => {
  const anchors = [{eventFlag:12410112,offset:7266,mask:128},{eventFlag:12410117,offset:7266,mask:4}];
  assert.equal(inferFlagGroups(anchors)[12410],7252);
  assert.equal(inferFlagGroups([...anchors,{eventFlag:12410112,offset:7267,mask:128}])[12410],null);
});

test('NPC index resolves both Alfred event-template slots and character checks', () => {
  const {flags,checks} = JSON.parse(fs.readFileSync(new URL('../src/npc-event-index.json',import.meta.url)));
  for (const [flag,event,slot] of [[1341,12400593,0],[1345,12400593,1],[1342,12400594,0],[1346,12400594,1]]) {
    assert.ok(flags[flag].some(site=>site.map==='m24_00_00_00' && site.event===event && site.slot===slot && site.action==='set'));
  }
  const eileenDeath = flags[1368].find(site=>site.event===12410805 && site.action==='set');
  assert.ok(checks[eileenDeath.checksKey].characters.some(([id,state])=>id===2410900 && state===1));
});

test('individual edits preserve adjacent bits and reject out-of-range addresses', () => {
  const editor={flagOffset:10,lced:300,bytes:new Uint8Array(300),put(offset,value){this.bytes[offset]=value;}};
  const flag=1368, base=30, {offset,mask}=flagAddress(editor,flag,base);
  editor.bytes[offset]=0x55;
  writeQuestFlag(editor,flag,base,true);
  assert.equal(editor.bytes[offset],0x55|mask);
  assert.equal(readQuestFlag(editor,flag,base),true);
  writeQuestFlag(editor,flag,base,false);
  assert.equal(editor.bytes[offset],0x55&~mask);
  assert.throws(()=>flagAddress(editor,flag,-1));
  assert.throws(()=>flagAddress(editor,flag,300));
});


test('quest request mapping agrees with the isolated Central Yharnam relighting bits',()=>{
  const lamps=JSON.parse(fs.readFileSync(new URL('../public/data/lamps.json',import.meta.url)));
  const groups=inferQuestFlagGroups({lamps});
  const editor={flagOffset:500, lced:200000, bytes:new Uint8Array(200000)};
  assert.deepEqual(flagAddress(editor,72410201,groups[72410]),{offset:500+15902,mask:0x40});
  assert.deepEqual(flagAddress(editor,72410202,groups[72410]),{offset:500+15902,mask:0x20});
  assert.equal(groups[98765],undefined);
});
