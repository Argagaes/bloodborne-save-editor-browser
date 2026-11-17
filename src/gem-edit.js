export function primaryVariants(primary, effects) {
  const id=Number(primary), current=effects[id];
  if (!Number.isInteger(id) || !current || !Number.isInteger(Number(current.rating)) || Number(current.rating)<1 || Number(current.rating)>20 || id%100!==Number(current.rating)) return [];
  const base=id-id%100;
  const variants=Array.from({length:20},(_,i)=>base+i+1).filter(id=>effects[id] && Number(effects[id].rating)===id%100).map(id=>({id,rating:Number(effects[id].rating),level:Number(effects[id].level)}));
  return variants.length>1?variants:[];
}
export function closestVariantForLevel(variants,level,rating) {
  return variants.filter(v=>v.level===Number(level)).sort((a,b)=>Math.abs(a.rating-rating)-Math.abs(b.rating-rating)||a.rating-b.rating)[0];
}
