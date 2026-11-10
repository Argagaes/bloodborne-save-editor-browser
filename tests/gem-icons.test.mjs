import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { gemColor, gemVisual } from '../src/gem-icons.js';
import { SaveEditor } from '../src/save-engine.js';
import { hasUpstreamFixtures, readUpstreamFixture } from './upstream-fixtures.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../public/data/upgrades.json', import.meta.url)));
const asset = path => new URL(`../public/assets/${path}`, import.meta.url);
const gem = (effect, shape=1, extra={}) => ({ kind:1, source:0, shape, effects:[effect,0xffffffff,0xffffffff,0xffffffff,0xffffffff,0xffffffff], ...extra });
const effect = (name, level) => Number(Object.entries(catalog.gemEffects).find(([,v]) => v.name === name && v.level === level)[0]);

test('effect families use the game colors, including poison, scaling, and conditional effects', () => {
  for (const [text,color] of [
    ['Physical ATK UP +12%','red'], ['Thrust ATK UP +10%','red'], ['STR scaling +20','red'],
    ['Add blood ATK +5','blue'], ['Bloodtinge scaling +4','blue'], ['ATK vs beasts UP +10%','blue'],
    ['Fire ATK UP +7%','orange'], ['ATK vs the kin UP +10%','orange'], ['Bolt ATK UP +7%','yellow'],
    ['Add slow poison effect +5','purple'], ['Add rapid poison effect +5','purple'],
    ['Arcane scaling +5','white'], ['Arcane ATK UP +7%','white'],
    ['Reduces stamina costs +2%','green'], ['Phys. UP at full HP +3%','green'],
    ['Charge ATKs UP +10%','green'], ['HP continues to recover +2','green'], ['WPN durability UP +4','green'],
  ]) assert.equal(gemColor(text),color,text);
  assert.equal(gemColor('No Effect'),null);
});

test('visual level comes from primary gem metadata, not rating or a secondary effect', () => {
  for (let rating=1; rating<=20; rating++) {
    const id=13100+rating, v=gemVisual(gem(id),catalog);
    const expected=rating<=4?1:rating<=7?2:rating<=10?3:rating<=13?4:rating<=16?5:rating<=19?6:7;
    assert.equal(v.level,expected); assert.equal(v.rating,rating);
    assert.match(v.fallback,new RegExp(`/${expected}\\.webp$`));
  }
  const v=gemVisual(gem(13101,1,{effects:[13101,13120,0xffffffff,0xffffffff,0xffffffff,0xffffffff]}),catalog);
  assert.equal(v.level,1);
});

test('shape and curse effects independently select the correct variants', () => {
  const primary=effect('Tempering Damp Blood Gem (6)',6);
  const curse=Number(Object.entries(catalog.gemEffects).find(([,v])=>v.effect.startsWith('Increases stamina costs'))[0]);
  for (const [shape,name] of [[1,'radial'],[2,'triangle'],[4,'waning'],[8,'circle'],[63,'droplet']]) {
    const normal=gemVisual(gem(primary,shape),catalog);
    assert.equal(normal.cursed,false); assert.equal(normal.fallback,`gems/${name}/red/6.webp`);
    const cursed=gemVisual(gem(primary,shape,{effects:[primary,0xffffffff,curse,0xffffffff,0xffffffff,0xffffffff]}),catalog);
    assert.equal(cursed.cursed,true); assert.equal(cursed.fallback,`gems/${name}/red/cursed_6.webp`);
    assert.match(cursed.name,/^Cursed /);
    assert.ok(fs.existsSync(asset(normal.image))); assert.ok(fs.existsSync(asset(cursed.image)));
  }
  assert.equal(gemVisual(gem(13101),catalog).cursed,false);
});

test('all curse families are detected, while beneficial stamina reductions remain normal', () => {
  const seen=new Set();
  for (const [id,info] of Object.entries(catalog.gemEffects)) {
    if (!/^Cursed /.test(info.name) && !info.effect.startsWith('Increases stamina costs')) continue;
    const family=info.effect.split(/ [-+]/)[0];
    if (seen.has(family)) continue; seen.add(family);
    assert.equal(gemVisual(gem(13101,1,{effects:[13101,Number(id),0xffffffff,0xffffffff,0xffffffff,0xffffffff]}),catalog).cursed,true,family);
  }
  assert.ok(seen.size>=6);
  const radiant=Number(Object.entries(catalog.gemEffects).find(([,v])=>v.effect.startsWith('Reduces stamina costs'))[0]);
  assert.equal(gemVisual(gem(radiant),catalog).cursed,false);
});

test('unique Red, Tear, and Gold gems require the source ID, primary effect, and shape', () => {
  for (const [id,shape,source,name] of [[3126204,63,2147633648,'Red Blood Gem'],[3143408,63,2147633649,'Tear Blood Gem'],[3133407,1,2147633650,'Gold Blood Gem']]) {
    const v=gemVisual(gem(id,shape,{source}),catalog);
    assert.equal(v.name,name); assert.match(v.fallback,/gems\/unique\//); assert.ok(fs.existsSync(asset(v.image)));
    assert.notEqual(gemVisual(gem(id,shape,{source:0}),catalog).name,name);
    assert.notEqual(gemVisual(gem(id,2,{source}),catalog).name,name);
  }
});

test('every catalog gem resolves to a real local asset for all five shapes', () => {
  const files=new Set();
  for (const [id,info] of Object.entries(catalog.gemEffects)) for (const shape of [1,2,4,8,63]) {
    const v=gemVisual(gem(Number(id),shape),catalog);
    if (info.level===0) { assert.equal(v,null); continue; }
    assert.ok(v,`${id}: ${info.effect}`); assert.equal(v.level,info.level); files.add(v.image); files.add(v.fallback);
  }
  for (const file of files) assert.ok(fs.existsSync(asset(file)),file);
  assert.equal(gemVisual(gem(123456789),catalog),null);
  assert.equal(gemVisual(gem(13101,999),catalog),null);
  assert.equal(gemVisual({kind:2},catalog),null);
});

const data=Object.fromEntries(['items','weapons','armors','bosses','upgrades','offsets'].map(name=>[name,JSON.parse(fs.readFileSync(new URL(`../public/data/${name}.json`,import.meta.url)))]));

test('source IDs and gem icons survive reopening upstream fixtures', { skip: !hasUpstreamFixtures }, () => {
  for (let n=0;n<10;n++) {
    const input=readUpstreamFixture(n);
    const editor=new SaveEditor(input,data);
    for (const upgrade of editor.upgrades.filter(u=>u.kind===1)) {
      assert.equal(upgrade.source,editor.u32(upgrade.offset+4));
      const v=gemVisual(upgrade,catalog);
      if (catalog.gemEffects[upgrade.effects[0]]?.level>0) assert.ok(v);
      if (v) assert.ok(fs.existsSync(asset(v.image)));
    }
    assert.deepEqual(editor.bytes,input);
  }
});

test('gem icons respond to shape and effect edits in the bundled example', () => {
  const editor=new SaveEditor(new Uint8Array(fs.readFileSync(new URL('../public/userdata0000',import.meta.url))),data);
  const upgrade=editor.upgrades.find(u=>u.kind===1);
  editor.transaction('shape',()=>editor.setShape(upgrade,2));
  let current=editor.upgrades.find(u=>u.offset===upgrade.offset);
  assert.equal(gemVisual(current,catalog).shape,'Triangle');
  const fire=effect('Fire Abyssal Blood Gem',7);
  editor.transaction('effect',()=>editor.setEffect(current,0,fire));
  current=new SaveEditor(editor.bytes,data).upgrades.find(u=>u.offset===upgrade.offset);
  assert.equal(gemVisual(current,catalog).color,'orange'); assert.equal(gemVisual(current,catalog).level,7);
});
