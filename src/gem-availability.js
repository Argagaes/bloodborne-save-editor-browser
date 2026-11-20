import { SPECIAL_GEMS, specialGemFor } from './gem-special.js';
import guide from './gem-glyph-guide.json' with {type:'json'};
const NONE=0xffffffff;
const LIMITS=[
  [/^Blood ATK UP \+([\d.]+)%$/i,32.6,'Bloodtinge gems'],
  [/^Physical ATK UP \+([\d.]+)%$/i,27.2,'Tempering gems'],
  [/^(?:Blunt|Thrust) ATK UP \+([\d.]+)%$/i,32.6,'Adept gems'],
  [/^Charge ATKs UP \+([\d.]+)%$/i,36.3,'Striking gems'],
  [/^STR scaling \+([\d.]+)$/i,65,'Heavy gems'],
  [/^Arcane scaling \+([\d.]+)$/i,65,'Cold gems'],
  [/^Fire ATK UP \+([\d.]+)%$/i,27.2,'Fire gems'],
  [/^Bolt ATK UP \+([\d.]+)%$/i,27.2,'Bolt gems'],
  [/^Arcane ATK UP \+([\d.]+)%$/i,27.2,'Arcane gems'],
  [/^ATK UP \+([\d.]+)%$/i,23.6,'Nourishing gems'],
  [/^Phys\. UP at full HP \+([\d.]+)%$/i,34.4,"Fool's Physical"],
  [/^ATK UP at full HP \+([\d.]+)%?$/i,29,"Fool's Nourishing"],
  [/^ATK UP near death \+([\d.]+)%$/i,30.8,"Poorman's Nourishing"],
  [/^ATK vs (?:beasts|the kin) UP \+([\d.]+)%$/i,32.6,'Beasthunter / Kinhunter gems'],
  [/^Add slow poison effect \+([\d.]+)$/i,18.1,'Murky gems'],
  [/^Add rapid poison effect \+([\d.]+)$/i,21.7,'Dirty gems'],
  [/^HP continues to recover \+([\d.]+)$/i,5,'Pulsing gems'],
];
export function glyphEvidence(primary,effects) {
  const effect=effects?.[primary]?.effect||'';
  const rule=LIMITS.find(([pattern])=>pattern.test(effect));
  if(!rule) return null;
  const value=Number(effect.match(rule[0])[1]);
  return {value,max:rule[1],section:rule[2],records:guide.filter(record=>record.section===rule[2])};
}

// Extract reported primary percentages paired with a flat attack bonus from the
// guide text. The guide is a collection of examples, not a complete drop table.
export function reportedFlatPairs(section) {
  return guide.filter(record=>record.section===section).flatMap(record=>{
    const text=record.description;
    const percent=text.match(/(?:^|[,(]\s*)(\d+(?:\.\d+)?)%\s*[^,+;]+\+\s*/i);
    if(!percent) return [];
    const secondary=text.slice(percent.index+percent[0].length);
    if(!/(?:\badd(?:ed)?\s+(?:(?:phys(?:ical)?|blood|blt|arcane|fire|bolt)\.?\s+)?(?:atk|attack)\b|\b\d+(?:\.\d+)?\s+(?:add\s+)?(?:phys(?:ical)?|blood|blt|arcane|fire|bolt)\.?\s*(?:atk|attack)\b)/i.test(secondary)) return [];
    return [{value:Number(percent[1]),record}];
  });
}
export function gemAvailability(primary,shape,extra,effects) {
  if(primary===null)return {label:'Not assessed',detail:'Choose a primary effect.'};
  const unique=specialGemFor(primary,shape);
  if(unique && shape===unique.shape) {
    if(unique.extra.every((id,i)=>id===extra[i]))return {label:'Verified',detail:'Matches a fixed special-gem record in the game data; in-game behavior has not been tested.'};
    return {label:'Unobtainable from this source',detail:'This special gem has fixed effects in the game data. The chosen combination can still be added as a custom gem.'};
  }
  const evidence=glyphEvidence(primary,effects);
  if(evidence?.value>evidence?.max) return {label:'Above the reported maximum',detail:`The selected primary effect exceeds ${evidence.max}, the strongest listed in the supplied ${evidence.section} hunting guide. This combination is not supported by that guide; other sources and effects are not fully assessed.`};
  const hasFlat=extra.some(id=>id!==NONE&&/^Add (?:physical|blood|arcane|fire|bolt) ATK \+[\d.]+$/i.test(effects?.[id]?.effect||''));
  const pairs=evidence&&hasFlat?reportedFlatPairs(evidence.section):[];
  if(pairs.length) {
    const best=Math.max(...pairs.map(pair=>pair.value));
    if(evidence.value>best) {
      const glyphs=[...new Set(pairs.filter(pair=>pair.value===best).flatMap(pair=>pair.record.glyphs))].join(', ');
      return {label:'Above listed flat-bonus examples',detail:`The highest primary percentage paired with a flat attack bonus in the supplied ${evidence.section} examples is ${best}% (${glyphs}). This combination is not supported by those examples; the list is incomplete and flat bonus types, shapes, ranks and curses still require checking.`};
    }
  }
  return {label:'Not verified',detail:evidence?`Within the reported ${evidence.section} primary-effect maximum. The guide does not establish that this particular shape, rating, curse and combination can drop.`:'This effect or combination is not covered by the current checks. It may still be obtainable.'};
}
export function specialGemDefaults(primary,extra) {
  const unique=SPECIAL_GEMS.find(g=>g.effect===primary);
  return unique && extra.every(id=>id===NONE) ? [...unique.extra] : extra;
}
