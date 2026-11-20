const SYSTEM_SIZE = 262144;
const OCCUPIED = 0x108c;
const TABLE = 0x1096;
const STRIDE = 0x192;

function checkSystem(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== SYSTEM_SIZE) throw Error('Choose a decrypted userdata0010 system file (262,144 bytes).');
  if (Array.from(bytes.subarray(OCCUPIED, OCCUPIED + 10)).some(value => value > 1)) throw Error('The system file has an unsupported slot table.');
}

export function sourceSlot(filename) {
  const match = /^userdata000([0-9])$/i.exec(filename);
  if (!match) throw Error('Open the original character file named userdata0000 through userdata0009 first.');
  return Number(match[1]);
}

export function readSaveSlots(system) {
  checkSystem(system);
  return Array.from({length: 10}, (_, slot) => {
    const start = TABLE + slot * STRIDE;
    let name = '';
    for (let i = 0; i < 16; i++) {
      const code = system[start + i * 2] | system[start + i * 2 + 1] << 8;
      if (!code) break;
      name += String.fromCharCode(code);
    }
    return {slot, occupied: system[OCCUPIED + slot] === 1, name};
  });
}

export function copySaveSlot(system, source, target, originalNameBytes) {
  const slots = readSaveSlots(system);
  if (!Number.isInteger(source) || source < 0 || source > 9 || !Number.isInteger(target) || target < 0 || target > 9) throw Error('Choose a slot from 0 to 9.');
  if (!slots[source].occupied) throw Error('The source slot is empty in this system file.');
  if (slots[target].occupied) throw Error('The destination slot is already occupied. Choose an empty slot.');
  if (!(originalNameBytes instanceof Uint8Array) || originalNameBytes.length !== 32) throw Error('Could not read the original character name.');
  const name = TABLE + source * STRIDE;
  const decode = bytes => { let s=''; for(let i=0;i<32;i+=2){const c=bytes[i]|bytes[i+1]<<8;if(!c) break;s+=String.fromCharCode(c);} return s; };
  if (decode(system.subarray(name,name+32)) !== decode(originalNameBytes)) throw Error('The source slot name in userdata0010 does not match the opened character. Choose its matching system file.');
  const result = system.slice();
  result.set(system.subarray(name, name + STRIDE), TABLE + target * STRIDE);
  result[OCCUPIED + target] = 1;
  return result;
}
