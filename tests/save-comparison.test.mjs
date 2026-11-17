import test from 'node:test';
import assert from 'node:assert/strict';
import { compareSaves } from '../src/save-comparison.js';

test('compares changed fields and aggregates duplicate inventory entries without mutating saves', () => {
  const item = amount => ({location:'inventory', family:'item', second:42, id:42, info:{item_name:'Blood Vial'}, amount});
  const make = (vitality, articles, flag) => ({username:'Hunter', stats:{Vitality:vitality}, articles, bossDead:()=>flag, lampEnabled:()=>flag, shortcutEnabled:()=>flag});
  const a=make(10,[item(2),item(3)],false), b=make(11,[item(4)],true);
  const data={bosses:[{name:'Cleric Beast'}], lamps:[{area:'Yharnam',name:'Lamp',eventFlag:1}], shortcuts:[{area:'Yharnam',name:'Gate',eventFlag:2}]};
  const groups=compareSaves(a,b,data);
  assert.deepEqual(groups.map(x=>x.title), ['Hunter','Inventory and storage','Bosses defeated','Lamps unlocked','Shortcuts open']);
  assert.deepEqual(groups[1].rows[0], {label:'Blood Vial (inventory, #42)',left:'5',right:'4'});
  assert.deepEqual(compareSaves(a,a,data), []);
  assert.equal(a.articles[0].amount, 2);
});
import fs from 'node:fs';
import { SaveEditor } from '../src/save-engine.js';
import { compareQuestFlags } from '../src/quest-comparison.js';
import { writeQuestFlag, inferQuestFlagGroups } from '../src/quest-flags.js';

test('compares mapped NPC death and unassigned state flags without modifying saves',()=>{
  const data=Object.fromEntries(['items','weapons','armors','bosses','upgrades','offsets','lamps','shortcuts','shortcut-auxiliary'].map(name=>[name,JSON.parse(fs.readFileSync(new URL(`../public/data/${name}.json`,import.meta.url)))]));
  const bytes=fs.readFileSync(new URL('../public/userdata0000',import.meta.url));
  const a=new SaveEditor(bytes,data), b=new SaveEditor(bytes,data);
  const base=inferQuestFlagGroups(data)[1];
  for(const id of [1368,1290]) {const address=a.flagOffset+base+Math.floor((id%1000)/8),mask=0x80>>(id%8);writeQuestFlag(a,id,base,!(a.bytes[address]&mask));}
  const before=a.bytes.slice(), result=compareQuestFlags(a,b,data);
  assert.ok(result.rows.some(x=>x.label.includes('Flag 1368')&&x.label.includes('Eileen')&&x.label.includes('death')));
  assert.ok(result.rows.some(x=>x.label.includes('Flag 1290')&&x.label.includes('Unassigned')));
  assert.equal(result.unavailable,0);assert.ok(result.compared>0);
  assert.ok(compareSaves(a,b,data).some(group=>group.title==='NPC quest and related flags (inferred)'));
  assert.deepEqual(a.bytes,before);assert.deepEqual(b.bytes,new Uint8Array(bytes));
});
