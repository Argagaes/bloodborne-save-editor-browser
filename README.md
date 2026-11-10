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

Ported to the browser and hosted by **Argagaes**.

- [Noxde’s Bloodborne Save Editor](https://github.com/Noxde/Bloodborne-save-editor) is the basis for the save editing features and provides the example fixture.
- [Noxde’s Chalice Dungeon catalog](https://gist.github.com/Noxde/a29f699f4175bf315d9bd4baeebefb66) supplies the dungeon records used in Altars.

The editor code is licensed under [GPL-3.0](LICENSE). Third-party artwork retains its respective ownership and terms.
