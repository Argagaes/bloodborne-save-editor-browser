export const BYTE_CATEGORIES={0x32:11,0x35:11,0x36:11,0x5a:11,0x24:12,0x43:12,0x44:12,0x5b:12,0x3d:13,0x3e:13,0x3f:13,0x40:13,0x41:13,0x42:13,0x5c:13,0x0d:14,0x0e:14,0x5d:14,0x0f:22,0x33:22,0x5e:22,0x25:23,0x5f:23,0x34:34,0x4f:34,0x50:34,0x51:34,0x52:34,0x53:34,0x54:34,0x60:34,0x26:35,0x61:35,0x27:45,0x62:45};
// Hex Research Central: strings 5–13 are eight bytes each; the last byte
// identifies the effect. The preceding seven bytes are placeholders.
export function dungeonGemCategories(bytes) {
 if(!bytes||bytes.length!==124) return {error:'Dungeon record is incomplete.'};
 const categories=[],unknown=[];
 for(let i=0;i<9;i++) {
  const effect=bytes[27+i*8];
  if(effect===0xff) continue;
  if(effect>0x63){unknown.push(effect);continue;}
  const category=BYTE_CATEGORIES[effect];if(category)categories.push(category);
 }
 if(categories.length>8) return {error:'More than eight gem categories: unsupported by this calculator.'};
 if(unknown.length) return {error:`Unknown effect bytes: ${unknown.map(x=>x.toString(16).padStart(2,'0')).join(', ')}.`};
 return {categories};
}

export const CATEGORY_EFFECT_BYTES={11:0x32,12:0x24,13:0x3d,14:0x0d,22:0x33,23:0x25,34:0x34,35:0x26,45:0x27};
export function changeDungeonCategory(bytes,slot,category) {
 if(!bytes||bytes.length!==124||!Number.isInteger(slot)||slot<0||slot>=9) throw Error('Dungeon record or slot is invalid.');
 const offset=27+slot*8,current=bytes[offset];
 if(current!==0xff&&!BYTE_CATEGORIES[current]) throw Error('This entry has a separate dungeon effect; it cannot be changed here.');
 if(category!==null&&!Object.hasOwn(CATEGORY_EFFECT_BYTES,category)) throw Error('Unknown gem category.');
 const next=bytes.slice();
 if(category!==null&&BYTE_CATEGORIES[current]===category) return next;
 next[offset]=category===null?0xff:CATEGORY_EFFECT_BYTES[category];
 return next;
}
