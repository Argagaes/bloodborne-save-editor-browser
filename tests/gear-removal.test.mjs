import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SaveEditor } from '../src/save-engine.js';
import { primaryVariants,closestVariantForLevel } from '../src/gem-edit.js';
import { isCurseEffect } from '../src/gem-special.js';
const read=name=>JSON.parse(fs.readFileSync(new URL(`../public/data/${name}.json`,import.meta.url)));
const data=Object.fromEntries(['items','weapons','armors','bosses','upgrades','offsets','lamps','shortcuts','shortcut-auxiliary','rune-templates'].map(name=>[name,read(name)]));
const make=()=>new SaveEditor(fs.readFileSync(new URL('../public/userdata0000',import.meta.url)),data);
const none=0xffffffff;

test('remove loose gems and runes, reload, and undo without changing neighboring bytes',()=>{
  for(const template of [{kind:1,source:0x80016094,shape:1,effects:[126314,none,none,none,none,none]},{kind:2,...data['rune-templates'][0]}]){
    const e=make();e.transaction('add',()=>e.addUpgrade(template));const u=e.upgrades.findLast(x=>x.kind===template.kind&&x.location==='inventory'&&x.effects[0]===template.effects[0]);
    const before=e.bytes.slice(),slot=u.inventoryOffset,offset=u.offset,id=u.id;
    assert.ok(e.transaction('remove',()=>e.removeUpgrade(u)));
    for(let i=0;i<before.length;i++) if(i<slot+4||i>=slot+16) assert.equal(e.bytes[i],before[i]);
    const reopened=new SaveEditor(e.bytes,data),removed=reopened.upgrades.find(x=>x.id===id);
    assert.equal(removed.location,'unreferenced');assert.equal(removed.offset,offset);
    assert.equal(reopened.u32(slot+4),0);assert.equal(reopened.u32(slot+8),none);assert.equal(reopened.u32(slot+12),0);
    e.undo();assert.deepEqual(e.bytes,before);
  }
});
test('weapon removal returns socketed gems and is atomic and undoable',()=>{
  const e=make(), id=Number(Object.keys(data.weapons.rightHand)[0]);
  e.transaction('add weapon',()=>e.addItem(id,1,'inventory','weapon'));
  let weapon=e.articles.findLast(a=>a.family==='weapon'&&a.id===id&&a.location==='inventory');
  e.transaction('open slot',()=>e.slotShape(weapon.slots[0],1));
  e.transaction('add gem',()=>e.addUpgrade({kind:1,source:0x80016094,shape:1,effects:[126314,none,none,none,none,none]}));
  weapon=e.articles.find(a=>a.first===weapon.first);const gem=e.upgrades.findLast(u=>u.kind===1&&u.effects[0]===126314&&u.location==='inventory');
  e.transaction('equip',()=>e.equip(weapon.slots[0],gem));weapon=e.articles.find(a=>a.first===weapon.first);
  const before=e.bytes.slice(), handle=weapon.first;
  e.transaction('remove weapon',()=>e.removeArticle(weapon));
  const r=new SaveEditor(e.bytes,data);assert.ok(!r.articles.some(a=>a.first===handle));assert.equal(r.upgrades.find(u=>u.id===gem.id).location,'inventory');
  e.undo();assert.deepEqual(e.bytes,before);
});
test('remove ordinary items and armor using the inventory entry, and reject stale references',()=>{
  for(const [family,id] of [['item',1000],['armor',Number(Object.keys(data.armors)[0])]]){
    const e=make();e.transaction('add',()=>e.addItem(id,1,'inventory',family));const item=e.articles.findLast(x=>x.family===family&&x.id===id);const before=e.bytes.slice();
    e.transaction('remove',()=>e.removeArticle(item));const r=new SaveEditor(e.bytes,data);assert.ok(!r.articles.some(a=>a.offset===item.offset));
    assert.throws(()=>e.transaction('stale',()=>e.removeArticle(item)),/changed/);e.undo();assert.deepEqual(e.bytes,before);
  }
});
test('rating variants stay within the primary effect family and curse toggle preserves other slots',()=>{
  const e=make(), effects=data.upgrades.gemEffects, variants=primaryVariants(126314,effects);
  assert.ok(variants.some(v=>v.id===126320&&v.rating===20));assert.ok(closestVariantForLevel(variants,7,14));assert.deepEqual(primaryVariants(3143408,effects),[]);
  e.transaction('add gem',()=>e.addUpgrade({kind:1,source:0x80016094,shape:1,effects:[126314,17112,none,none,none,none]}));
  let gem=e.upgrades.findLast(u=>u.kind===1&&u.effects[0]===126314&&u.location==='inventory');
  e.transaction('curse',()=>e.setGemCursed(gem,true));gem=e.upgrades.find(x=>x.id===gem.id);assert.equal(gem.effects[1],17112);assert.ok(gem.effects.some(id=>isCurseEffect(effects[id])));
  e.transaction('uncurse',()=>e.setGemCursed(gem,false));gem=e.upgrades.find(x=>x.id===gem.id);assert.equal(gem.effects[1],17112);assert.ok(!gem.effects.some(id=>isCurseEffect(effects[id])));
  e.transaction('rating',()=>e.setEffect(gem,0,126320));assert.equal(e.upgrades.find(x=>x.id===gem.id).effects[0],126320);
});

test('clone gems preserves all effects and source, assigns a new ID, reloads and undoes',()=>{
 const e=make(),template={kind:1,source:0x80016094,shape:63,effects:[126314,17112,42118,none,none,41218]};
 e.transaction('add',()=>e.addUpgrade(template,'storage'));
 const original=e.upgrades.findLast(u=>u.kind===1&&u.location==='storage'&&u.effects[0]===template.effects[0]);
 const before=e.bytes.slice(),ids=new Set(e.upgrades.map(u=>u.id));
 e.transaction('clone',()=>e.cloneGem(original));
 const clone=e.upgrades.find(u=>!ids.has(u.id));assert.ok(clone);assert.equal(clone.location,'storage');assert.equal(clone.source,original.source);assert.equal(clone.shape,original.shape);assert.deepEqual(clone.effects,original.effects);
 const reloaded=new SaveEditor(e.bytes,data);assert.deepEqual(reloaded.upgrades.find(u=>u.id===clone.id).effects,original.effects);
 e.undo();assert.deepEqual(e.bytes,before);
});

test('cloning a rune retains its type, source and all effects and supports undo',()=>{
 const e=make(),template={kind:2,...data['rune-templates'][0]};
 e.transaction('add',()=>e.addUpgrade(template));
 const original=e.upgrades.findLast(u=>u.kind===2&&u.location==='inventory'&&u.source===template.source),before=e.bytes.slice(),ids=new Set(e.upgrades.map(u=>u.id));
 e.transaction('clone rune',()=>e.cloneRune(original));const clone=e.upgrades.find(u=>!ids.has(u.id));
 assert.equal(clone.kind,2);assert.equal(clone.shape,original.shape);assert.equal(clone.source,original.source);assert.deepEqual(clone.effects,original.effects);
 assert.deepEqual(new SaveEditor(e.bytes,data).upgrades.find(u=>u.id===clone.id).effects,original.effects);e.undo();assert.deepEqual(e.bytes,before);
});
