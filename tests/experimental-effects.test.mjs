import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SaveEditor } from '../src/save-engine.js';
import { registerExperimentalEffects } from '../src/experimental-effects.js';
const read=name=>JSON.parse(fs.readFileSync(new URL(`../public/data/${name}.json`,import.meta.url)));
const data=Object.fromEntries(['items','weapons','armors','bosses','upgrades','offsets','lamps','shortcuts','shortcut-auxiliary','rune-templates','experimental-effects'].map(name=>[name,read(name)]));
registerExperimentalEffects(data);
test('experimental records retain their effect IDs when reopened and undo cleanly',()=>{
  const bytes=fs.readFileSync(new URL('../public/userdata0000',import.meta.url));
  const editor=new SaveEditor(bytes,data), before=editor.bytes.slice(), none=0xffffffff;
  const source=data['rune-templates'].find(x=>x.id===1118000).source;
  for (const template of [{kind:1,source:0x80016094,shape:63,effects:[157620,none,none,none,none,none]}, {kind:2,source,shape:1,effects:[1117002,none,none,none,none,none]}]) {
    assert.ok(editor.transaction('experimental',()=>editor.addUpgrade(template)));
    const reopened=new SaveEditor(editor.bytes,data);
    assert.ok(reopened.upgrades.some(x=>x.kind===template.kind && x.effects[0]===template.effects[0] && x.location==='inventory'));
    assert.match(reopened.effectInfo(template.effects[0]).effect,/experimental|blood damage|HP change/i);
    editor.undo(); assert.deepEqual(editor.bytes,before);
  }
});
test('research metadata records the verified link for the unknown HP effect',()=>{
 const row=data['experimental-effects'].find(x=>x.label.startsWith('HP change')).ids.find(x=>x.id===157620);
 assert.equal(row.spEffect,57620);
 assert.ok(data['experimental-effects'].find(x=>x.label==='Weapon sound silencing').ids.some(x=>x.id===159620 && x.spEffect===59000));
});
test('inferred stamina candidates retain their IDs and evidence',()=>{
  const group=data['experimental-effects'].find(x=>x.label==='Possible stamina recovery increase');
  assert.equal(group.inferred,true);
  assert.deepEqual(group.ids.map(x=>[x.id,x.spEffect,x.observation]),[[1138000,138000,'+4'],[1138001,138001,'+7'],[1138002,138002,'+15']]);
  const editor=new SaveEditor(fs.readFileSync(new URL('../public/userdata0000',import.meta.url)),data);
  const source=data['rune-templates'].find(x=>x.id===group.reference).source;
  editor.transaction('add candidate',()=>editor.addUpgrade({kind:2,source,shape:1,effects:[1138002,0xffffffff,0xffffffff,0xffffffff,0xffffffff,0xffffffff]}));
  const reopened=new SaveEditor(editor.bytes,data);
  assert.ok(reopened.upgrades.some(x=>x.effects[0]===1138002 && x.location==='inventory'));
  assert.match(reopened.effectInfo(1138002).effect,/Possible stamina recovery/);
});
test('additional inferred rune rows have explicit evidence and valid base templates',()=>{
  const groups=data['experimental-effects'].filter(x=>x.inferred && x.kind==='rune');
  for(const group of groups){assert.ok(group.evidence);assert.ok(data['rune-templates'].some(t=>t.id===group.reference));}
  const echoes=groups.find(x=>x.label==='Possible reduced Blood Echoes');
  assert.deepEqual(echoes.ids.map(x=>x.id),[1101000,1101001,1101002]);
  assert.ok(groups.some(x=>x.label==='Unknown life reduction parameter'));
  assert.ok(groups.some(x=>x.label==='Unknown blood damage parameter'));
});
