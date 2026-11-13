// Some catalog descriptions omit the percent sign on whole-number values.
// Infer percentage families from other entries with the identical description prefix.
export function normalizeGemEffectUnits(upgrades) {
  const values=Object.values(upgrades.gemEffects);
  const percentagePrefixes=new Set(values.flatMap(({effect})=>{
    const match=effect?.match(/^(.*?)\s+[+-]?\d+(?:\.\d+)?%$/);
    return match?[match[1]]:[];
  }));
  for(const entry of values) {
    const match=entry.effect?.match(/^(.*?)\s+[+-]?\d+$/);
    if(match&&percentagePrefixes.has(match[1]))entry.effect += '%';
  }
  return upgrades;
}
