# Bloodborne Save Editor

Open a decrypted Bloodborne character file such as `userdata0000`. Edit the hunter, inventory, storage, gems, runes, bosses, character settings, and six chalice altars in one session. **Changes**, **Undo**, **Redo**, and **Download save** apply across all sections. Save data stays in the browser.

Use **Download original backup** to keep a copy of your save before replacing it. **Use example save** opens a bundled public test fixture.

## Run locally

Use Node.js 22.12 or newer in this folder.

```powershell
npm ci
npm run dev
```

Run `npm test` to check the browser editor. The additional compatibility tests run when Noxde’s original repository is checked out alongside this one as `bb-save-editor`.

## Credits

Browser port, tool integration, lamps and shortcuts by **Argagaes**, who also hosts the editor.

- [Noxde’s Bloodborne Save Editor](https://github.com/Noxde/Bloodborne-save-editor) is the basis for the save editing features and provides the example fixture.
- [Noxde’s Chalice Dungeon catalog](https://gist.github.com/Noxde/a29f699f4175bf315d9bd4baeebefb66) supplies the dungeon records used in Altars.
- [Yharnam Together](https://github.com/Amanises-Yharnam-Together/BBSC-Yharnam-Together) provides the map renderer and map data used for the shortcut maps.

The editor code is licensed under [GPL-3.0](LICENSE). Third-party artwork retains its respective ownership and terms.


The Lamps tab can toggle individual lamps, all lamps in an area, or all 44 lamp flags. The DLC headstone remained inactive in testing and may require an additional condition; early travel to boss lamps can cause problems. Keep a backup.


The Shortcuts tab lists 65 shortcut-related flags from Enhanced across 14 maps, grouped one map at a time. Five Central Yharnam entries were tested individually; the remaining flag addresses and object associations are inferred from a save comparison and game event scripts, and may represent progression flags or several objects. Entries without an identifiable position show `(no pos)`. Purple outlines mark multiple possible locations associated with one entry. Global enable sets all listed bits and clears 11 known auxiliary bits. Global disable clears the listed bits and restores those auxiliary bits to their values when the save was opened. Seven transient flag operations from the mod are excluded because their persistent save layout is unknown. This is experimental; keep a backup.

All 14 area maps are bundled as generated images, so the Shortcuts tab opens the appropriate map automatically. Five images were derived from this installation’s Yharnam Together map cache and nine were rendered from its game files using Yharnam Together’s map renderer. The map reflects the save in the editor rather than live game state. Top-down coordinates can overlap across floors. The rendered map artwork comes from Bloodborne game data; third-party artwork retains its respective ownership and terms.

The Altars tab includes a custom builder for the 124-byte dungeon record and an optional 124-byte activation/progress flag block. Start from the current altar or a catalog record, then enter hexadecimal bytes. Preserving flags may leave an empty altar inactive; standard activation resets progress. Custom data is not validated for playability, and the builder has not been verified in-game. Keep a backup.
