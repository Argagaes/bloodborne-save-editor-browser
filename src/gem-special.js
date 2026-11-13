export const SPECIAL_GEMS = [
  {shape:63,effect:3143408,source:2147633649,file:'tear',name:'Tear Blood Gem',extra:[0xffffffff,0xffffffff,0xffffffff,0xffffffff,0xffffffff]},
  {shape:63,effect:3126204,source:2147633648,file:'brooch',name:'Red Blood Gem',extra:[3045204,0xffffffff,0xffffffff,0xffffffff,0xffffffff]},
  {shape:1,effect:3133407,source:2147633650,file:'gold',name:'Gold Blood Gem',extra:[0xffffffff,0xffffffff,0xffffffff,0xffffffff,0xffffffff]},
];
export const specialGemFor=(effect,shape)=>SPECIAL_GEMS.find(g=>g.effect===effect&&g.shape===shape);
export const isCurseEffect=effect=>!!effect && (/\bCursed\b/i.test(effect.name||'') || /\bDOWN\b|Increases stamina|HP gradually depletes|-\s*\d/i.test(effect.effect||''));
export function defaultCurse(effects,primary) {
  const rank=Math.min(20,Math.max(1,Number(effects[primary]?.rating)||19));
  const candidates=Object.entries(effects).filter(([,e])=>Number(e.rating)===rank&&/^Increases stamina costs\s*\+\d+(?:\.\d+)?%?$/i.test(e.effect||''));
  candidates.sort((a,b)=>Math.abs(parseFloat(a[1].effect.split('+').pop())-3)-Math.abs(parseFloat(b[1].effect.split('+').pop())-3)||Number(a[0])-Number(b[0]));
  return candidates.length?Number(candidates[0][0]):0xffffffff;
}
