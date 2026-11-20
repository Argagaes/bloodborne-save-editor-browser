import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SaveEditor} from '../src/save-engine.js';
import {ORIGIN_BASES,STAT_NAMES,validateAttributes,baseStatValues} from '../src/character-stat-rules.js';
const data=Object.fromEntries(['items','weapons','armors','bosses','upgrades','offsets','lamps','shortcuts','shortcut-auxiliary'].map(n=>[n,JSON.parse(fs.readFileSync(new URL(`../public/data/${n}.json`,import.meta.url)))]));
function make(){return new SaveEditor(fs.readFileSync(new URL('../public/userdata0000',import.meta.url)),data);}
test('all origin minimums produce their initial levels and reject underflow',()=>{
 for(let i=0;i<9;i++){const stats=Object.fromEntries(STAT_NAMES.map((n,j)=>[n,ORIGIN_BASES[i][j]]));assert.equal(validateAttributes(stats,i),i===8?4:10);assert.throws(()=>validateAttributes({...stats,Vitality:stats.Vitality-1},i));}
 assert.deepEqual(baseStatValues({Vitality:30,Endurance:40}),{hp:1100,stamina:160});
});
test('attribute changes update level while preserving saved HP and stamina and support undo',()=>{
 const e=make();e.transaction('setup',()=>{e.setStat('Origin',0);for(let i=0;i<6;i++)e.setStat(STAT_NAMES[i],ORIGIN_BASES[0][i]);e.setStat('Level',10);});
 const before=e.bytes.slice(),hp=e.stats.Health,stamina=e.stats.Stamina;
 e.transaction('level up',()=>e.setCharacterAttribute('Vitality',12));assert.equal(e.stats.Level,11);assert.equal(e.stats.Health,hp);assert.equal(e.stats.Stamina,stamina);
 e.undo();assert.deepEqual(e.bytes,before);e.transaction('below starting value',()=>e.setCharacterAttribute('Vitality',10));assert.equal(e.stats.Vitality,10);assert.equal(e.stats.Level,9);
});
test('attributes allow out-of-range values and origin changes without clamping',()=>{
 const e=make();e.transaction('setup',()=>{e.setStat('Origin',0);for(let i=0;i<6;i++)e.setStat(STAT_NAMES[i],ORIGIN_BASES[0][i]);});
 e.transaction('uncapped',()=>e.setCharacterAttribute('Vitality',150));assert.equal(e.stats.Vitality,150);assert.equal(e.stats.Level,149);
 e.transaction('below origin',()=>e.setCharacterAttribute('Strength',1));assert.equal(e.stats.Strength,1);
 e.transaction('change origin',()=>e.setCharacterOrigin(6));assert.equal(e.stats.Origin,6);assert.equal(e.stats.Strength,1);
});
