# Bloodborne Save Editor

Open a decrypted Bloodborne character file such as `userdata0000`. Edit the hunter, inventory, storage, gems, runes, bosses, character settings, and six chalice altars in one session. **Changes**, **Undo**, **Redo**, and **Download save** apply across all sections. Save data stays on your device.

Use **Download original backup** to keep a copy of your save before replacing it. **Use example save** opens a bundled public test fixture.

## Download and run

Download the latest build from [Releases](https://github.com/Argagaes/bloodborne-save-editor-tool/releases).

- **Windows:** Download the `.exe` and run it; no installer is needed. WebView2 is required.
- **Linux:** Download the `.AppImage`, make it executable in its file properties, then run it. Alternatively, in a terminal run `chmod +x <filename>.AppImage` followed by `./<filename>.AppImage` (replace `<filename>` with the downloaded name). Some Linux systems require FUSE to run AppImages.

Open a decrypted Bloodborne character save, make your edits, and download the edited file. Keep a backup before replacing your save.

## Run locally

Use Node.js 22.12 or newer in this folder.

```powershell
npm ci
npm run dev
```

Run `npm test` to check the editor. The additional compatibility tests run when Noxde’s original repository is checked out alongside this one as `bb-save-editor`.

## Desktop builds

Run `npm run desktop -- build` after installing the Tauri prerequisites. GitHub Actions publishes a portable Windows executable and Linux AppImage from the same source.

## Credits

Standalone editor, tool integration, lamps and shortcuts by **Argagaes**.

- [Noxde’s Bloodborne Save Editor](https://github.com/Noxde/Bloodborne-save-editor) is the basis for the save editing features and provides the example fixture.
- [Noxde’s Chalice Dungeon catalog](https://gist.github.com/Noxde/a29f699f4175bf315d9bd4baeebefb66) supplies the dungeon records used in Altars.
- [The Tomb Prospectors Discord](https://discord.com/invite/Ax6YByr) for their chalice dungeon, gem and datamining research.
- [Yharnam Together](https://github.com/Amanises-Yharnam-Together/BBSC-Yharnam-Together) provides the map renderer and map data used for the shortcut maps.

The editor code is licensed under [GPL-3.0](LICENSE). Third-party artwork retains its respective ownership and terms.
