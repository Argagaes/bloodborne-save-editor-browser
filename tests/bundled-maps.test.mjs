import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mapPoint} from '../src/bbmap.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const maps=read('../public/data/maps/manifest.json'),shortcuts=read('../public/data/shortcuts.json');
test('every shortcut map has a bundled image and every located marker fits its chart',()=>{
  for(const id of new Set(shortcuts.map(s=>s.map))){
    const chart=maps[id];assert.ok(chart,`missing ${id}`);
    const png=fs.readFileSync(new URL(`../public/${chart.image}`,import.meta.url));
    assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16),chart.width);assert.equal(png.readUInt32BE(20),chart.height);
    for(const s of shortcuts.filter(x=>x.map===id)) for(const position of s.positions||[]){
      const p=mapPoint(chart,position);assert.ok(p.x>=0&&p.x<chart.width&&p.y>=0&&p.y<chart.height,`${s.eventFlag} outside ${id}`);
    }
  }
});
test('tested shortcuts retain their original object names in metadata',()=>{
  for(const s of shortcuts.filter(s=>s.verified))assert.ok(s.internalName);
});
