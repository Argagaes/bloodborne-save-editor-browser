

const SHAPES = { 1:'Radial', 2:'Triangle', 4:'Waning', 8:'Circle', 63:'Droplet' };
const UNIQUE = [
  { shape:63, effect:3143408, source:2147633649, file:'tear', name:'Tear Blood Gem' },
  { shape:63, effect:3126204, source:2147633648, file:'brooch', name:'Red Blood Gem' },
  { shape:1, effect:3133407, source:2147633650, file:'gold', name:'Gold Blood Gem' },
];

// The game uses a shared color family across effects. Shape and level are
// independent; never infer a gem's shape from its effect name or source altar.
export function gemColor(effect) {
  const text = String(effect || '').toLowerCase();
  if (/vs beasts|blood/.test(text)) return 'blue';
  if (/(?:slow|rapid) poison effect/.test(text)) return 'purple';
  if (/bolt/.test(text)) return 'yellow';
  if (/fire|vs the kin/.test(text)) return 'orange';
  if (/charge atks|stamina cost|phys\. up|boosts rally|hp continues|wpn durability|hp gradually/.test(text)) return 'green';
  if (/arcane/.test(text)) return 'white';
  if (/physical|skl|str|thrust|blunt|atk/.test(text)) return 'red';
  return null;
}

export function gemVisual(upgrade, catalog) {
  if (!upgrade || upgrade.kind !== 1) return null;
  const primary = catalog.gemEffects[upgrade.effects[0]], shape = SHAPES[upgrade.shape];
  if (!primary || !shape) return null;
  const unique = UNIQUE.find(u => u.shape === upgrade.shape && u.effect === upgrade.effects[0] && u.source === upgrade.source);
  const level = Number(primary.level), rating = Number(primary.rating);
  const cursed = upgrade.effects.some(id => {
    const effect = catalog.gemEffects[id] || catalog.runeEffects?.[id];
    return effect && (/\bCursed\b/i.test(effect.name) || /\bDOWN\b|Increases stamina|HP gradually depletes|-\s*\d/i.test(effect.effect));
  });
  const color = gemColor(primary.effect);
  if (!unique && (!color || !Number.isInteger(level) || level < 1 || level > 7)) return null;
  const key = unique ? `unique/${unique.file}.webp` : `${shape.toLowerCase()}/${color}/${cursed ? 'cursed_' : ''}${level}.webp`;
  const name = unique?.name || `${cursed && !/^Cursed\b/i.test(primary.name) ? 'Cursed ' : ''}${primary.name}`;
  return {
    image: `gems/${key}`,
    fallback: `gems/${key}`,
    name, shape, color, level, rating, cursed,
    description: `${shape} · Rating ${rating} · Level ${level}${cursed ? ' · Cursed' : ''}`,
  };
}
