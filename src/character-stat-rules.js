import base from './base-stat-values.json' with {type:'json'};
export const STAT_NAMES=['Vitality','Endurance','Strength','Skill','Bloodtinge','Arcane'];
// Installed CUSA03173 1.09 CharaInitParam rows 2000–2008.
export const ORIGIN_BASES=[[11,10,12,10,9,8],[14,11,11,10,7,7],[9,14,9,13,6,9],[12,11,15,9,6,7],[9,12,9,15,7,8],[10,10,14,13,7,6],[7,8,9,13,14,9],[10,12,10,9,5,14],[10,9,10,9,7,9]];
export function validateAttributes(stats,origin) {
 const min=ORIGIN_BASES[origin];if(!min)throw Error('Unknown origin; cannot validate attributes.');
 for(let i=0;i<STAT_NAMES.length;i++){const name=STAT_NAMES[i],n=stats[name];if(!Number.isInteger(n)||n<min[i]||n>99)throw Error(`${name} must be between ${min[i]} and 99 for this origin.`);}
 return STAT_NAMES.reduce((sum,key)=>sum+stats[key],0)-50;
}
export function baseStatValues(stats) {return {hp:base.hp[stats.Vitality]??null,stamina:base.stamina[stats.Endurance]??null};}
