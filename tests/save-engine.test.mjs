import nodeTest from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SaveEditor } from '../src/save-engine.js';
import { hasUpstreamFixtures, readUpstreamFixture as fixture } from './upstream-fixtures.mjs';
const test = hasUpstreamFixtures ? nodeTest : nodeTest.skip;
const data=Object.fromEntries(['items','weapons','armors','bosses','upgrades','offsets','lamps','shortcuts','shortcut-auxiliary'].map(name=>[name,JSON.parse(fs.readFileSync(new URL(`../public/data/${name}.json`,import.meta.url)))]));
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


test('lamp unlocks preserve unrelated bits and support undo',()=>{
  const s=load(0), lamps=data.lamps, target=lamps.find(l=>l.eventFlag===12417830);
  const o=s.flagOffset+target.offset; s.bytes[o] &= ~target.mask;
  const before=s.bytes.slice();
  s.transaction('unlock lamp',()=>s.unlockLamp(target.eventFlag));
  assert.equal(s.bytes[o],before[o]|target.mask);
  assert.equal(s.bytes.reduce((n,b,i)=>n+(b!==before[i]),0),1);
  s.undo(); assert.deepEqual(s.bytes,before);
  s.transaction('unlock all',()=>s.unlockAllLamps());
  for(const lamp of lamps) assert.ok(s.bytes[s.flagOffset+lamp.offset]&lamp.mask);
  const offsets=new Set(lamps.map(l=>s.flagOffset+l.offset));
  for(let i=0;i<s.bytes.length;i++) if(!offsets.has(i)) assert.equal(s.bytes[i],before[i]);
  s.undo(); assert.deepEqual(s.bytes,before);
  assert.throws(()=>s.unlockLamp(1));
});


test('lamp groups set and clear only their bits, preserving others and undoing atomically',()=>{
  const s=load(0), lamps=data.lamps;
  const area=lamps.filter(l=>l.area==='Central Yharnam');
  assert.equal(area.length,4);
  const flags=area.map(l=>l.eventFlag);
  s.transaction('enable all',()=>s.setLamps(lamps.map(l=>l.eventFlag),true));
  assert.ok(lamps.every(l=>s.lampEnabled(l.eventFlag)));
  const allEnabled=s.bytes.slice();
  s.transaction('disable area',()=>s.setLamps(flags,false));
  for(const lamp of lamps) assert.equal(s.lampEnabled(lamp.eventFlag),!flags.includes(lamp.eventFlag));
  const allowed=new Set(area.map(l=>s.flagOffset+l.offset));
  for(let i=0;i<s.bytes.length;i++) if(!allowed.has(i)) assert.equal(s.bytes[i],allEnabled[i]);
  for(const lamp of area) assert.equal((s.bytes[s.flagOffset+lamp.offset]^allEnabled[s.flagOffset+lamp.offset]) & ~lamp.mask,0);
  s.undo();assert.deepEqual(s.bytes,allEnabled);
  s.transaction('disable all',()=>s.setLamps(lamps.map(l=>l.eventFlag),false));
  assert.ok(lamps.every(l=>!s.lampEnabled(l.eventFlag)));
  const locked=s.bytes.slice();
  assert.throws(()=>s.setLamps([flags[0],1],true));assert.deepEqual(s.bytes,locked);
  s.undo();assert.deepEqual(s.bytes,allEnabled);
});


test('verified main-street shortcut opens and locks without altering neighboring bits',()=>{
  const s=load(0),shortcut=data.shortcuts[0],offset=s.flagOffset+shortcut.offset;
  s.bytes[offset] &= ~shortcut.mask;
  const before=s.bytes.slice();
  s.transaction('open gate',()=>s.setShortcuts([shortcut.eventFlag],true));
  assert.equal(s.shortcutEnabled(shortcut.eventFlag),true);
  assert.equal(s.bytes[offset],before[offset]|shortcut.mask);
  assert.equal(s.bytes.reduce((n,b,i)=>n+(b!==before[i]),0),1);
  const open=s.bytes.slice();
  s.transaction('lock gate',()=>s.setShortcuts([shortcut.eventFlag],false));
  assert.deepEqual(s.bytes,before);
  s.undo();assert.deepEqual(s.bytes,open);
  assert.throws(()=>s.setShortcuts([shortcut.eventFlag,1],false));assert.deepEqual(s.bytes,open);
});


test('shortcut group toggles preserve unrelated bits even when shortcuts share a byte',()=>{
  const s=load(0), shortcuts=data.shortcuts, ids=shortcuts.map(x=>x.eventFlag);
  assert.ok(shortcuts.length>5);
  s.transaction('open shortcuts',()=>s.setShortcuts(ids,true));
  assert.ok(shortcuts.every(x=>s.shortcutEnabled(x.eventFlag)));
  const open=s.bytes.slice();
  const masks=new Map();for(const x of shortcuts){const at=s.flagOffset+x.offset;masks.set(at,(masks.get(at)||0)|x.mask);}
  s.transaction('lock shortcuts',()=>s.setShortcuts(ids,false));
  assert.ok(shortcuts.every(x=>!s.shortcutEnabled(x.eventFlag)));
  for(let i=0;i<s.bytes.length;i++) assert.equal(s.bytes[i],open[i]&~(masks.get(i)||0));
  s.undo();assert.deepEqual(s.bytes,open);
});


test('global shortcut control clears auxiliary flags and restores original auxiliary bits',()=>{
  const s=load(0),aux=data['shortcut-auxiliary'];assert.equal(aux.length,11);
  const before=s.bytes.slice();s.transaction('open all',()=>s.setAllShortcuts(true));
  assert.ok(s.allShortcutsEnabled());
  for(const entry of aux)assert.equal(s.bytes[s.flagOffset+entry.offset]&entry.mask,0);
  s.transaction('lock all',()=>s.setAllShortcuts(false));
  for(const entry of data.shortcuts)assert.equal(s.shortcutEnabled(entry.eventFlag),false);
  for(const entry of aux)assert.equal(s.bytes[s.flagOffset+entry.offset]&entry.mask,before[s.originalFlagOffset+entry.offset]&entry.mask);
});

test('adding gem and rune templates preserves records and supports undo',()=>{
  const none=0xffffffff;
  for(const [kind,source,shape,effects] of [[1,0x80016094,1,[126314,17112,none,none,none,none]],[2,0x800186a1,1,[1100000,none,none,none,none,none]]]){
    const s=load(0),before=s.bytes.slice(),count=s.upgrades.length;
    s.transaction('add upgrade',()=>s.addUpgrade({kind,source,shape,effects}));
    const r=reparse(s),u=r.upgrades.find(x=>x.id===Math.max(...r.upgrades.map(x=>x.id)));
    assert.equal(r.upgrades.length,count+1);assert.equal(u.kind,kind);assert.equal(u.source,source);assert.equal(u.location,'inventory');assert.deepEqual(u.effects,effects);assert.equal(r.u32(u.inventoryOffset+8),source);assert.equal(r.username,s.username);
    s.undo();assert.deepEqual(s.bytes,before);
  }
});
test('editing a unique gem updates its source in both records',()=>{
  const s=load(0);s.transaction('add special',()=>s.addUpgrade({kind:1,source:0x800249f0,shape:63,effects:[3126204,3045204,0xffffffff,0xffffffff,0xffffffff,0xffffffff]}));
  const gem=s.upgrades.find(u=>u.source===0x800249f0&&u.location==='inventory');assert.ok(gem);
  s.transaction('edit special',()=>s.setEffect(gem,0,126314));const u=reparse(s).upgrades.find(x=>x.id===gem.id);
  assert.equal(u.source,0x80016094);assert.equal(reparse(s).u32(u.inventoryOffset+8),u.source);assert.equal(u.effects[0],126314);
});

test('adding a gem to a save with nonzero trailing bytes keeps the fixed-size layout',()=>{
  const s=load(7),before=s.bytes.slice(),oldName=s.username,oldStats={...s.stats},oldArticles=s.articles.length,oldUpgrades=s.upgrades.length;
  assert.ok(before.slice(-32).some(Boolean));
  const none=0xffffffff;
  s.transaction('add bloodtinge gem',()=>s.addUpgrade({kind:1,source:0x80016094,shape:8,effects:[13513,none,none,none,none,none]}));
  const r=reparse(s),added=r.upgrades.find(u=>u.kind===1&&u.shape===8&&u.effects[0]===13513&&u.location==='inventory');
  assert.ok(added);assert.equal(r.bytes.length,before.length);assert.equal(r.username,oldName);assert.deepEqual(r.stats,oldStats);assert.equal(r.articles.length,oldArticles);assert.equal(r.upgrades.length,oldUpgrades+1);
  assert.deepEqual(r.bytes.slice(-64),before.slice(-96,-32));
  s.undo();assert.deepEqual(s.bytes,before);
});

test('all rune templates retain their game source, type and effects when added',()=>{
  const templates=JSON.parse(fs.readFileSync(new URL('../public/data/rune-templates.json',import.meta.url)));
  assert.equal(templates.length,73);assert.ok(templates.some(t=>data.upgrades.runeEffects[t.id]?.name==='Milkweed'));
  for(const t of templates){
    const s=load(0);s.transaction('add rune',()=>s.addUpgrade({kind:2,source:t.source,shape:t.shape,effects:t.effects}));
    const u=reparse(s).upgrades.find(x=>x.kind===2&&x.source===t.source&&x.effects[0]===t.id&&x.location==='inventory');
    assert.ok(u,`missing rune ${t.id}`);assert.equal(u.shape,t.shape);assert.deepEqual(u.effects,t.effects);
  }
});

test('modified-byte count ignores data shifted by inserted upgrade and equipment records',()=>{
  for(const add of [s=>s.addUpgrade({kind:1,source:0x80016094,shape:1,effects:[126314,17112,0xffffffff,0xffffffff,0xffffffff,0xffffffff]}),s=>s.addItem(2000000,1,'inventory','weapon')]) {
    const s=load(7);assert.equal(s.changedBytes,0);s.transaction('add',()=>add(s));const count=s.changedBytes;
    assert.ok(count>=40&&count<100,`unexpected count ${count}`);
    const changed=s.bytes.slice();s.transaction('stat',()=>s.setStat('Insight',45));assert.ok(s.changedBytes>=count&&s.changedBytes<count+20);
    s.undo();assert.deepEqual(s.bytes,changed);assert.equal(s.changedBytes,count);
    s.undo();assert.equal(s.changedBytes,0);s.redo();assert.equal(s.changedBytes,count);
  }
});
