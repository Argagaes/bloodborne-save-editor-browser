// Candidate mapping from vanilla map enemy-list positions. Bit meaning and ordering
// are unverified for other NPCs; equal counts do not establish equal layouts.
export function characterCandidate(editor, candidate) {
  const b=editor.bytes,v=editor.view();
  if(b.length<84) throw Error('Incomplete save header');
  const shift=editor.usernameOffset+1-(v.getUint32(16,true)-v.getUint32(12,true)-0x10c91);
  const start=v.getUint32(60,true)+shift, sectionLength=v.getUint32(64,true);
  if(!Number.isSafeInteger(start)||start<0||sectionLength<24||start+sectionLength>b.length) throw Error('World-state section unavailable');
  const end=start+4+v.getUint32(start,true);
  if(end>start+sectionLength||end>b.length||end<start+24) throw Error('Incomplete character-state block');
  if(![0x20,0x52,0x48,0x43,0,0x17,0x09,0x15].every((x,i)=>b[start+4+i]===x)) throw Error('Unsupported character-state block');
  const match=/^m(\d{2})_(\d{2})_00_00$/.exec(candidate.map);
  if(!match||!Number.isInteger(candidate.index)||candidate.index<0||candidate.index>=candidate.count) throw Error('Invalid candidate');
  const target=(Number(match[1])<<24 | Number(match[2])<<16)>>>0;
  let cursor=start+12,found=null;
  while(cursor+4<=end) {
    const map=v.getUint32(cursor,true); if(map===0xffffffff) break;
    if(cursor+12>end) throw Error('Malformed character-state record');
    const length=v.getUint32(cursor+4,true),count=v.getUint32(cursor+8,true);
    if(length<12||length!==12+Math.ceil(count/8)||cursor+length>end) throw Error('Unsupported character-state record layout');
    if(map===target) {
      if(found) throw Error('Duplicate map record');
      if(count!==candidate.count) throw Error(`Map count ${count} differs from reference ${candidate.count}`);
      const offset=cursor+12+Math.floor(candidate.index/8),mask=1<<(candidate.index%8);
      found={offset,mask,enabled:!!(b[offset]&mask)};
    }
    cursor+=length;
  }
  if(!found) throw Error('Map record not present');
  return found;
}
export function writeCharacterCandidate(editor,candidate,on) {
  const {offset,mask}=characterCandidate(editor,candidate);
  editor.put(offset,on ? editor.bytes[offset]|mask : editor.bytes[offset]&~mask,1);
}
