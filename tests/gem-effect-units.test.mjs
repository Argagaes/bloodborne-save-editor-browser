import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeGemEffectUnits} from '../src/gem-effect-units.js';
import {matchesGemSearch} from '../src/gem-search.js';
test('whole percentages are inferred for all catalog families without altering flat values',()=>{
 const upgrades=JSON.parse(fs.readFileSync(new URL('../public/data/upgrades.json',import.meta.url)));
 normalizeGemEffectUnits(upgrades);
 for(const id of [41217,141217,41406,141406])assert.ok(matchesGemSearch(upgrades.gemEffects[id].effect,'stamina "3%"'));
 for(const v of Object.values(upgrades.gemEffects))assert.ok(!/^(?:Physical ATK UP|Increases stamina costs) [+-]\d+$/.test(v.effect));
 assert.equal(upgrades.gemEffects[13101].effect,'Add blood ATK +0.5');
 assert.ok(Object.values(upgrades.gemEffects).some(v=>v.effect==='Add arcane ATK +3'));
});
