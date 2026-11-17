import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SaveEditor } from '../src/save-engine.js';
import { registerExperimentalItems } from '../src/experimental-items.js';
const read=name=>JSON.parse(fs.readFileSync(new URL(`../public/data/${name}.json`,import.meta.url)));
const data=Object.fromEntries(['items','weapons','armors','bosses','upgrades','offsets','lamps','shortcuts','shortcut-auxiliary','experimental-items'].map(name=>[name,read(name)]));
registerExperimentalItems(data);
test('only surviving missing wiki entries become experimental item records',()=>{
  assert.equal(data['experimental-items'].length,72);
  assert.equal(data['experimental-items'].filter(x=>x.present).length,52);
  assert.equal(data['experimental-items'].find(x=>x.id===7101).present,false);
  assert.equal(data.items.research[7101],undefined);
  assert.ok(data.items.research[11310]);
  assert.equal(data.items.consumable[100].item_name,"Hunter's Mark");
});
test('adding an experimental item round trips and undo restores the save',()=>{
  const input=fs.readFileSync(new URL('../public/userdata0000',import.meta.url));
  const editor=new SaveEditor(input,data), before=editor.bytes.slice();
  assert.ok(editor.transaction('experimental item',()=>editor.addItem(11310,1)));
  const reopened=new SaveEditor(editor.bytes,data);
  const item=reopened.articles.find(x=>x.family==='item'&&x.id===11310);
  assert.equal(item?.info.item_name,'Enchantment: Magic');
  assert.equal(item?.location,'inventory');
  editor.undo();assert.deepEqual(editor.bytes,before);
  assert.throws(()=>editor.transaction('unavailable',()=>editor.addItem(7101,1)),/Unknown item/);
});
