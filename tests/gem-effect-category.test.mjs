import test from 'node:test';
import assert from 'node:assert/strict';
import {gemEffectCategory,gemEffectCategoryLabel} from '../src/gem-effect-category.js';
test('category metadata distinguishes matching and missing game parameter rows',()=>{
 assert.deepEqual(gemEffectCategory(22619),{id:130600,known:false});
 assert.deepEqual(gemEffectCategory(122619),{id:131600,known:true});
 assert.match(gemEffectCategoryLabel(22619),/Unknown GemCategoryParam/);
 assert.equal(gemEffectCategory(4294967295),null);
});
