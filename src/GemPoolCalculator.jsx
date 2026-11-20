import React from 'react';
import data from './gem-pool-data.json';
import {gemPool} from './gem-pool.js';
import {dungeonGemCategories} from './dungeon-gem-pool.js';
export default function GemPoolCalculator({record}) {
 const decoded=dungeonGemCategories(record),active=decoded.categories;
 const primary=active?gemPool(data,active,'primary'):[],secondary=active?gemPool(data,active,'secondary'):[];
 return <section className="gem-builder-secondary"><p>{decoded.error ? `Pool unavailable: ${decoded.error}` : `Dungeon categories: ${active.length?active.join(', '):'none (all effects in the rare pool)'}.`}</p>{active&&<><p>Results reproduce the Tomb Prospectors pool model, including rare out-of-pool effects.</p><div className="gem-filter-grid">{[[primary,'Primary effects'],[secondary,'Secondary effects']].map(([rows,title])=><div key={title}><strong>{title}</strong>{rows.map(row=><div key={row.name}>{row.name} · {row.chance.toFixed(4)}%</div>)}</div>)}</div><p className="panel-note">Percentages describe effect pools, not complete gem drop chances. The enemy, rating, shape, curse and dungeon rules still need to be checked separately. Fixed-primary and semi-fixed drops have additional rules.</p></>}<a href="https://docs.google.com/spreadsheets/d/1npy3OpuVDYmkrAZq98QkdjgU2aiIowNVTWrjR35PrrU/edit" target="_blank" rel="noopener noreferrer">Tomb Prospectors Gem Pool Calculator</a></section>;
}
