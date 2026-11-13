import test from 'node:test';import assert from 'node:assert/strict';
import {parseHexRecord,formatHexRecord} from '../src/chalice-engine.mjs';
test('hex records accept 124 bytes with optional prefix and preserve every byte',()=>{
 const bytes=Uint8Array.from({length:124},(_,i)=>i*2);const formatted=formatHexRecord(bytes);
 assert.deepEqual(parseHexRecord(formatted),bytes);assert.deepEqual(parseHexRecord([...bytes].map(b=>'0x'+b.toString(16).padStart(2,'0')).join(', ')),bytes);
 for(const bad of ['',formatted+' 00',formatted.replace(/^00/,'Z0'),formatted.replace(/^00 /,'')])assert.throws(()=>parseHexRecord(bad));
});
