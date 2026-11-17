import { flagAddress, writeQuestFlag } from './quest-flags.js';

// First-encounter flag reset inferred from four sequential captures; not a proven revival.
export function prepareEileenFirstEncounter(editor, groupBase, resetUnknownDeathCandidate=false) {
  const changes=[...Array.from({length:20},(_,i)=>[1360+i,i===1]),
    ...Array.from({length:6},(_,i)=>[1700+i,false]),
    ...[12410805,12410806,12410807,72410543,72410544].map(id=>[id,false])];
  if(resetUnknownDeathCandidate) changes.push([9382,false]);
  const resolved=changes.map(([id,on])=>{const base=groupBase(id);if(base==null)throw Error(`No address for flag ${id}; restore or enter the group mapping first.`);flagAddress(editor,id,base);return {id,on,base};});
  for(const {id,on,base} of resolved) writeQuestFlag(editor,id,base,on);
}
// Clearing this bit after the quest reset revived Eileen in one user test.
// Restrict it to the matching 182-entry layout; ordering may vary across game data.
export function eileenCharacterCandidate(editor) {
  const b=editor.bytes, v=editor.view();
  if(b.length<84) throw Error('The save header is incomplete.');
  const headerName=v.getUint32(16,true)-v.getUint32(12,true)-0x10c91;
  const shift=editor.usernameOffset+1-headerName;
  const start=v.getUint32(60,true)+shift, sectionLength=v.getUint32(64,true);
  if(!Number.isSafeInteger(start)||start<0||sectionLength<24||start+sectionLength>b.length) throw Error('The world-state section could not be located.');
  const size=v.getUint32(start,true), end=start+4+size;
  if(size<20||end>start+sectionLength||end>b.length) throw Error('The character-state block is missing or incomplete.');
  const magic=[0x20,0x52,0x48,0x43,0x00,0x17,0x09,0x15];
  if(!magic.every((byte,i)=>b[start+4+i]===byte)) throw Error('Unsupported character-state block version.');
  let cursor=start+12, found=null;
  while(cursor+4<=end) {
    const map=v.getUint32(cursor,true);
    if(map===0xffffffff) break;
    if(cursor+12>end) throw Error('Malformed character-state record.');
    const length=v.getUint32(cursor+4,true), count=v.getUint32(cursor+8,true);
    if(length<12||length!==12+Math.ceil(count/8)||cursor+length>end) throw Error('Unsupported character-state record layout.');
    if(map===0x18010000) {
      if(found!==null) throw Error('Duplicate Central Yharnam character-state records.');
      if(count!==182||length!==35) throw Error('Central Yharnam character layout differs from the supplied test saves; candidate bit is unavailable.');
      found=cursor+12;
    }
    cursor+=length;
  }
  if(found===null) throw Error('No matching Central Yharnam character-state record was found.');
  return {offset:found,mask:0x10,enabled:!!(b[found]&0x10)};
}
export function setEileenCharacterCandidate(editor, enabled) {
  const {offset,mask}=eileenCharacterCandidate(editor);
  editor.put(offset,enabled ? editor.bytes[offset]|mask : editor.bytes[offset]&~mask,1);
}
export function clearEileenCharacterCandidate(editor) { setEileenCharacterCandidate(editor,false); }
// Validate both the character record and all flag addresses before changing any bytes.
export function resetEileenFirstEncounterAlive(editor,groupBase) {
  eileenCharacterCandidate(editor);
  prepareEileenFirstEncounter(editor,groupBase);
  clearEileenCharacterCandidate(editor);
}
