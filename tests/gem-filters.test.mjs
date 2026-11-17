import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesGemFilters} from '../src/gem-filters.js';
const NONE=0xffffffff;
const catalog={gemEffects:{11:{name:'Tempering',effect:'Physical ATK UP +10%',rating:10},12:{name:'Curse',effect:'Increases stamina costs +3%',rating:10},13:{name:'Fire',effect:'Fire ATK UP +5%',rating:7}},runeEffects:{}};
const info=id=>catalog.gemEffects[id]||{};
const filters={shape:'all',effect:'',curse:'all',rating:'all'};
const gem={kind:1,shape:1,effects:[11,12,NONE,NONE,NONE,NONE]};
test('gem filters combine shape, any effect, recognized curse and primary rating',()=>{
 assert.equal(matchesGemFilters(gem,{shape:'1',effect:'stamina',curse:'cursed',rating:'10'},catalog,info),true);
 assert.equal(matchesGemFilters(gem,{...filters,shape:'2'},catalog,info),false);
 assert.equal(matchesGemFilters(gem,{...filters,effect:'fire'},catalog,info),false);
 assert.equal(matchesGemFilters(gem,{...filters,curse:'uncursed'},catalog,info),false);
 assert.equal(matchesGemFilters(gem,{...filters,rating:'7'},catalog,info),false);
 assert.equal(matchesGemFilters({...gem,effects:[13,NONE]},{...filters,curse:'uncursed',rating:'7'},catalog,info),true);
});
