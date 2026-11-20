import categories from './gem-effect-categories.json' with {type:'json'};
// CUSA03173 1.09 GemeffectParam categoryId cross-referenced with GemCategoryParam.
export function gemEffectCategory(id) {
 const entry=categories[id];
 if(!entry) return null;
 return {id:entry[0],known:!!entry[1]};
}
export function gemEffectCategoryLabel(id) {
 const c=gemEffectCategory(id);
 return c ? `Category ${c.id}${c.known?'':' · Unknown GemCategoryParam'}` : null;
}
