// Binary layouts ported from src-tauri/src/data_handling. All writes are local.
import { readAltars, writeAltar } from './chalice-engine.mjs';
import { SPECIAL_GEMS } from './gem-special.js';

export const SHAPES = { 2147483648: 'Closed', 1: 'Radial', 2: 'Triangle', 4: 'Waning', 8: 'Circle', 63: 'Droplet' };
export function integer(value, max = 0xffffffff) {
  const n = Number(value);
  if (String(value).trim() === '' || !Number.isInteger(n) || n < 0 || n > max) throw Error(`Enter a whole number between 0 and ${max.toLocaleString()}.`);
  return n;
}
export class SaveEditor {
  constructor(input, data, name = 'userdata0000') {
    this.bytes = new Uint8Array(input).slice();
    this.original = this.bytes.slice();
    this.data = data;
    this.name = name;
    this.history = [];
    this.redoHistory = [];
    if (this.bytes.length < 100000 || this.bytes.length > 32 * 1024 * 1024) throw Error('Choose a decrypted Bloodborne character file (userdata), not an encrypted save container.');
    this.refresh();
    this.originalFlagOffset = this.flagOffset;
    if (!this.username || this.lced < 0 || this.usernameOffset < 147 || this.usernameOffset + 93000 >= this.bytes.length) throw Error('This file does not contain a supported decrypted character.');
  }
  view() { return new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength); }
  u32(o) { return this.view().getUint32(o, true); }
  put(o, n, length = 4) { integer(n, length === 1 ? 255 : 0xffffffff); if(o < 0 || o + length > this.bytes.length) throw Error('Write outside the save.'); length === 1 ? this.bytes[o] = n : this.view().setUint32(o, n, true); }
  find(pattern, start = 0, end = this.bytes.length) {
    outer: for(let i = start; i <= end - pattern.length; i++) { for(let j = 0; j < pattern.length; j++) if(this.bytes[i+j] !== pattern[j]) continue outer; return i; } return -1;
  }
  refresh() {
    const face = this.find([70,65,67,69], 0xf000);
    if(face < 34497 || face + 239 > this.bytes.length) throw Error('Character appearance marker not found. The save may be encrypted or incomplete.');
    this.face = face + 4;
    this.usernameOffset = face - 34028 - 469;
    this.inventoryOffset = this.usernameOffset + 469;
    this.storageOffset = this.inventoryOffset + 34268;
    this.flagOffset = this.usernameOffset + 68545;
    if(this.flagOffset + 24000 > this.bytes.length) throw Error('The character file is truncated.');
    this.lced = this.find([76,67,69,68], face);
    this.coordinateOffset = this.lced < 0 ? -1 : this.find([255,255,255,255,0,0,0,0,0,0,0,0], this.lced);
    this.username = '';
    for(let i=0;i<16;i++) { const c=this.bytes[this.usernameOffset+1+i*2]; if(!c) break; this.username += String.fromCharCode(c); }
    this.stats = Object.fromEntries(this.data.offsets.map(s => [s.name, s.length === 1 ? this.bytes[this.usernameOffset+s.rel_offset] : this.u32(this.usernameOffset+s.rel_offset)]));
    this.upgrades = []; this.equipment = new Map();
    // The GA section has 4096 variable-length records: 40-byte upgrades,
    // 60-byte equipment, and 8-byte free records.
    for(let i=84, count=0; count<4096 && i+8 < this.usernameOffset-147; count++) {
      const type = this.bytes[i+3];
      if(type === 0xc0 && i+40 <= this.bytes.length) {
        const kind = this.u32(i+8);
        if(kind===1 || kind===2) this.upgrades.push({ offset:i, id:this.u32(i), source:this.u32(i+4), kind, shape:this.u32(i+12), effects:Array.from({length:6},(_,k)=>this.u32(i+16+k*4)) });
        i+=40;
      } else if(type === 0x80 || type === 0x90) {
        this.equipment.set(`${this.u32(i)}:${this.u32(i+4)}`, i); i+=60;
      } else if(type===0) i+=8;
      else break;
    }
    this.articles = [];
    const upgradeMap = new Map(this.upgrades.map(u=>[u.id,u]));
    for(const [location,start,count] of [['inventory',this.inventoryOffset,1984],['storage',this.storageOffset,1984],['key',this.usernameOffset+32201,138]]) {
      for(let k=0;k<count;k++) {
        const o=start+k*16; if(o+16>this.bytes.length) break;
        const first=this.u32(o+4), second=this.u32(o+8);
        if(upgradeMap.has(first)) { const u=upgradeMap.get(first); u.location=location; u.inventoryOffset=o; continue; }
        let info, category, family, id=second;
        if(this.bytes[o+7]===0xb0 && this.bytes[o+11]===0x40) {
          id=second & 0xffffff; family='item';
          for(const [c,items] of Object.entries(this.data.items)) if(items[id]) { info=items[id]; category=c; break; }
          if(!info) { info={item_name:`Unknown item ${id}`,item_desc:'Unused or unlisted item. Original bytes are preserved.'}; category='consumable'; }
        } else if(this.bytes[o+11]===0x10) { id=second & 0xffffff; info=this.data.armors[id]; category='armor'; family='armor'; }
        else {
          family='weapon'; const base = second-second%10000;
          for(const [c,items] of Object.entries(this.data.weapons)) if(items[base]||items[Math.floor(second/100000)*100000]) { info=items[base]||items[Math.floor(second/100000)*100000]; category=c; break; }
        }
        if(!info) continue;
        const ga=this.equipment.get(`${first}:${second}`);
        this.articles.push({offset:o,location,id,first,second,info,category,family,amount:this.u32(o+12),ga,
          level:family==='weapon'?Math.floor(second%10000/100):0,
          slots:ga===undefined?[]:Array.from({length:5},(_,j)=>({offset:ga+20+j*8,shape:this.u32(ga+20+j*8),gem:this.u32(ga+24+j*8)}))});
      }
    }
    for(const u of this.upgrades) if(!u.location) u.location='equipped';
  }
  transaction(label, action) {
    const before = this.bytes.slice();
    try { action(); this.refresh(); } catch(error) { this.bytes=before; this.refresh(); throw error; }
    if(before.every((b,i)=>b===this.bytes[i])) return false;
    this.history.push({ label, bytes:before }); if(this.history.length>40) this.history.shift(); this.redoHistory=[]; return true;
  }
  undo() { const h=this.history.pop(); if(h) { this.redoHistory.push({label:h.label,bytes:this.bytes.slice()}); this.bytes=h.bytes; this.refresh(); } }
  redo() { const h=this.redoHistory.pop(); if(h) { this.history.push({label:h.label,bytes:this.bytes.slice()}); this.bytes=h.bytes; this.refresh(); } }
  get changedBytes() {
    const original=this.original, current=this.bytes;
    let count=0, oldOffset=0, newOffset=0;
    const compare=(oldStart,newStart,length)=>{for(let i=0;i<length;i++) if(original[oldStart+i]!==current[newStart+i]) count++;};
    compare(0,0,84); oldOffset=84; newOffset=84;
    const recordLength=(bytes,offset)=>{
      if(offset+8>bytes.length)return 0;
      const type=bytes[offset+3];
      return type===0?8:type===0xc0?40:type===0x80||type===0x90?60:0;
    };
    for(let i=0;i<4096;i++) {
      const oldLength=recordLength(original,oldOffset),newLength=recordLength(current,newOffset);
      if(!oldLength||!newLength||oldOffset+oldLength>original.length||newOffset+newLength>current.length)
        return current.reduce((n,b,j)=>n+(b!==original[j]),0);
      if(oldLength===newLength) compare(oldOffset,newOffset,oldLength);
      else if(oldLength===8) count+=newLength;
      else if(newLength===8) count+=oldLength;
      else {compare(oldOffset,newOffset,Math.min(oldLength,newLength)); count+=Math.abs(oldLength-newLength);}
      oldOffset+=oldLength;newOffset+=newLength;
    }
    compare(oldOffset,newOffset,Math.min(original.length-oldOffset,current.length-newOffset));
    return count;
  }
  altars(catalog) { return readAltars(this.bytes, this.inventoryOffset, catalog); }
  replaceAltar(slot, dungeon) { writeAltar(this.bytes, this.inventoryOffset, slot, dungeon); }
  setStat(name,value) { const s=this.data.offsets.find(s=>s.name===name); if(!s) throw Error('Unknown attribute.'); const n=integer(value,s.length===1?255:0xffffffff); for(let i=0;i<s.times;i++) this.put(this.usernameOffset+s.rel_offset+4*i,n,s.length); }
  setName(value) { if(!/^[\x20-\x7e]{1,16}$/.test(value)) throw Error('Use 1–16 printable ASCII characters.'); for(let i=0;i<16;i++) this.bytes[this.usernameOffset+1+2*i]=value.charCodeAt(i)||0; }
  quantity(article,n) { if(article.family!=='item'||article.category==='key') throw Error('This item quantity cannot be edited.'); this.put(article.offset+12,integer(n)); }
  transform(article,id) {
    id=integer(id); let second=id;
    if(article.family==='item') {
      const c=Object.entries(this.data.items).find(([,items])=>items[id]); if(!c) throw Error('Unknown item.');
      this.put(article.offset+4,(id|0xb0000000)>>>0); this.put(article.offset+8,(id|0x40000000)>>>0);
      if(['key','chalice'].includes(c[0])) this.put(article.offset+12,1);
    } else {
      if(article.ga===undefined) throw Error('Equipment record not found.');
      if(article.family==='armor') { if(!this.data.armors[id]) throw Error('Choose an armor.'); second=(id|0x10000000)>>>0; }
      else if(!Object.values(this.data.weapons).some(w=>w[Math.floor(id/100000)*100000] || w[id])) throw Error('Choose a weapon.');
      this.put(article.offset+8,second); this.put(article.ga+4,second);
    }
  }
  weaponLevel(article,level) { if(article.family!=='weapon') throw Error('Choose a weapon.'); const n=integer(level,10); this.transform(article,article.second-article.second%10000+n*100); }
  emptySlot(location) {
    const start=location==='storage'?this.storageOffset:this.inventoryOffset;
    for(let i=0;i<1983;i++) { const o=start+i*16; if(this.u32(o+4)===0 && this.u32(o+8)===0xffffffff && this.u32(o+12)===0) return o; }
    throw Error('This inventory has no free slots. Free a slot in-game first.');
  }
  incrementCounters(location) { for(const r of location==='storage'?[34737,68541]:[453,34257]) this.put(this.usernameOffset+r,this.u32(this.usernameOffset+r)+1); }
  addItem(id,quantity,location='inventory',family='item') {
    id=integer(id); quantity=integer(quantity); if(!quantity) throw Error('Quantity must be at least 1.');
    const slot=this.emptySlot(location);
    if(family==='item') {
      const entry=Object.entries(this.data.items).find(([,items])=>items[id]); if(!entry) throw Error('Unknown item.');
      this.put(slot+4,(id|0xb0000000)>>>0); this.put(slot+8,(id|0x40000000)>>>0); this.put(slot+12,['key','chalice'].includes(entry[0])?1:quantity); this.incrementCounters(location);
    } else {
      if(family==='armor'?!this.data.armors[id]:!Object.values(this.data.weapons).some(w=>w[id])) throw Error('Unknown equipment.');
      let empty=-1, max=0, i=84;
      for(let k=0;k<4096;k++) { const type=this.bytes[i+3]; if(type===0) { if(empty<0) empty=i; i+=8; } else if([0x80,0x90,0xc0].includes(type)) { max=Math.max(max,this.view().getUint16(i,true)); i+=type===0xc0?40:60; } else throw Error('Invalid equipment section.'); }
      if(empty<0 || max>=65535) throw Error('No free equipment records.');
      const first=((family==='armor'?0x90800000:0x80800000)|(max+1))>>>0;
      const second=family==='armor'?(id|0x10000000)>>>0:id;
      this.put(slot+4,first); this.put(slot+8,second); this.put(slot+12,1); this.incrementCounters(location);
      const record=new Uint8Array(60), v=new DataView(record.buffer); v.setUint32(0,first,true);v.setUint32(4,second,true);v.setUint32(8,200,true);v.setUint32(16,1,true);for(let j=0;j<5;j++)v.setUint32(20+j*8,0x80000000,true);
      const next=new Uint8Array(this.bytes.length);next.set(this.bytes.subarray(0,empty));next.set(record,empty);next.set(this.bytes.subarray(empty+8,this.bytes.length-52),empty+60);this.bytes=next;
    }
  }
  effectInfo(id) { return this.data.upgrades.gemEffects[id] || this.data.upgrades.runeEffects[id] || {name:'Unknown upgrade',effect:id===0xffffffff?'No effect':`Unknown effect ${id}`}; }
  normalizeSpecialGem(upgrade,shape,primary) {
    const special = SPECIAL_GEMS.find(g=>g.source===this.u32(upgrade.offset+4));
    if(upgrade.kind===1 && special && (shape!==special.shape || primary!==special.effect)) {
      const source=0x80016094;
      this.put(upgrade.offset+4,source);
      if(upgrade.inventoryOffset!==undefined) this.put(upgrade.inventoryOffset+8,source);
    }
  }
  setEffect(upgrade,index,id) { integer(index,5); id=integer(id); if(id!==0xffffffff && !this.data.upgrades.gemEffects[id] && !this.data.upgrades.runeEffects[id]) throw Error('Choose a known effect.'); if(index===0) this.normalizeSpecialGem(upgrade,this.u32(upgrade.offset+12),id); this.put(upgrade.offset+16+4*index,id); }
  setShape(upgrade,shape) { const valid=upgrade.kind===1?[1,2,4,8,63]:[1,2]; shape=integer(shape); if(!valid.includes(shape)) throw Error('Invalid shape.'); this.normalizeSpecialGem(upgrade,shape,this.u32(upgrade.offset+16)); this.put(upgrade.offset+12,shape); }
  addUpgrade(template,location='inventory') {
    if(!template || ![1,2].includes(template.kind) || !Array.isArray(template.effects) || template.effects.length!==6) throw Error('Choose an upgrade template.');
    if(!['inventory','storage'].includes(location)) throw Error('Choose inventory or storage.');
    const slot=this.emptySlot(location); let empty=-1,max=0,i=84;
    for(let k=0;k<4096;k++) { const type=this.bytes[i+3]; if(type===0) { if(empty<0) empty=i; i+=8; } else if([0x80,0x90,0xc0].includes(type)) { max=Math.max(max,this.view().getUint16(i,true)); i+=type===0xc0?40:60; } else throw Error('Invalid equipment section.'); }
    if(empty<0 || max>=65535) throw Error('No free upgrade records.');
    const id=(0xc0800000|(max+1))>>>0, source=integer(template.source);
    this.put(slot+4,id); this.put(slot+8,source); this.put(slot+12,1); this.incrementCounters(location);
    const record=new Uint8Array(40),v=new DataView(record.buffer);
    [id,source,template.kind,template.shape,...template.effects].forEach((n,j)=>v.setUint32(j*4,integer(n),true));
    const next=new Uint8Array(this.bytes.length); next.set(this.bytes.subarray(0,empty)); next.set(record,empty); next.set(this.bytes.subarray(empty+8,this.bytes.length-32),empty+40); this.bytes=next;
  }
  slotShape(slot,shape) { shape=integer(shape); if(!SHAPES[shape]) throw Error('Invalid shape.'); if(shape===0x80000000 && slot.gem) throw Error('Unequip the gem before closing this slot.'); this.put(slot.offset,shape); }
  equip(slot,upgrade) {
    if(slot.gem) throw Error('Unequip the current gem first.');
    if(slot.shape===0x80000000) throw Error('Open the slot first.');
    if(upgrade.kind!==1 || !upgrade.inventoryOffset) throw Error('Choose a loose blood gem.');
    if(upgrade.shape!==63 && upgrade.shape!==slot.shape) throw Error('The gem shape must match the slot.');
    this.put(slot.offset+4,upgrade.id); this.put(upgrade.inventoryOffset+4,0);this.put(upgrade.inventoryOffset+8,0xffffffff);this.put(upgrade.inventoryOffset+12,0);
  }
  unequip(slot,location='inventory') {
    if(!slot.gem) return;
    const u=this.upgrades.find(u=>u.id===slot.gem); if(!u) throw Error('Gem record not found.');
    const o=this.emptySlot(location); this.put(o+4,u.id);this.put(o+8,this.u32(u.offset+4));this.put(o+12,1);this.put(slot.offset+4,0);this.incrementCounters(location);
  }
  bossDead(boss) { const f=boss.flags.find(f=>f._comment!=='mp'); return !!(this.bytes[this.flagOffset+f.rel_offset]&f.dead_value); }
  setBoss(boss,dead) {
    for(const f of boss.flags.filter(f=>f._comment!=='mp')) this.put(this.flagOffset+f.rel_offset,dead?f.dead_value:f.alive_value,1);
    for(const f of boss.flags.filter(f=>f._comment==='mp')) {
      const sharing=this.data.bosses.filter(b=>b.flags.some(x=>x._comment==='mp'&&x.rel_offset===f.rel_offset&&x.dead_value===f.dead_value));
      if(dead&&!sharing.every(b=>this.bossDead(b))) continue;
      const o=this.flagOffset+f.rel_offset; this.put(o,dead?this.bytes[o]|f.dead_value:this.bytes[o]&f.alive_value,1);
    }
  }
  coordinates() { if(this.coordinateOffset<0) return null; return [0,1,2].map(i=>this.view().getFloat32(this.coordinateOffset+12+i*4,true)); }
  setCoordinates(values) { if(this.coordinateOffset<0) throw Error('Coordinates not found.'); for(const [i,value] of values.entries()) { const n=Number(value); if(String(value).trim()==='' || !Number.isFinite(n)||Math.abs(n)>1e7) throw Error('Enter valid coordinates.'); this.view().setFloat32(this.coordinateOffset+12+i*4,n,true); } }
  teleport(place) { this.setCoordinates([place.x,place.y,place.z]);this.bytes.set([0,0,place.mapId[1],place.mapId[0]],4); }
  appearance() { return this.bytes.slice(this.face,this.face+235); }
  importAppearance(bytes) { if(bytes.length!==235) throw Error('Appearance files must be exactly 235 bytes.');this.bytes.set(bytes,this.face); }
  fixIsz() { const o=this.usernameOffset+72082;if(this.bytes[o]===255) { if(this.bytes[o+1]<192)this.bytes[o+1]=48;else if(this.bytes[o+1]===192)this.bytes[o+1]=255; } }
  lampEnabled(eventFlag) {
    const lamp = this.data.lamps?.find(entry => entry.eventFlag === eventFlag);
    if (!lamp) throw Error('Unknown lamp.');
    const offset = this.flagOffset + lamp.offset;
    if (offset >= this.lced || offset >= this.bytes.length) throw Error('The lamp flag is outside the supported character layout.');
    return (this.bytes[offset] & lamp.mask) !== 0;
  }
  setLamps(eventFlags, enabled) {
    if (!Array.isArray(eventFlags) || typeof enabled !== 'boolean') throw Error('Invalid lamp selection.');
    const lamps = eventFlags.map(flag => {
      const lamp = this.data.lamps?.find(entry => entry.eventFlag === flag);
      if (!lamp) throw Error('Unknown lamp.');
      const offset = this.flagOffset + lamp.offset;
      if (offset >= this.lced || offset >= this.bytes.length) throw Error('The lamp flag is outside the supported character layout.');
      return { offset, mask: lamp.mask };
    });
    for (const {offset, mask} of lamps) this.put(offset, enabled ? this.bytes[offset] | mask : this.bytes[offset] & ~mask, 1);
  }
  unlockLamp(eventFlag) { this.setLamps([eventFlag], true); }
  unlockAllLamps() {
    if (!Array.isArray(this.data.lamps) || this.data.lamps.length !== 44) throw Error('Lamp data is unavailable.');
    this.setLamps(this.data.lamps.map(lamp => lamp.eventFlag), true);
  }
  shortcutEnabled(eventFlag) {
    const shortcut = this.data.shortcuts?.find(entry => entry.eventFlag === eventFlag);
    if (!shortcut) throw Error('Unknown shortcut.');
    const offset = this.flagOffset + shortcut.offset;
    if (offset >= this.lced || offset >= this.bytes.length) throw Error('The shortcut flag is outside the supported character layout.');
    return (this.bytes[offset] & shortcut.mask) !== 0;
  }
  setShortcuts(eventFlags, enabled) {
    if (!Array.isArray(eventFlags) || typeof enabled !== 'boolean') throw Error('Invalid shortcut selection.');
    const shortcuts = eventFlags.map(flag => {
      const shortcut = this.data.shortcuts?.find(entry => entry.eventFlag === flag);
      if (!shortcut) throw Error('Unknown shortcut.');
      const offset = this.flagOffset + shortcut.offset;
      if (offset >= this.lced || offset >= this.bytes.length) throw Error('The shortcut flag is outside the supported character layout.');
      return {offset, mask: shortcut.mask};
    });
    for (const {offset, mask} of shortcuts) this.put(offset, enabled ? this.bytes[offset] | mask : this.bytes[offset] & ~mask, 1);
  }
  allShortcutsEnabled() {
    const entries=this.data.shortcuts, auxiliary=this.data['shortcut-auxiliary'];
    if (!Array.isArray(entries) || !Array.isArray(auxiliary)) throw Error('Shortcut data is unavailable.');
    return entries.every(entry=>this.shortcutEnabled(entry.eventFlag)) && auxiliary.every(entry=>{
      const offset=this.flagOffset+entry.offset;
      if(offset>=this.lced || offset>=this.bytes.length)throw Error('The shortcut flag is outside the supported character layout.');
      return (this.bytes[offset]&entry.mask)===0;
    });
  }
  setAllShortcuts(enabled) {
    const entries=this.data.shortcuts, auxiliary=this.data['shortcut-auxiliary'];
    if(typeof enabled!=='boolean' || !Array.isArray(entries) || !Array.isArray(auxiliary))throw Error('Shortcut data is unavailable.');
    for(const entry of auxiliary) if(this.flagOffset+entry.offset>=this.lced || this.originalFlagOffset+entry.offset>=this.original.length)throw Error('The shortcut flag is outside the supported character layout.');
    this.setShortcuts(entries.map(entry=>entry.eventFlag),enabled);
    for(const entry of auxiliary){
      const offset=this.flagOffset+entry.offset;
      const originalBit=this.original[this.originalFlagOffset+entry.offset]&entry.mask;
      this.put(offset,(this.bytes[offset]&~entry.mask)|(enabled?0:originalBit),1);
    }
  }
  worldFlag(name) {
    const flags={maria:[1083,[0,8]],lullaby:[6689,[8,1]],bloodAddled:[4127,[162]]};
    if(name==='multiplayer') {
      const masks=[[1678,208],[1677,63],[1679,247],[1679,251],[1664,247],[1664,251],[1714,243],[2277,127],[1652,127],[1689,247],[1727,127],[1702,127],[1702,191],[2289,247],[2302,127],[2302,191],[2315,254],[2316,127],[2327,127]];
      for(const [offset,mask] of masks) this.put(this.flagOffset+offset,this.bytes[this.flagOffset+offset]&mask,1);
    } else {
      const entry=flags[name];if(!entry)throw Error('Unknown world flag.');
      entry[1].forEach((value,i)=>this.put(this.flagOffset+entry[0]+i,value,1));
    }
  }
}
