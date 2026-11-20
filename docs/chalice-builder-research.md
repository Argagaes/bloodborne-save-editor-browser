# Chalice builder research

The dungeon builder uses the user's Tomb Prospectors - Hex Research Central workbook. Hex Guide describes area/depth, layout bytes and the last byte of each of nine eight-byte feature strings. Feature contains feature names and GemCategory relationships; many English descriptions are rough translations and should not be treated as tested outcomes. The editor changes only the last feature byte and preserves the other 123 bytes. A feature can simultaneously affect the dungeon and the gem pool; changing categories can change other game behavior.

Gem pool probabilities represent non-fixed effect pools, not a complete drop or primary-secondary joint probability.

These controls do not validate dungeon safety or prove in-game behavior. Changes are staged in the builder until assigned to an altar, and are subject to the editor's undo history.

The area/depth, layout variant and layout number controls edit the first map ID; a corresponding repeated byte is updated only when it matched before editing. Differing copies are preserved because they may represent deliberately merged records.
