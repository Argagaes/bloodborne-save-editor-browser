import { existsSync, readFileSync } from 'node:fs';

const fixtureUrl = index => new URL(`../../bb-save-editor/src-tauri/saves/testsave${index}`, import.meta.url);

export const hasUpstreamFixtures = Array.from({ length: 10 }, (_, index) => index)
  .every(index => existsSync(fixtureUrl(index)));

export const readUpstreamFixture = index => new Uint8Array(readFileSync(fixtureUrl(index)));
