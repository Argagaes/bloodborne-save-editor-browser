import { compareQuestFlags, compareCharacterCandidates } from './quest-comparison.js';

export function compareSaves(current, other, data) {
  const groups = [];
  const add = (title, rows) => { if (rows.length) groups.push({title, rows}); };
  const row = (label, left, right) => ({label, left: String(left), right: String(right)});
  add('Hunter', [row('Name', current.username, other.username), ...Object.keys(current.stats).filter(key => key in other.stats).map(key => row(key, current.stats[key], other.stats[key]))].filter(x => x.left !== x.right));
  const inventory = editor => {
    const entries = new Map();
    for (const item of editor.articles) {
      const key = `${item.location}:${item.family}:${item.second}`;
      const entry = entries.get(key) || {label: `${item.info.item_name}${item.family === 'weapon' && item.level ? ` +${item.level}` : ''} (${item.location}, #${item.id})`, amount: 0};
      entry.amount += item.amount;
      entries.set(key, entry);
    }
    return entries;
  };
  const a = inventory(current), b = inventory(other);
  add('Inventory and storage', [...new Set([...a.keys(), ...b.keys()])].map(key => row((a.get(key) || b.get(key)).label, a.get(key)?.amount || 0, b.get(key)?.amount || 0)).filter(x => x.left !== x.right).sort((x,y) => x.label.localeCompare(y.label)));
  const flags = (title, entries, read, labels) => add(title, entries.map(entry => row(labels(entry), read(current, entry) ? 'Yes' : 'No', read(other, entry) ? 'Yes' : 'No')).filter(x => x.left !== x.right));
  flags('Bosses defeated', data.bosses, (e, x) => e.bossDead(x), x => x.name);
  flags('Lamps unlocked', data.lamps, (e, x) => e.lampEnabled(x.eventFlag), x => `${x.area} — ${x.name}`);
  flags('Shortcuts open', data.shortcuts, (e, x) => e.shortcutEnabled(x.eventFlag), x => `${x.area} — ${x.name}`);
  add('NPC quest and related flags (inferred)', compareQuestFlags(current, other, data).rows);
  add('NPC character-state candidates (unverified)', compareCharacterCandidates(current, other));
  return groups;
}
