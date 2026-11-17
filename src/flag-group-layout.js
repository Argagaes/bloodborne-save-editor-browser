const MAPS=[[21,0],[21,1],[22,0],[23,0],[24,0],[24,1],[24,2],[25,0],[26,0],[27,0],[28,0],[29,0],[32,0],[33,0],[34,0],[35,0],[36,0]];
const GLOBAL={0:0,1:1,5:2,6:3,7:4}, MAP_TYPES={1:0,5:1,6:2,7:3,9:4};
// Candidate mapping for the vanilla flag pool, validated against existing lamp/shortcut anchors.
export function inferredFlagGroupOffset(group) {
  if(!Number.isSafeInteger(group)||group<0)return null;
  const id=group*1000,t=Math.floor(id/10000000),area=Math.floor(id/100000)%100,block=Math.floor(id/10000)%10,z=Math.floor(id/1000)%10;
  if(!Number.isSafeInteger(id))return null;
  let key;
  if(id<10000)key=z*5;
  else if(area===0&&block===0&&Object.hasOwn(GLOBAL,t))key=GLOBAL[t]+z*5;
  else if(Object.hasOwn(MAP_TYPES,t)){
    let map=MAPS.findIndex(([a,b])=>a===area&&b===block);
    if(map<0 && area===40)map=11;
    else if(map<0 && area>=41&&area<=46&&block===0)map=17+area-41;
    if(map<0)return null;
    key=z*115+50+23*MAP_TYPES[t]+map;
  } else return null;
  return key>=0 && key<1200 ? 377+key*125 : null;
}
