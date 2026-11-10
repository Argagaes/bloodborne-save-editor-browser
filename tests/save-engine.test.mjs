import nodeTest from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SaveEditor } from '../src/save-engine.js';
import { hasUpstreamFixtures, readUpstreamFixture as fixture } from './upstream-fixtures.mjs';
const test = hasUpstreamFixtures ? nodeTest : nodeTest.skip;
const data=Object.fromEntries(['items','weapons','armors','bosses','upgrades','offsets'].map(name=>[name,JSON.parse(fs.readFileSync(new URL(`../public/data/${name}.json`,import.meta.url)))]));
const load=n=>new SaveEditor(fixture(n),data);
const reparse=s=>new SaveEditor(s.bytes,data);
const names=['Proyectito','Toe Taster',"I'm Here To Help",'Yeezy','YT: olletnaS','YT: olletnaS','Touch Me','Control','Yew','Touch Me'];

test('all ten repository saves open and round-trip byte for byte',()=>{
  for(let i=0;i<10;i++){
    const input=fixture(i),s=new SaveEditor(input,data);
    assert.equal(s.username,names[i]);assert.deepEqual(s.bytes,input);assert.equal(s.changedBytes,0);
    assert.ok(s.articles.length>20);assert.ok(s.upgrades.length);assert.ok(s.coordinates().every(Number.isFinite));
    assert.equal(reparse(s).username,s.username);
  }
});
test('attribute writes update repeated fields and preserve every unrelated byte',()=>{
  const s=load(0),before=s.bytes.slice(),def=data.offsets.find(x=>x.name==='Health');
  s.transaction('health',()=>s.setStat('Health',1234));
  const allowed=new Set();for(let i=0;i<3;i++)for(let j=0;j<4;j++)allowed.add(s.usernameOffset+def.rel_offset+i*4+j);
  for(let i=0;i<s.bytes.length;i++)if(!allowed.has(i))assert.equal(s.bytes[i],before[i]);
  for(let i=0;i<3;i++)assert.equal(s.u32(s.usernameOffset+def.rel_offset+4*i),1234);
  assert.equal(reparse(s).stats.Health,1234);
});
test('undo, redo and rollback restore exact bytes',()=>{
  const s=load(1),before=s.bytes.slice();s.transaction('echoes',()=>s.setStat('Echoes',98765));const edited=s.bytes.slice();
  s.undo();assert.deepEqual(s.bytes,before);s.redo();assert.deepEqual(s.bytes,edited);
  assert.throws(()=>s.transaction('invalid',()=>{s.setName('Test');s.setStat('Insight',-1);}));assert.deepEqual(s.bytes,edited);
  s.undo();s.transaction('insight',()=>s.setStat('Insight',45));assert.equal(s.redoHistory.length,0);
});
test('invalid files and out-of-range values are rejected',()=>{
  assert.throws(()=>new SaveEditor(new Uint8Array(),data));assert.throws(()=>new SaveEditor(new Uint8Array(200000),data));
  const s=load(7);for(const value of [-1,1.5,4294967296,NaN,''])assert.throws(()=>s.setStat('Echoes',value));
  assert.throws(()=>s.setName(''));assert.throws(()=>s.setName('12345678901234567'));assert.throws(()=>s.setName('☽'));
  assert.throws(()=>s.importAppearance(new Uint8Array(234)));assert.throws(()=>s.setCoordinates([NaN,0,0]));
});
test('name, appearance, playtime and coordinates survive reloading',()=>{
  const s=load(2),face=s.appearance();face[10]^=1;
  s.transaction('identity',()=>{s.setName('New Hunter');s.importAppearance(face);s.put(8,1234567);s.setCoordinates([1.25,-2.5,30]);});
  const r=reparse(s);assert.equal(r.username,'New Hunter');assert.deepEqual(r.appearance(),face);assert.equal(r.u32(8),1234567);assert.deepEqual(r.coordinates(),[1.25,-2.5,30]);
});
test('inventory and storage quantities and transformations keep correct records',()=>{
  const s=load(0);for(const location of ['inventory','storage']){
    const a=s.articles.find(a=>a.family==='item'&&a.category!=='key'&&a.location===location);assert.ok(a);
    s.transaction('quantity',()=>s.quantity(a,42));assert.equal(reparse(s).articles.find(x=>x.offset===a.offset).amount,42);
    s.transaction('transform',()=>s.transform(a,100));const b=reparse(s).articles.find(x=>x.offset===a.offset);assert.equal(b.id,100);assert.equal(b.info.item_name,"Hunter's Mark");
  }
});
test('adding goods and equipment preserves size, stats, and inventory counters',()=>{
  for(const location of ['inventory','storage'])for(const family of ['item','weapon','armor']){
    const s=load(7),before=s.bytes.length,stats={...s.stats},name=s.username,ga=s.equipment.size;
    const id=Number(family==='item'?Object.keys(data.items.material)[0]:family==='armor'?Object.keys(data.armors)[0]:Object.keys(data.weapons.rightHand)[0]);
    const n=s.articles.filter(a=>a.location===location).length,counter=s.u32(s.usernameOffset+(location==='storage'?68541:34257));
    s.transaction('add',()=>s.addItem(id,5,location,family));const r=reparse(s);
    assert.equal(s.bytes.length,before);assert.equal(r.username,name);assert.deepEqual(r.stats,stats);assert.equal(r.articles.filter(a=>a.location===location).length,n+1);
    assert.equal(r.u32(r.usernameOffset+(location==='storage'?68541:34257)),counter+1);
    if(family!=='item')assert.equal(r.equipment.size,ga+1);
    const a=r.articles.find(a=>a.id===id&&a.location===location&&a.amount===(family==='item'?5:1));assert.ok(a);
  }
});
test('weapon upgrades update both inventory and equipment records',()=>{
  for(const location of ['inventory','storage']){
    const s=load(7);s.transaction('add weapon',()=>s.addItem(2000000,1,location,'weapon'));
    const a=s.articles.find(a=>a.family==='weapon'&&a.ga!==undefined&&a.location===location);assert.ok(a);
    s.transaction('upgrade',()=>s.weaponLevel(a,10));const b=reparse(s).articles.find(x=>x.offset===a.offset);assert.equal(b.level,10);assert.equal(s.u32(b.ga+4),b.second);
  }
});
test('gems support six effect edits and shape changes after reloading',()=>{
  const s=load(3),u=s.upgrades.find(u=>u.kind===1);
  s.transaction('gem',()=>{s.setShape(u,63);for(let j=0;j<6;j++)s.setEffect(u,j,j===5?0xffffffff:13101);});
  const r=reparse(s).upgrades.find(x=>x.id===u.id);assert.equal(r.shape,63);assert.deepEqual(r.effects,[13101,13101,13101,13101,13101,0xffffffff]);
});
test('equipping and unequipping move gems without losing or duplicating them',()=>{
  const s=load(3),a=s.articles.find(a=>a.family==='weapon'&&a.slots.some(slot=>!slot.gem));const slot=a.slots.find(slot=>!slot.gem),u=s.upgrades.find(u=>u.kind===1&&u.location==='inventory');assert.ok(u);
  s.transaction('equip',()=>{s.slotShape(slot,1);s.setShape(u,1);s.equip({...slot,shape:1}, {...u,shape:1});});
  let r=reparse(s);assert.equal(r.u32(slot.offset+4),u.id);assert.equal(r.upgrades.find(x=>x.id===u.id).location,'equipped');
  const current=r.articles.find(x=>x.offset===a.offset).slots.find(x=>x.offset===slot.offset);
  r.transaction('unequip',()=>r.unequip(current));r=reparse(r);assert.equal(r.u32(slot.offset+4),0);assert.equal(r.upgrades.filter(x=>x.id===u.id).length,1);assert.equal(r.upgrades.find(x=>x.id===u.id).location,'inventory');
});
test('boss state and shared multiplayer masks preserve neighboring bits',()=>{
  const s=load(3),b=data.bosses.find(x=>x.name==='Cleric Beast'),f=b.flags.find(x=>x._comment==='mp'),o=s.flagOffset+f.rel_offset;
  s.put(o,0xff,1);s.transaction('revive',()=>s.setBoss(b,false));assert.equal(reparse(s).bossDead(b),false);assert.equal(s.bytes[o],0xff&f.alive_value);
  const other=data.bosses.find(x=>x.name==='Father Gascoigne');s.transaction('kill',()=>{s.setBoss(other,true);s.setBoss(b,true);});assert.equal(reparse(s).bossDead(b),true);assert.ok(s.bytes[o]&f.dead_value);
});
test('world flags reproduce desktop byte sequences and lantern travel updates map',()=>{
  const s=load(7);s.transaction('world',()=>{s.worldFlag('maria');s.worldFlag('lullaby');s.teleport({x:-8,y:-6,z:-18,mapId:[21,0]});});
  assert.deepEqual([...s.bytes.slice(s.flagOffset+1083,s.flagOffset+1085)],[0,8]);assert.deepEqual([...s.bytes.slice(s.flagOffset+6689,s.flagOffset+6691)],[8,1]);
  assert.deepEqual([...s.bytes.slice(4,8)],[0,0,0,21]);assert.deepEqual(reparse(s).coordinates(),[-8,-6,-18]);
});
