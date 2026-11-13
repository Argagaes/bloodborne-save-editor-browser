import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { decodeBbMap, mapPoint } from '../src/bbmap.js';

function chartFile() {
  const header=Buffer.alloc(32);header.write('BBMAP9\0\0');header.writeInt32LE(2,8);header.writeInt32LE(2,12);header.writeFloatLE(-10,16);header.writeFloatLE(20,20);header.writeFloatLE(2,24);
  const rgba=Buffer.from([255,0,0,255,0,255,0,255,0,0,255,255,0,0,0,0]);const compressed=deflateSync(rgba);header.writeUInt32LE(compressed.length,28);return {bytes:Buffer.concat([header,compressed]),rgba};
}
test('reads BBMAP9 pixels and projects game X/Z coordinates',async()=>{
  const {bytes,rgba}=chartFile(),chart=await decodeBbMap(bytes);
  assert.deepEqual([chart.width,chart.height,chart.x0,chart.z1,chart.ppm],[2,2,-10,20,2]);
  assert.deepEqual([...chart.rgba],[...rgba]);
  assert.deepEqual(mapPoint(chart,[-9,100,19]),{x:2,y:2});
});
test('rejects corrupt headers, oversized dimensions and incomplete compressed pixels',async()=>{
  const {bytes}=chartFile();await assert.rejects(()=>decodeBbMap(new Uint8Array(32)),/supported/);
  const bad=Buffer.from(bytes);bad.writeInt32LE(9000,8);await assert.rejects(()=>decodeBbMap(bad),/invalid or too large/);
  const invalid=Buffer.from(bytes);invalid.writeUInt32LE(bytes.length,28);await assert.rejects(()=>decodeBbMap(invalid),/invalid or too large/);
  const incomplete=Buffer.from(bytes);incomplete.writeInt32LE(3,8);await assert.rejects(()=>decodeBbMap(incomplete),/incomplete/);
});
