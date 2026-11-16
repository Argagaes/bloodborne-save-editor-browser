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

The installed DLC events 13400950, 13500950 and 13600950 also use 1710–1729 as a state range. They clear that range before setting 1720, 1721, 1722 or 1723 under different dialogue and map conditions. In event 13600950, state 1723 together with 73600501 leads to 1713. Resolved event templates also associate 1710 and 1711 with deaths of the two Hunter's Nightmare versions, 1712 with the Research Hall version, and 1725–1727 with their respective hostile states. These are script-level transitions, not verified restart presets; the code has alternative paths and additional conditions.

## Additional candidate ranges

The installed talk scripts associate Arianna (t240318) with flags 1221–1231, Adella (t240322) with 1304–1307, Iosefka (t241313) with 1121–1124, and Gilbert (t241319) with 1240–1245. These support associating the enclosing common initialization ranges with those NPCs, but cross-NPC checks are common, so individual meanings and the full range assignments are still hypotheses. Talk and gift flags from Yharnam Together's FLAGS.md and HANDOFF.md are included separately; their saved block offsets are not established here.

The installed map events give stronger transition details for these candidates. Central Yharnam event 12410730 changes 1120 to 1121 with 9401; 12410731 and 12410732 use dialogue signals 72410305 and 72410309 to reach 1122 and 1123; 12410733 sets 1124 when 9800 is on. Event 12410762 updates 1240→1241→1242→1243→1246 based on world flags and a dialogue signal, and 12410761 sets 1245 when entity 2410781 dies. Cathedral Ward event 12400520 changes 1224→1225→1226→1228 under different world flags; 12400900 and 12400901 handle 1304–1308, with one branch setting both 1306 and 1230. These actions may fire immediately on map load, so a state may not remain as edited.

The installed t241314 dialogue checks flags 1140–1149 in addition to several survivor flags. Yharnam Together separately associates 1140–1146 with the impostor's visibility. These candidate states are listed separately from the 1120 range; their precise meanings and how to reset both characters remain untested.

Djura's talk t230323 sets his badge request 9071 and checks 1320–1325. Old Yharnam events 12300700–12300705 use those six states: 1320 and 1325 select a friendly team, 1321–1323 select enemy behavior through different triggers, and 1324 disables the character and drops treasure. A region, attack, dialogue signal or event completion can change the state on load, and resetting 1324 alone does not establish that character records or all other prerequisites are reset.

The young girl's installed dialogue t241320 contains gift request 9067 and reads 1260–1273; event 12410701 advances several branches in 1260–1279 and event 12410702 enables an object and treasure when 1273 is on. Annalise's t250307 checks 1040 and 1041 and references covenant gift request 9042, supporting 1040–1059 as a candidate range. State labels reflect only observed script behavior; the outcomes of changing them are untested.

The talk scripts t240312 / t240504 (Chapel Dweller's Triumph gesture) check 1102–1109; map event 12400706 sets 1106 on the character's death. The Nightmare Frontier t320329 (Patches' Beg for Life gesture) checks 1420–1422 and 1430; common event 9780 advances 1422 to 1423 under further conditions. Yharnam Together also identifies the gesture ownership flags shown in the tab. Those per-player flags are distinct from NPC quest states, and their save block location remains unverified.

`tools/index-npc-events.py` indexes direct flag writes in the installed game event files into `src/npc-event-index.json`, including source hashes. It resolves parameterized write instructions when the same file calls the template with literal arguments: for instance event 12400593 sets Alfred's hostile flag 1341 or 1345 depending on the slot, and 12400594 sets death flag 1342 or 1346. The hidden tab shows write sites, resolved call slots, and a subset of flag and character checks anywhere in that event. Those checks may belong to different branches and are not proof that a particular check gates a particular write. Unresolved calls, common-event calls, many instruction types and dialogue are omitted; the index does not prove that a flag is persistent. Event and instruction numbers are starting points for tracing, not standalone recipes.

## Next work

Trace each NPC's EMEVD branches and talk states together, identify cross-map flags and inventory/boss dependencies, and map the relevant low-numbered flags to saved bits. Use disposable saves from known stages to validate both reading and writing, including reloading and travel to all affected maps. A broad completed save can help identify likely states, but pairs around specific events provide stronger evidence. Do not bulk-set the state range: the scripts clear ranges before selecting a new state.

## Gehrman, chapel survivors and Brador

The installed MSB assigns NPC parameters 6090 and 6080 to Cathedral Ward entities 2400730 (Lonely Old Woman) and 2400765 (Skeptical Man), and 6100 to the Beggar's human entities 2400755 and 2700755. Cathedral Ward events 12400500/501, 12400560/561 and 12400610/611 tie these characters respectively to state ranges 1180–1199, 1160–1179 and 1200–1219. Their individual transitions are documented in the experimental controls; the 12400629 survivor branches cross NPC ranges.

Dream events 12100140–145 and 12100160 use Gehrman's 1020–1039 state range and can rewrite or hide his character based on progression. The installed MSB assigns Brador's cell character 3500901 NPC parameter 6521; the resolved 13500900 slot 2 waits for that character's death and clears 1730–1749 before setting 1730. This is a strong script association, not a verified save reset. None of these additions has been tested as an NPC revive or quest transition.

This initial pass left Master Willem, Blood Minister and Yamamura unresolved. The later trace below identifies Willem’s state range and Yamamura’s completion flag; the Blood Minister remains unresolved.

## Remaining NPC trace, 16 November 2026

### Master Willem

Installed MSB model c5130, entity 3200100, talk 320310, description 会話NPC_大学教授. Event 13200120 checks 1061 on load; if set, it disables backread and drops mandatory treasure. Otherwise it waits for character death, clears 1060–1079, sets 1061 and requests a save. Event 13200121 consumes request 73200300 for his interaction animation and has a branch calling common insight event 9350. This establishes the death state but does not identify every flag in the enclosing range.

### Yamamura

Installed MSB entity 3500930, NPC and character-init 6590, talk 350552, description ヤマムラ. The constructor calls 13501900 slot 0 with this character, and 13500460 slot 0 with animation 103170. Event 13501900 hides the character if its own slot completion flag is already on; otherwise it waits for death and ends. Its persistent completion flag is therefore 13501900. This NPC does not require an invented global 20-state range. The 6530–6533 NPC parameters refer to summon variants, which must not be confused with his cell version.

### Adeline

Constructor/preconstructor resolves 13500960 to human entity 3500910 and head entity 3500911. It initializes an empty 1750–1769 range to 1760. Signal 73500301 with 1760 selects 1761; signal 73500309 with 1761 selects 1762. Flags 73500330/331 and 73500335/336 affect alternative branches and are not themselves interchangeable quest stages. The event separately handles 1750, 1751 and 1752 character placement/death branches.

### Blood Minister

No persistent state association established. Entity 2410700, NPC 6060, is explicitly described as the clinic female doctor and uses Iosefka talk 241313 and range 1120–1124. It is not evidence for assigning those flags to the Blood Minister. Opening-cutscene progression, an NPC character's existence, and a reversible quest state are different things. The page now explains this specific gap instead of claiming it has not been researched.

### Save addresses and evidence limits

Map dialogue/request groups now reuse the same inferred map-group layout as lamp relighting: the group start is the corresponding availability group start minus 92000 bytes. This is supported by Central Yharnam lamp tests, not by in-game tests of every NPC or map. Unknown groups remain disabled or require manual calibration. No revival presets were added. `npc-additional-evidence.json` preserves raw instruction arguments, event parameters, and relevant call sites for the above installed-event traces. The existing event index records source hashes.

Character identity cross-check: https://www.bloodborne-wiki.com/2020/02/datamined-npcs-stats-equipment.html and https://soulsmodding.com/doku.php?id=bb-refmat:character-list . The installed MSB descriptions and event calls are the primary local evidence.
