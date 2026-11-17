import test from 'node:test';
import assert from 'node:assert/strict';
import {dungeonGemCategories} from '../src/dungeon-gem-pool.js';
import {parseCatalog} from '../src/chalice-engine.mjs';
import fs from 'node:fs';
const entries=parseCatalog(JSON.parse(fs.readFileSync(new URL('../public/data/dungeons.json',import.meta.url))));
test('infers effect categories from selected catalog records and preserves repeated entries',()=>{
 const find=g=>entries.find(x=>x.glyph===g).bytes;
 assert.deepEqual(dungeonGemCategories(new Uint8Array(124).fill(255)).categories,[]);
 assert.deepEqual(dungeonGemCategories(find('sp75ajm2')).categories,[45,45,45,45]);
 const copy=find('sp75ajm2').slice();copy[27]=0x32;
 assert.deepEqual(dungeonGemCategories(copy).categories,[11,45,45,45,45]);
});
test('rejects malformed and unknown effect parameters',()=>{
 assert.ok(dungeonGemCategories(null).error);
 const copy=entries.find(x=>x.glyph==='sp75ajm2').bytes.slice();copy[27]=0x80;
 assert.match(dungeonGemCategories(copy).error,/Unknown/);
});
import {changeDungeonCategory} from '../src/dungeon-gem-pool.js';
test('category edits change only the chosen byte and preserve unrelated dungeon effects',()=>{
 const b=entries.find(x=>x.glyph==='sp75ajm2').bytes.slice(),before=b.slice();
 const edited=changeDungeonCategory(b,1,13);assert.equal(edited[35],0x3d);
 for(let i=0;i<b.length;i++)if(i!==35)assert.equal(edited[i],before[i]);
 assert.deepEqual(b,before);assert.throws(()=>changeDungeonCategory(b,0,11),/separate dungeon effect/);
 assert.equal(changeDungeonCategory(b,1,null)[35],255);
});
