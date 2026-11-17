import test from 'node:test';
import assert from 'node:assert/strict';
import {characterCandidate,writeCharacterCandidate} from '../src/npc-character-state.js';
import {inferredFlagGroupOffset} from '../src/flag-group-layout.js';

test('candidate mapping changes one bit and rejects mismatched or malformed records',()=>{
 const bytes=new Uint8Array(512),view=new DataView(bytes.buffer),editor={bytes,usernameOffset:99,view:()=>view,put:(o,n)=>{bytes[o]=n;}};
 view.setUint32(16,0x10c91+100,true);view.setUint32(60,128,true);view.setUint32(64,59,true);view.setUint32(128,55,true);
 bytes.set([0x20,0x52,0x48,0x43,0,0x17,0x09,0x15],132);view.setUint32(140,0x18010000,true);view.setUint32(144,35,true);view.setUint32(148,181,true);bytes[152]=0x80;view.setUint32(175,0xffffffff,true);
 const candidate={map:'m24_01_00_00',count:181,index:4};
 assert.deepEqual(characterCandidate(editor,candidate),{offset:152,mask:16,enabled:false});
 const before=bytes.slice();writeCharacterCandidate(editor,candidate,true);assert.equal(bytes[152],0x90);before[152]=0x90;assert.deepEqual(bytes,before);
 assert.throws(()=>characterCandidate(editor,{...candidate,count:182}),/differs/);
 view.setUint32(144,200,true);assert.throws(()=>characterCandidate(editor,candidate),/layout/);
});

test('flag group inference rejects unsupported and unsafe identifiers',()=>{
 assert.equal(inferredFlagGroupOffset(1),1002);
 assert.equal(inferredFlagGroupOffset(Number.MAX_SAFE_INTEGER),null);
 assert.equal(inferredFlagGroupOffset(-1),null);
 assert.equal(inferredFlagGroupOffset(123456),null);
});
