import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../src/gem-pool-data.json' with {type:'json'};
import {gemPool} from '../src/gem-pool.js';
test('pool weights reproduce calculator example with repeated category 22',()=>{
 const find=(kind,name)=>gemPool(data,[22,22],kind).find(x=>x.name===name).chance;
 assert.ok(Math.abs(find('primary','Tempering - Physical ATK UP %')-84.2585635)<1e-7);
 assert.ok(Math.abs(find('secondary','Add physical ATK')-55.54413929)<1e-7);
 for(const kind of ['primary','secondary']) assert.ok(Math.abs(gemPool(data,[22,22],kind).reduce((n,x)=>n+x.chance,0)-100)<1e-9);
});
