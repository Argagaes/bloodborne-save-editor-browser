"""Index literal writes to global NPC flags in an unpacked Bloodborne event folder.

Usage: py -3 tools/index-npc-events.py <dvdroot_ps4/event>
Parameterized events are omitted: their actual arguments need separate tracing.
The result is an index of write sites, not a quest sequence or a save mapping.
"""
import hashlib
import json
import struct
import sys
import zlib
from pathlib import Path

event_dir = Path(sys.argv[1])
result = {}
sources = {}
for path in sorted(event_dir.glob('*.emevd.dcx')):
    if path.name != 'common.emevd.dcx' and not path.name.startswith('m'):
        continue
    raw = path.read_bytes()
    try:
        data = zlib.decompress(raw[0x4c:])
        if data[:4] != b'EVD\0':
            continue
        fields = struct.unpack_from('<16q', data, 16)
        sources[path.name] = hashlib.sha256(raw).hexdigest()
        for i in range(fields[0]):
            event, count, first, param_count, _, _, _ = struct.unpack_from('<qqqqqii', data, fields[1] + i * 48)
            if param_count:
                continue
            for j in range(count):
                bank, instruction, size, offset, _ = struct.unpack_from('<iiqqq', data, fields[3] + first + j * 32)
                if offset < 0 or size < 8 or offset + size > fields[12]:
                    continue
                args = data[fields[13] + offset:fields[13] + offset + size]
                if (bank, instruction) == (2003, 2):
                    flag, value = struct.unpack_from('<II', args)
                    targets = [flag] if 1000 <= flag <= 1999 and value in (0, 1) else []
                    action = 'set' if value else 'clear'
                elif (bank, instruction) == (2003, 22) and size >= 12:
                    start, end, value = struct.unpack_from('<III', args)
                    targets = range(max(1000, start), min(1999, end) + 1) if value in (0, 1) else []
                    action = 'batch set' if value else 'batch clear'
                else:
                    continue
                for flag in targets:
                    result.setdefault(str(flag), []).append({'map':path.name.replace('.emevd.dcx',''), 'event':event, 'instruction':j, 'action':action})
    except (ValueError, struct.error, zlib.error) as error:
        raise SystemExit(f'Could not parse {path}: {error}')

out = Path(__file__).resolve().parents[1] / 'src' / 'npc-event-index.json'
out.write_text(json.dumps({'sources':sources, 'flags':result}, separators=(',', ':')) + '\n', encoding='utf-8')
print(f'Indexed literal writes for {len(result)} flags from {len(sources)} event files into {out}.')
