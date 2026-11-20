export const AREA_NAMES={0x0a:'Pthumeru · depth 1',0x14:'Pthumeru · depth 2',0x15:'Hintertomb · depth 2',0x1e:'Pthumeru · depth 3',0x1f:'Hintertomb · depth 3',0x28:'Pthumeru · depth 4',0x2a:'Loran · depth 4',0x32:'Pthumeru · depth 5',0x34:'Loran · depth 5',0x35:'Isz · depth 5'};
export const LAYOUT_NAMES={0:'Regular · map 1',1:'Regular · map 2',10:'Defiled · map 1',11:'Defiled · map 2',20:'Sinister · map 1',21:'Sinister · map 2',90:'Story'};
export function dungeonSummary(bytes) {
 if(!bytes||bytes.length!==124)return null;
 return {depth:({10:1,20:2,21:2,30:3,31:3,40:4,42:4,50:5,52:5,53:5})[bytes[1]]||null,area:AREA_NAMES[bytes[1]]||`Unknown area 0x${bytes[1].toString(16).padStart(2,'0')}`,layout:LAYOUT_NAMES[bytes[2]]||`Unknown variant 0x${bytes[2].toString(16).padStart(2,'0')}`,map:`m${String(bytes[0]).padStart(2,'0')}_${String(bytes[1]).padStart(2,'0')}_${String(bytes[2]).padStart(2,'0')}_${String(bytes[3]).padStart(2,'0')}`,seed:bytes[3],duplicate:bytes.slice(0,4).every((v,i)=>v===bytes[12+i])};
}
export function setDungeonEffect(bytes,index,value) {
 if(!bytes||bytes.length!==124||!Number.isInteger(index)||index<0||index>=9||!Number.isInteger(value)||(value>0x63&&value!==0xff)||value<0) throw Error('Invalid dungeon effect.');
 const next=bytes.slice();next[27+index*8]=value;return next;
}
export function setDungeonMapByte(bytes,index,value) {
 if(!bytes||bytes.length!==124||!Number.isInteger(index)||index<0||index>3||!Number.isInteger(value)||value<0||value>255) throw Error('Invalid dungeon map byte.');
 const next=bytes.slice();
 // Keep a matching copy synchronized; preserve deliberately mismatched map IDs.
 if(next[12+index]===next[index]) next[12+index]=value;
 next[index]=value;return next;
}
