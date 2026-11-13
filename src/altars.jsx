import React, { useEffect, useRef, useState } from 'react';
import { CATEGORY_NAMES, parseCatalog } from './chalice-engine.mjs';
import './chalice.css';
import ChaliceBuilder from './ChaliceBuilder.jsx';

const catalogUrl = `${import.meta.env.BASE_URL}data/dungeons.json`;
const categoryName = key => CATEGORY_NAMES[key] || key;
const altarName = altar => altar.empty ? 'Empty' : altar.dungeon?.glyph || 'Unlisted dungeon';

export default function Altars({ editor, hidden, act, notify, Icon, Panel }) {
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState('');
  const [slot, setSlot] = useState(1);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState(null);
  const [builder, setBuilder] = useState(null);
  const catalogInput = useRef(null);
  const loadRequest = useRef(0);

  async function loadCatalog(read) {
    const request = ++loadRequest.current;
    setCatalogError('');
    try {
      const entries = parseCatalog(await read());
      if (request !== loadRequest.current) return;
      setCatalog(entries);
      setSelected(null);
      setCategory('all');
      setQuery('');
      return entries.length;
    } catch (error) {
      if (request === loadRequest.current) setCatalogError(error.message);
    }
  }

  function loadBundledCatalog() {
    return loadCatalog(async () => {
      const response = await fetch(catalogUrl);
      if (!response.ok) throw Error('Could not load the bundled dungeon catalog.');
      return response.json();
    });
  }

  useEffect(() => {
    loadBundledCatalog();
    return () => { loadRequest.current++; };
  }, []);

  useEffect(() => {
    setSlot(1);
    setSelected(null);
    setBuilder(null);
  }, [editor]);

  async function importCatalog(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    const count = await loadCatalog(async () => {
      if (file.size > 5 * 1024 * 1024) throw Error('Choose a catalog smaller than 5 MB.');
      return JSON.parse(await file.text());
    });
    if (count) notify(`Loaded ${count} dungeon entries for this session.`);
  }

  if (hidden) return null;
  const entries = catalog || [];
  const altars = editor.altars(entries);
  if (!altars.length) {
    return <Panel title="Altars unavailable"><p>This save does not have a supported altar layout.</p></Panel>;
  }
  const categories = [...new Set(entries.map(dungeon => dungeon.category))];
  const search = query.trim().toLowerCase();
  const filtered = entries.filter(dungeon =>
    (category === 'all' || dungeon.category === category)
    && `${dungeon.glyph} ${dungeon.desc}`.toLowerCase().includes(search)
  );

  return <>
    <input type="file" className="sr-only" accept=".json,application/json" ref={catalogInput} aria-label="Import dungeon catalog" onChange={importCatalog} />
    <div className="altar-grid" aria-label="Chalice altars">
      {altars.map(altar => <button key={altar.slot} className={`altar-card ${slot === altar.slot ? 'selected' : ''}`} aria-pressed={slot === altar.slot} onClick={() => { setSlot(altar.slot); setBuilder(null); }}>
        <span className="altar-number" aria-hidden="true">{altar.slot}</span>
        <span className="altar-info">
          <span className="eyebrow">Altar {altar.slot}</span>
          <strong>{altarName(altar)}</strong>
          <small>{altar.empty ? 'No dungeon assigned' : altar.dungeon ? categoryName(altar.dungeon.category) : 'No catalog match'}</small>
        </span>
        {slot === altar.slot && <Icon name="check" size={16} />}
      </button>)}
    </div>
    <div className="button-row"><button type="button" className="button secondary" onClick={() => setBuilder({template:null, key:Date.now()})}>Build from altar {slot}</button>{selected&&<button type="button" className="button secondary" onClick={() => setBuilder({template:selected, key:Date.now()})}>Build from {selected.glyph}</button>}</div>
    {builder&&<ChaliceBuilder key={builder.key} altar={altars[slot-1]} template={builder.template} editor={editor} act={act} notify={notify} onClose={()=>setBuilder(null)}/>}
    <div className="catalog-heading">
      <h2>Choose a dungeon</h2>
      <span className="muted">Selected: altar {slot} · {altarName(altars[slot - 1])}</span>
    </div>
    {catalogError && <div className="catalog-error" role="alert">
      <p>{catalogError}</p>
      <button className="button secondary" onClick={loadBundledCatalog}>Reload bundled catalog</button>
    </div>}
    <div className="dungeon-layout">
      <section className="panel dungeon-catalog" aria-label="Dungeon list">
        <div className="inventory-tools"><label className="search-input">
          <Icon name="search" size={18} />
          <input aria-label="Search dungeons" placeholder="Search glyph or description" value={query} onChange={event => setQuery(event.target.value)} />
        </label></div>
        <div className="filter-tabs" aria-label="Dungeon categories">
          {[['all', 'All dungeons'], ...categories.map(key => [key, categoryName(key)])].map(([key, name]) =>
            <button key={key} className={category === key ? 'selected' : ''} aria-pressed={category === key} onClick={() => setCategory(key)}>{name}</button>
          )}
        </div>
        <div className="list-summary">
          <span>{filtered.length} {filtered.length === 1 ? 'dungeon' : 'dungeons'}</span>
          <button className="text-button" onClick={() => catalogInput.current.click()}>Import catalog</button>
        </div>
        <div className="dungeon-list">
          {filtered.map(dungeon => <button key={dungeon.id} className={`dungeon-row ${selected?.id === dungeon.id ? 'selected' : ''}`} aria-pressed={selected?.id === dungeon.id} onClick={() => setSelected(dungeon)}>
            <span className="glyph">{dungeon.glyph}</span>
            <span className="dungeon-description">{dungeon.desc}</span>
            <span className="dungeon-category">{categoryName(dungeon.category)}</span>
          </button>)}
          {!filtered.length && <div className="empty-inline">
            <h3>{catalog ? 'No matching dungeons' : catalogError ? 'Catalog unavailable' : 'Loading catalog…'}</h3>
            {catalog && <button className="text-button" onClick={() => { setQuery(''); setCategory('all'); }}>Clear filters</button>}
          </div>}
        </div>
      </section>
      <div className="detail-column">
        {selected ? <Panel title="Selected dungeon">
          <div className="selected-glyph">{selected.glyph}</div>
          <span className="eyebrow">{categoryName(selected.category)}</span>
          <p className="selected-description">{selected.desc}</p>
          {selected.category === 'testing' && <p className="catalog-warning">Testing and cut-content dungeons can contain unfinished areas. Keep your original backup.</p>}
          <label className="field">
            <span className="field-label">Target altar</span>
            <select value={slot} onChange={event => setSlot(Number(event.target.value))}>
              {altars.map(altar => <option key={altar.slot} value={altar.slot}>Altar {altar.slot} · {altarName(altar)}</option>)}
            </select>
          </label>
          <p className="replace-note">Replacing a dungeon can reset progress at this altar.</p>
          <button className="button primary full" onClick={() => {
            if (act(`Altar ${slot}: ${selected.glyph}`, () => editor.replaceAltar(slot, selected))) {
              notify(`${selected.glyph} assigned to altar ${slot}.`);
            }
          }}>Assign to altar {slot}</button>
        </Panel> : <div className="selection-placeholder">
          <h3>Select a dungeon</h3>
          <p>Choose a glyph to see its description and assign it to an altar.</p>
        </div>}
      </div>
    </div>
  </>;
}
