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
