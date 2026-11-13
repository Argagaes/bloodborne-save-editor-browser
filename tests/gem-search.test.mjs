import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesGemSearch} from '../src/gem-search.js';
import {gemDisplayName} from '../src/gem-icons.js';
test('quoted values match complete values including signed bonuses',()=>{
  assert.ok(matchesGemSearch('Increases stamina costs +3% · Rating 19','stamina "3%"'));
  assert.ok(matchesGemSearch('value 3% here','"3%"'));
  assert.equal(matchesGemSearch('Increases stamina costs +0.3% · Rating 19','stamina "3%"'),false);
  assert.equal(matchesGemSearch('Increases stamina costs +3.3% · Rating 19','"3%"'),false);
  assert.equal(matchesGemSearch('value 3% extra','"3% extra"'),true);
});
test('Bloodtinge names follow in-game word order',()=>{
  assert.equal(gemDisplayName('Bloodtinge Damp Blood Gem (6)'),'Damp Bloodtinge Gem (6)');
  assert.equal(gemDisplayName('Cursed Bloodtinge Damp Blood Gem (6)'),'Cursed Damp Bloodtinge Gem (6)');
});

test('quoted cursed phrase matches only the contiguous displayed name',()=>{
  const q='"cursed damp" blood 32.6';
  assert.equal(matchesGemSearch('Cursed Damp Bloodtinge Gem (6) Blood ATK UP +32.6%',q),true);
  assert.equal(matchesGemSearch('Cursed Arcane Damp Blood Gem (6) Add arcane ATK +32.6',q),false);
  assert.equal(matchesGemSearch('Cursed Adept Damp Blood Gem (6) Blunt ATK UP +32.6%',q),false);
});
