import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SaveEditor} from '../src/save-engine.js';
import {registerExperimentalEquipment} from '../src/experimental-equipment.js';
const read=n=>JSON.parse(fs.readFileSync(new URL(`../public/data/${n}.json`,import.meta.url)));
const data=registerExperimentalEquipment(Object.fromEntries(['items','weapons','armors','bosses','upgrades','offsets','lamps','shortcuts','shortcut-auxiliary','experimental-equipment'].map(n=>[n,read(n)])));
test('experimental weapons and armor can be added, reopened, removed, and undone',()=>{
 for(const family of ['weapon','armor']) {
  const item=data['experimental-equipment'].find(x=>x.family===family),e=new SaveEditor(fs.readFileSync(new URL('../public/userdata0000',import.meta.url)),data),before=e.bytes.slice();
  e.transaction('add research equipment',()=>e.addItem(item.id,1,'inventory',family));
  const reloaded=new SaveEditor(e.bytes,data),article=reloaded.articles.find(a=>a.family===family&&a.id===item.id&&a.info.experimental);
  assert.ok(article,`${family} ${item.id}`);assert.equal(article.info.item_name,item.name);
  reloaded.transaction('remove research equipment',()=>reloaded.removeArticle(article));assert.equal(reloaded.articles.some(a=>a.first===article.first),false);
  e.undo();assert.deepEqual(e.bytes,before);
 }
});
