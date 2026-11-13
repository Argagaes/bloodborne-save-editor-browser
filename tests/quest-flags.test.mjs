import {test} from 'node:test';
import assert from 'node:assert/strict';
import {flagAddress, inferFlagGroups, readQuestFlag, writeQuestFlag} from '../src/quest-flags.js';

test('infers a group only from consistent MSB-first anchors', () => {
  const anchors = [{eventFlag:12410112,offset:7266,mask:128},{eventFlag:12410117,offset:7266,mask:4}];
  assert.equal(inferFlagGroups(anchors)[12410],7252);
  assert.equal(inferFlagGroups([...anchors,{eventFlag:12410112,offset:7267,mask:128}])[12410],null);
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
