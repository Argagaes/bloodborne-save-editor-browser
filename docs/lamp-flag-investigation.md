# Lamp flag investigation

The Enhanced mod's `_data/emevd_patches.json`, event 12102200, enables individual map flags ending in 7810, 7830, etc. Its `_data/settings.json` describes the result as warpable lamps, with some still needing to be lit. Hunter's Dream event 12105020 checks these map flags to enable a headstone. The persistent flags are distinct from the 7MMM01LL and 7MMM02LL request flags. The Yharnam Together flag table independently describes the persistent flag as `10007810 + mapCode * 10000 + lampIndex * 20`.

For map m24_01 the Dream event checks 12417810, 12417830, 12417850 and 12417870. Lamp index-to-name correspondence and their storage addresses remain unverified. Do not assume that the order in the editor's teleport menu is their event index.

The editor locates its existing flag area at username + 68545 (equivalently FACE marker + 34028 - 469 + 68545). Its boss database assigns Father Gascoigne's defeated state to relative offset 21727 and mask 0x80. If that is event flag 12411800 and flags within this map occupy a contiguous MSB-first bitfield, this predicts 12417810 at relative offset 22478 and mask 0x20, and 12417830 at relative offset 22480 and mask 0x02. These are hypotheses, not verified addresses; the bit numbering, grouping, lamp names, and save serialization must be checked before enabling writes. Existing boss flags alone cannot establish the layout of all maps.

## Controlled comparison

1. Back up the whole SPRJ0005 save folder and keep the original safe. Use a disposable character or copy.
2. Choose an unlit ordinary lamp, preferably Central Yharnam, with its area already loaded. Quit to the main menu and copy that character's `userdata000N` to a clearly named `before` file. Do not change equipment or inventory between captures.
3. Continue, light that one lamp, then quit to the main menu and copy the same character file to `after`. Record the exact lamp name and whether it was already present in the Dream's headstone menu. Avoid acquiring items or defeating enemies if possible.
4. Provide both files and the lamp name. A second pair for a different lamp in the same map can test the predicted 20-bit stride. Test the modified copies in game before shipping the feature.

Saves can shift offsets when the upgrade table changes, so compare relative to each save's independently located FACE/username anchor. Game and emulator versions, NG cycle, multiplayer, and mods may affect flags. Save backups in `G:\Yharnam Together\user\save-backups` have undocumented intervening gameplay and cannot independently identify the change.

Filling an unbounded range with 0xFF also changes unrelated event flags and is not a reliable way to unlock lamps. Warping into a boss area before defeating the boss can trap the character; keep a backup and an escape item.

## Controlled save pair, 12 November 2026

The provided `lamp-test/before/userdata0001` and `lamp-test/after/userdata0001` both locate FACE at 0x1271C and the editor's flag base at 0x1AC1C. Across the first 30,000 bytes from that base, five bytes changed: relative 368 (96→97), 880 (00→02), 4216 (68→78), 4766 (00→08), and 15902 (00→40). These are candidates, not established lamp bits; other game state can change during a lamp interaction. The predicted m24_01 offsets 22478 and 22480 did not change; without knowing the lamp, this does not confirm or disprove the hypothesis. The two complete files differ in many other positions, so raw whole-file diffs must not be treated as lamp flags. The lamp name and any other actions or mods during capture are needed to interpret this pair.

## Candidate test

Central Yharnam was the lamp lit between the two captures. The user tested a copy of `before` with only relative offset 880 bit 0x02 set; the lamp was not lit and was not available at the headstone. This rules out that isolated change as sufficient in that test, but does not establish which other bits are required. A second disposable test save, `lamp-test/candidate-five/userdata0001`, applies all five observed differences in the first 30,000 bytes of the editor flag area. It differs from `before` at exactly those five bytes.

The five-byte candidate did not make Central Yharnam lit or available at the headstone. An expanded comparison found five additional changed bytes before LCED, at relative offsets 79145, 79155, 79184, 107978, and 107980. Their purpose is unknown. Neither capture contains the suggested `30 00 02` sequence before LCED, so that search recipe does not locate a region in these files. Before interpreting or editing those bytes, check the unmodified after save as a positive control and establish which mods were active.

Positive control: user confirms the unmodified after save has Central Yharnam lit and present at the headstone, alongside Iosefka's Clinic. Yharnam Together was active. Therefore, the state is recoverable from the character file, though other game effects may accompany the comparison. The candidate-through-lced file copies the entire [flag base, LCED) interval from after into before; exactly ten bytes change. It tests whether these ten changes are collectively sufficient; it does not imply all are lamp flags.

The user reports candidate-through-lced makes Central Yharnam lit and available; they used the lit lamp to return to the Dream. Since the earlier candidate-five was insufficient, candidate-late-five applies only the other five differences (relative 79145, 79155, 79184, 107978, 107980) to before. This tests whether the earlier five are needed in combination.

The user reports candidate-late-five also makes Central Yharnam lit and available. Split those changes into candidate-three (relative 79145, 79155, 79184) and candidate-two (relative 107978, 107980), both based on before. Testing each establishes whether one group is sufficient; failure of one group does not rule out a combination.

The user reports candidate-two makes the lamp lit and available. It changes 0x351E6 from 30 to 20 and 0x351E8 from 00 to 03 in this save. Created candidate-set-byte and candidate-cleared-bit to test each independently. Absolute offsets are specific to this save; the byte pair is relative to the character flag base at 107978 and 107980.

The user reports candidate-set-byte (only 0x351E8 00→03) makes Central Yharnam lit and available. Prepared independent candidate-bit-01 and candidate-bit-02 to determine whether one or both bits suffice.


The user tested both individual bits of 0x351E8: 0x01 alone left Central Yharnam unlit and unavailable; 0x02 alone made it lit and available. This establishes a sufficient single-bit edit for that test save, at flag base + 107980, with mask 0x02. The bit corresponds to event 12417830 under an MSB-first 1000-flag block layout starting at flag base + 107877. The nearby clinic bit at base + 107978 has mask 0x20, matching 12417810 and the user's observed unlocked clinic; this mapping is consistent but the event-ID assignment remains an inference. Offsets for other maps are not established. The editors now offer the tested Central Yharnam unlock only.


The user confirmed that candidate-next-lamp, setting flag base + 107983 mask 0x20 alone, unlocks Great Bridge. This is consistent with the inferred 12417850 flag and a 20-bit stride from Central Yharnam. Both confirmed lamps are now available in the editors. candidate-fourth-lamp tests the next predicted bit at flag base + 107985 mask 0x02; its name is unconfirmed.


The user confirmed candidate-fourth-lamp unlocks Tomb of Oedon, so flag base + 107985 mask 0x02 is the third confirmed edit. The Dream-based new-base save has a different FACE/username position, but preserves the character-relative lamp addresses.

The Dream new-base vs Enhanced all-lamps comparison yielded 44 script-listed lamp bits. All 44 inferred bits are set in the modded save, including the clinic and Great Bridge bits already set in the baseline. Their flag bytes are spaced by 125 bytes for consecutive map groups, with a reserved group between m28 and m32; this matches the three individually verified m24_01 lamps. `lamp-test/lamp-flags-inferred.json` records event IDs, map codes, inferred offsets and masks. `lamp-test/candidate-all-lamps/userdata0001` applies only these 44 masks to new-base, changing 42 bytes, without the other mod-induced changes. This is a strong pattern, but it needs a headstone test and per-name mapping before claiming every individual destination is verified.


The user confirmed candidate-all-lamps unlocks all lamps in the headstone menus. The 44-bit batch is therefore in-game validated as a group, though individual name-to-flag matches still need verification. Both editors now offer an unlock-all action that sets exactly these masks.


Lamp entity IDs mMMM0950 + index were read from the installed MSBB maps using SoulsFormats. Comparing their positions with the editor destination coordinates yields a close match for 42 of 44; this corrects cases where destination list order differs from the flag index. Map 260 index 0 and map 320 index 2 remain unidentified because no corresponding nearby destination is present in the editor catalog. Individual names other than the original three have not yet been isolated in game. The user reported all headstone destinations unlocked with the 44-bit candidate.


The user reports map-index-0 exposes Nightmare of Mensis at the Nightmare headstone and map-index-2 exposes Moonside Lake at the Frontier headstone, identifying 12607810 and 13207850 respectively. The editor position catalog had incorrectly labelled the m33 index-1 position Nightmare of Mensis. Since the user identified Mensis as m26 index 0 and the available Nightmare headstone destinations include Amygdala’s Chamber, m33 index 1 is labelled Amygdala’s Chamber as an inference; it has not been tested independently.


Correction: the user later reported the DLC headstone was inactive in both candidate-all-lamps and the Enhanced all-lamps save. All ten inferred DLC lamp bits are set in both saves, but their availability through the DLC headstone is not verified. The current Yharnam Together log reports one SPEXPANSIONDLC03 add-on license to the game, although that does not prove the game accepted it. Dream event 12105024 calculates flag 12105034 from DLC lamp flags. As a diagnostic only, candidate-dlc-headstone starts from candidate-all-lamps and sets a single unverified byte at relative 105881, mask 0x20, hypothesized to correspond to flag 12105034 if all intervening 1000-flag groups are laid out consecutively. The layout and behavior of that bit are unverified; the event could also clear it.

The user reports candidate-dlc-headstone did not activate the DLC headstone. The launcher log says one SPEXPANSIONDLC03 license is reported, but the profile also reports zero mounted add-ons; these facts do not establish why the headstone is unavailable. The candidate-dlc-visit save uses the final editor's existing teleport operation to place the candidate-all-lamps character at the Hunter's Nightmare destination. A visit and return to the Dream can test whether entering the DLC sets an additional flag or initializes the headstone. Its result is unverified.
