# NPC quest research

The experimental NPC page provides individual bit controls. The game files contain the conditions, but an event flag number is not itself a byte address in userdata. Group 1 (1000–1999) now has an inferred address; other unmapped groups require a manually supplied relative offset. Complete, tested transition recipes are still needed. Map event groups are inferred only where the existing lamp or shortcut data supplies a consistent anchor. A group offset is relative to the editor's flag base (username + 68545), and the stored flags are assumed to be MSB first, with 1,000 flags per group. That arithmetic is established for some map groups, not automatically for every group or save.

## Global quest block

In `common.emevd`, the constructor initializes 22 state ranges (1000–1279 and 1300–1459, in ranges of 20) to their first flag when the range is empty. Scanning the early `lamp-test/before/userdata0001` against those defaults gives group 1 base **1002** relative to the editor's flag base: all 22 ranges have exactly one flag, and 21 use their initial flag; the other is 1121. Eileen is 1360. The user reports Eileen is present in Central Yharnam with her initial dialogue in the relevant early run, consistent with this state. Ten upstream test saves also show predominantly one active flag per range, with plausible different Eileen and Alfred states. Some ranges have multiple bits on, so do not assume exclusivity as a hard validity rule. The saves are not all independent controlled comparisons; the address and individual quest edits remain inferred, not verified through in-game edits.

For example, existing shortcut 12410112 is at relative offset 7266, mask 0x80; it implies group 12410 starts at 7252, so 12410805 would be at relative 7352 with mask 0x04. This is an inferred address, not a tested NPC-state edit. Flag 12410805 is the event's completion flag and is distinct from quest flag 1368.

## Eileen and Henryk

The [Central Yharnam event decompilation](https://github.com/Grimrukh/soulstruct-vanilla/blob/main/bloodborne/events/m24_01_00_00.evs.py) events 12410800–12410809 and the installed m24_00 talk script t240325 give a concrete example:

- 12410800 branches on flags 1360–1375, and also uses 1700–1705 to determine Eileen's location, death handling and hostility.
- 12410803 sets 1366 after entity 2410901 dies with 1363 set. 12410804 sets 1367 on that death if 1364 or 1365 was set. Both first clear 1360–1379.
- 12400651 and 12400652 change 1360→1362 and 1361→1363 when the player reaches a Cathedral Ward region; 12410811 changes 1363 or 1364 to 1365 when Eileen enters the encounter. Common events 9722 and 9723 change 1373→1370 or 1374→1372 when 9802 is on. Cathedral Ward event 12400654 changes 1370→1371 on the opponent's death. These are branches, not a linear sequence.
- 12410805 waits for entity 2410900 to die, clears and sets a position flag in 1700–1705 based on the previous quest state, then clears 1360–1379 and sets 1368. 12410806 similarly sets 1369 and makes her hostile.
- Cathedral Ward event 12400650 can set 1368 and 1376 together after signal 72400524; 1376 is not necessarily an alternative to 1368. This explains one of the upstream saves with two bits in that range.
- 12410809 suppresses entity 2410901 with 1366, 1367, 9467 or 9802; it also checks other state flags before enabling it. Resetting only Eileen's death state therefore cannot be assumed to restore the fight.
- t240325 checks 1368; it sets 9074, an NPC gift request described in [Yharnam Together's handoff](https://github.com/Amanises-Yharnam-Together/BBSC-Yharnam-Together/blob/main/docs/HANDOFF.md). Gift requests are distinct from quest state.

These are script-level observations, not tested save edits. The decompilation's version must also be checked against the user's installed game before applying its logic.

## Valtr and Simon

The installed m27_00 talk script t270503 checks 1790 and sets 6814. Yharnam Together documents 1790 in Valtr's death-drop logic, 6810–6812 as League ranks, 6813 as joining and 6814 as a talk flag. It identifies Simon's 1710–1713 as death flags used alongside bowblade drop events. Their exact relationships to NPC quest reset, items, rewards and other map copies remain to be traced and tested.

## Additional candidate ranges

The installed talk scripts associate Arianna (t240318) with flags 1221–1231, Adella (t240322) with 1304–1307, Iosefka (t241313) with 1121–1124, and Gilbert (t241319) with 1240–1245. These support associating the enclosing common initialization ranges with those NPCs, but cross-NPC checks are common, so individual meanings and the full range assignments are still hypotheses. Talk and gift flags from Yharnam Together's FLAGS.md and HANDOFF.md are included separately; their saved block offsets are not established here.

The installed map events give stronger transition details for these candidates. Central Yharnam event 12410730 changes 1120 to 1121 with 9401; 12410731 and 12410732 use dialogue signals 72410305 and 72410309 to reach 1122 and 1123; 12410733 sets 1124 when 9800 is on. Event 12410762 updates 1240→1241→1242→1243→1246 based on world flags and a dialogue signal, and 12410761 sets 1245 when entity 2410781 dies. Cathedral Ward event 12400520 changes 1224→1225→1226→1228 under different world flags; 12400900 and 12400901 handle 1304–1308, with one branch setting both 1306 and 1230. These actions may fire immediately on map load, so a state may not remain as edited.

`tools/index-npc-events.py` indexes direct literal flag writes in the installed game event files into `src/npc-event-index.json`, including source hashes. The hidden tab shows the write sites for listed bits. Events with parameters are excluded, and the index does not decode conditions, dialogue or prove that a flag is persistent. The event and instruction numbers are a starting point for further tracing, not standalone recipes.

## Next work

Trace each NPC's EMEVD branches and talk states together, identify cross-map flags and inventory/boss dependencies, and map the relevant low-numbered flags to saved bits. Use disposable saves from known stages to validate both reading and writing, including reloading and travel to all affected maps. A broad completed save can help identify likely states, but pairs around specific events provide stronger evidence. Do not bulk-set the state range: the scripts clear ranges before selecting a new state.
