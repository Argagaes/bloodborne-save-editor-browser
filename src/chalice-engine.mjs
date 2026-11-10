// Binary layouts and flag values from Noxde's original Chalice Editor.
export const ALTAR_COUNT = 6;
export const RECORD_SIZE = 124;
export const STRIDE = 0x7d;
export const DUNGEON_OFFSET = 88328;
export const FLAGS_OFFSET = 102704;
export const CATEGORY_NAMES = {
  farming: 'Echoes and materials',
  equipment: 'Equipment',
  bloodgems: 'Blood gems',
  testing: 'Testing and cut content',
};

export function parseRecord(values) {
  if (!Array.isArray(values) || values.length !== RECORD_SIZE) throw Error('Dungeon records must contain exactly 124 bytes.');
  return Uint8Array.from(values.map(value => {
    const n = typeof value === 'string' && /^0x[0-9a-f]{1,2}$/i.test(value) ? Number.parseInt(value, 16) : value;
    if (!Number.isInteger(n) || n < 0 || n > 255) throw Error('Dungeon records contain an invalid byte.');
    return n;
  }));
}

export function parseCatalog(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Choose a dungeon catalog JSON object.');
  const result = [];
  for (const [category, records] of Object.entries(input)) {
    if (!Array.isArray(records)) throw Error(`Invalid category: ${category}.`);
    for (const record of records) {
      if (!record || typeof record.glyph !== 'string' || !record.glyph.trim() || typeof record.desc !== 'string') throw Error('Each dungeon needs a glyph, description, and bytes.');
      result.push({ id: `${category}:${result.length}`, category, glyph: record.glyph, desc: record.desc, bytes: parseRecord(record.bytes) });
    }
  }
  if (!result.length) throw Error('The dungeon catalog is empty.');
  return result;
}

export const equalBytes = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const EMPTY = new Uint8Array(RECORD_SIZE).fill(0xff);
EMPTY.set([0xff,0xff,0xff,0xff,0,0,0,0,0x80,0,0,0]);
EMPTY.fill(0, 92);
export const ACTIVE_FLAGS = new Uint8Array(124);
ACTIVE_FLAGS.set([0x30,0,0x03,0xe8,0,0x04]);
ACTIVE_FLAGS.set([0x03,0x02], 16);

export function hasAltarLayout(bytes, inventoryOffset) {
  const end = inventoryOffset + FLAGS_OFFSET + STRIDE * (ALTAR_COUNT - 1) + ACTIVE_FLAGS.length;
  return inventoryOffset >= 469 && end <= bytes.length
    && equalBytes(bytes.subarray(inventoryOffset, inventoryOffset + 4), Uint8Array.of(0x40, 0xf0, 0xff, 0xff));
}

function altarOffset(inventoryOffset, slot, base) {
  return inventoryOffset + base + STRIDE * (slot - 1);
}

export function readAltars(bytes, inventoryOffset, catalog) {
  if (!hasAltarLayout(bytes, inventoryOffset)) return [];
  return Array.from({ length: ALTAR_COUNT }, (_, index) => {
    const slot = index + 1;
    const start = altarOffset(inventoryOffset, slot, DUNGEON_OFFSET);
    const record = bytes.subarray(start, start + RECORD_SIZE);
    return {
      slot,
      dungeon: catalog.find(dungeon => equalBytes(record, dungeon.bytes)),
      empty: equalBytes(record, EMPTY),
    };
  });
}

export function writeAltar(bytes, inventoryOffset, slot, dungeon) {
  if (!hasAltarLayout(bytes, inventoryOffset)) throw Error('This save does not have a supported altar layout.');
  if (!Number.isInteger(slot) || slot < 1 || slot > ALTAR_COUNT) throw Error('Choose an altar from 1 to 6.');
  if (!(dungeon?.bytes instanceof Uint8Array) || dungeon.bytes.length !== RECORD_SIZE) throw Error('Choose a valid dungeon.');
  bytes.set(dungeon.bytes, altarOffset(inventoryOffset, slot, DUNGEON_OFFSET));
  bytes.set(ACTIVE_FLAGS, altarOffset(inventoryOffset, slot, FLAGS_OFFSET));
}
