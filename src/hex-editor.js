import { DUNGEON_OFFSET, FLAGS_OFFSET, STRIDE, hasAltarLayout } from './chalice-engine.mjs';
export const hexOffset = value => `0x${value.toString(16).toUpperCase().padStart(6,'0')}`;
export function parseHexBytes(text) {
  const tokens=String(text).trim().split(/\s+/);
  if (!tokens.length || tokens.some(t=>!/^[0-9a-f]{2}$/i.test(t))) throw Error('Enter two hexadecimal digits per byte, separated by spaces.');
  return Uint8Array.from(tokens.map(t=>parseInt(t,16)));
}
export function staticSaveMap(editor, data) {
  const fields=[];
  const add=(name,start,length,section,detail='')=>{if(Number.isSafeInteger(start)&&start>=0&&length>0&&start+length<=editor.bytes.length) fields.push({name,start,length,section,detail});};
  add('Playtime',8,4,'Header','Milliseconds, unsigned 32-bit little-endian.');
  add('Current map',4,4,'Header','Map identifier used by teleport.');
  for(const stat of data.offsets) {
    const times=stat.times||1;
    for(let i=0;i<times;i++) add(`${stat.name}${times>1?` (copy ${i+1})`:''}`,editor.usernameOffset+stat.rel_offset+i*4,stat.length,'Character fields',`${stat.length===1?'Unsigned byte':'Unsigned 32-bit little-endian'}${times>1?'; the normal editor updates all copies together.':''}`);
  }
  add('Hunter name',editor.usernameOffset+1,32,'Character fields','16 character slots; the editor writes one character per two bytes.');
  for(const lamp of data.lamps || []) add(`Lamp: ${lamp.name}`,editor.flagOffset+lamp.offset,1,'Lamp flags',`Flag ${lamp.eventFlag}; bit mask 0x${lamp.mask.toString(16).toUpperCase().padStart(2,'0')}. This byte may contain other flags.`);
  for(const shortcut of data.shortcuts || []) add(`Shortcut: ${shortcut.area} — ${shortcut.name} (flag ${shortcut.eventFlag})`,editor.flagOffset+shortcut.offset,1,'Shortcut flags',`Flag ${shortcut.eventFlag}; bit mask 0x${shortcut.mask.toString(16).toUpperCase().padStart(2,'0')}. Some mappings are inferred; this byte may contain other flags.`);
  for(const boss of data.bosses || []) for(const [i,flag] of boss.flags.entries()) add(`Boss: ${boss.name} (${flag._comment || 'state'} ${i+1})`,editor.flagOffset+flag.rel_offset,1,'Boss flags',flag._comment==='mp' ? `Multiplayer flag; dead-state mask 0x${flag.dead_value.toString(16).toUpperCase().padStart(2,'0')}. This byte can be shared.` : `Boss state byte; alive 0x${flag.alive_value.toString(16).toUpperCase().padStart(2,'0')}, defeated 0x${flag.dead_value.toString(16).toUpperCase().padStart(2,'0')}.`);
  add('Appearance',editor.face,235,'Appearance','Appearance data used for face import and export.');
  if(editor.coordinateOffset>=0) for(let i=0;i<3;i++) add(`Coordinate ${'XYZ'[i]}`,editor.coordinateOffset+12+i*4,4,'Position','32-bit little-endian floating point.');
  if(hasAltarLayout(editor.bytes,editor.inventoryOffset)) for(let slot=1;slot<=6;slot++) {
    add(`Altar ${slot} dungeon record`,editor.inventoryOffset+DUNGEON_OFFSET+STRIDE*(slot-1),124,'Chalice altars','124-byte dungeon record.');
    add(`Altar ${slot} progress flags`,editor.inventoryOffset+FLAGS_OFFSET+STRIDE*(slot-1),124,'Chalice altars','124-byte altar progress and activation record.');
  }
  const regions=[
    {name:'File header',start:0,length:84,detail:'Header fields and other bytes.'},
    {name:'Equipment and upgrade records',start:84,length:Math.max(0,editor.usernameOffset-147-84),detail:'Variable-length records; individual entries can move when equipment or upgrades are added.'},
    {name:'Stats and character details',start:editor.usernameOffset-147,length:editor.inventoryOffset-(editor.usernameOffset-147),detail:'Character stats, name, and other character data.'},
    {name:'Inventory entries',start:editor.inventoryOffset,length:1984*16,detail:'Fixed slots in the current layout; item contents and addresses can change after edits.'},
    {name:'Key item entries',start:editor.usernameOffset+32201,length:138*16,detail:'Key item slots in the current layout.'},
    {name:'Storage entries',start:editor.storageOffset,length:1984*16,detail:'Storage slots in the current layout; contents can change after edits.'},
    {name:'Appearance',start:editor.face,length:235,detail:'Appearance bytes.'},
    {name:'World and event flags',start:editor.flagOffset,length:Math.max(0,editor.lced-editor.flagOffset),detail:'Event flags; many bytes contain multiple unrelated bits and most meanings are unknown.'},
  ].filter(r=>r.start>=0&&r.length>0&&r.start+r.length<=editor.bytes.length);
  return {fields,regions};
}
export function writeHexBytes(editor,start,bytes) {
  if(!Number.isSafeInteger(start)||start<0||start+bytes.length>editor.bytes.length||!bytes.length) throw Error('The byte range is outside the save.');
  editor.bytes.set(bytes,start);
}
