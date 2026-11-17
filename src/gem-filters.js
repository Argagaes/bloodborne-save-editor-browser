import {isCurseEffect} from './gem-special.js';
import {matchesGemSearch} from './gem-search.js';

// A curse filter reports only effects identified by the current catalog.
export function matchesGemFilters(gem, filters, catalog, effectInfo) {
  if(filters.shape!=='all' && gem.shape!==Number(filters.shape)) return false;
  const rating=Number(catalog.gemEffects[gem.effects[0]]?.rating);
  if(filters.rating!=='all' && rating!==Number(filters.rating)) return false;
  const cursed=gem.effects.some(id=>isCurseEffect(catalog.gemEffects[id] || catalog.runeEffects?.[id]));
  if(filters.curse==='cursed'&&!cursed || filters.curse==='uncursed'&&cursed) return false;
  if(filters.effect && !matchesGemSearch(gem.effects.map(id=>{const e=effectInfo(id);return `${e.name || ''} ${e.effect || ''} ${id}`;}).join(' '),filters.effect)) return false;
  return true;
}
