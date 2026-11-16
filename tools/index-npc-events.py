"""Index literal writes to global NPC flags in an unpacked Bloodborne event folder.

Usage: py -3 tools/index-npc-events.py <dvdroot_ps4/event>
Parameterized instructions are resolved from literal same-file RunEvent calls.
Unresolved calls and common-event calls are omitted.
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
event_checks = {}
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
        events, calls = {}, {}
        for i in range(fields[0]):
            event, count, first, param_count, param_offset, _, _ = struct.unpack_from('<qqqqqii', data, fields[1] + i * 48)
            instructions = []
            for j in range(count):
                bank, instruction, size, offset, _ = struct.unpack_from('<iiqqq', data, fields[3] + first + j * 32)
                args = data[fields[13] + offset:fields[13] + offset + size] if offset >= 0 and size > 0 and offset + size <= fields[12] else b''
                instructions.append((bank, instruction, args))
            params = [struct.unpack_from('<qqqii', data, fields[9] + param_offset + j * 32) for j in range(param_count)]
            events[event] = (instructions, params)
        for caller, (instructions, params) in events.items():
            if params:
                continue
            for bank, instruction, args in instructions:
                if (bank, instruction) == (2000, 0) and len(args) >= 8:
                    slot, target = struct.unpack_from('<II', args)
                    calls.setdefault(target, []).append((caller, slot, args[8:]))
        for event, (instructions, params) in events.items():
            contexts = calls.get(event, []) if params else [(None, None, b'')]
            for caller, slot, call_args in contexts:
              def resolved_args(j, original_args):
                args = bytearray(original_args)
                for index, target, source, length, _ in params:
                    if index != j:
                        continue
                    if target < 0 or source < 0 or length < 0 or target + length > len(args) or source + length > len(call_args):
                        return None
                    args[target:target + length] = call_args[source:source + length]
                return args
              checks = set()
              deaths = set()
              for j, (bank, instruction, original_args) in enumerate(instructions):
                args = resolved_args(j, original_args)
                if args is None:
                    continue
                if (bank, instruction) in ((3, 0), (1003, 1), (1003, 2)) and len(args) >= 8 and args[1] in (0, 1) and args[2] == 0:
                    flag = struct.unpack_from('<I', args, 4)[0]
                    if 0 < flag < 2000000000:
                        checks.add((flag, args[1]))
                elif (bank, instruction) == (4, 0) and len(args) >= 12:
                    entity, state = struct.unpack_from('<II', args, 4)
                    if entity and state in (0, 1):
                        deaths.add((entity, state))
              key = f'{path.name}:{event}:{caller}:{slot}'
              for j, (bank, instruction, original_args) in enumerate(instructions):
                if len(original_args) < 8 or (bank, instruction) not in ((2003, 2), (2003, 22)):
                    continue
                args = resolved_args(j, original_args)
                if args is None:
                    continue
                if (bank, instruction) == (2003, 2):
                    flag, value = struct.unpack_from('<II', args)
                    targets = [flag] if 1000 <= flag <= 1999 and value in (0, 1) else []
                    action = 'set' if value else 'clear'
                elif (bank, instruction) == (2003, 22) and len(args) >= 12:
                    start, end, value = struct.unpack_from('<III', args)
                    targets = range(max(1000, start), min(1999, end) + 1) if value in (0, 1) else []
                    action = 'batch set' if value else 'batch clear'
                else:
                    continue
                for flag in targets:
                    entry = {'map':path.name.replace('.emevd.dcx',''), 'event':event, 'instruction':j, 'action':action}
                    if caller is not None:
                        entry.update({'caller':caller, 'slot':slot})
                    if checks or deaths:
                        entry['checksKey'] = key
                        event_checks[key] = {'flags':sorted(checks), 'characters':sorted(deaths)}
                    result.setdefault(str(flag), []).append(entry)
    except (ValueError, struct.error, zlib.error) as error:
        raise SystemExit(f'Could not parse {path}: {error}')

out = Path(__file__).resolve().parents[1] / 'src' / 'npc-event-index.json'
out.write_text(json.dumps({'sources':sources, 'flags':result, 'checks':event_checks}, separators=(',', ':')) + '\n', encoding='utf-8')
print(f'Indexed literal writes for {len(result)} flags from {len(sources)} event files into {out}.')
