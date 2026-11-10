// Rune artwork bundled with the original editor.
const icons = {
  1100: 'moon',
  1102: 'eye',
  1103: "clockwise_metamorphosis",
  1105: "anti-clockwise_metamorphosis",
  1107: 'clawmark',
  1108: "blood_rapture",
  1110: "oedon_writhe",
  1112: 'heir',
  1118: "lake",
  1119: 'lake',
  1121: 'lake',
  1122: 'lake',
  1123: 'lake',
  1125: "deep_sea",
  1126: "deep_sea",
  1127: "deep_sea",
  1128: "deep_sea",
  1129: 'beast',
  1134: 'communion',
  1136: "formless_oedon",
  1140: 'beast',
  1141: 'guidance',
  2107: "oath/radiance.webp",
  2108: "oath/corruption.webp",
  2110: "oath/hunter.webp",
  2127: "oath/impurity.webp",
  2128: "oath/beast's_embrace.webp",
  2129: "oath/milkweed.webp",
};

export function runeIconFile(effectId, catalog) {
  if (!catalog.runeEffects[effectId]) return null;
  const icon = icons[Math.floor(effectId / 1000)];
  if (!icon) return null;
  return icon.startsWith('oath/') ? icon : `${icon}/${effectId % 1000}.webp`;
}
