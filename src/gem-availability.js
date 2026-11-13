import { SPECIAL_GEMS, specialGemFor } from './gem-special.js';
const NONE=0xffffffff;
export function gemAvailability(primary,shape,extra) {
  if(primary===null)return {label:'Not assessed',detail:'Choose a primary effect.'};
  const unique=specialGemFor(primary,shape);
  if(unique && shape===unique.shape) {
    if(unique.extra.every((id,i)=>id===extra[i]))return {label:'Verified',detail:'Matches a fixed special-gem record in the game data; in-game behavior has not been tested.'};
    return {label:'Unobtainable from this source',detail:'This special gem has fixed effects in the game data. The chosen combination can still be added as a custom gem.'};
  }
  return {label:'Potentially obtainable',detail:'Not verified: effect pools, ranks, shapes and combinations have not yet been fully reconstructed. This label does not guarantee a natural drop.'};
}
export function specialGemDefaults(primary,extra) {
  const unique=SPECIAL_GEMS.find(g=>g.effect===primary);
  return unique && extra.every(id=>id===NONE) ? [...unique.extra] : extra;
}
