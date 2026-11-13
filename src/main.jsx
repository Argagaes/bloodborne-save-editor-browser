import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';

import { createRoot } from 'react-dom/client';

import { SaveEditor, SHAPES, integer } from './save-engine.js';

import { gemVisual, gemDisplayName } from './gem-icons.js';
import { normalizeGemEffectUnits } from './gem-effect-units.js';
import { runeIconFile } from './rune-icons.js';

import './style.css';
import './themes.css';
import Altars from './altars.jsx';
import ShortcutMap from './ShortcutMap.jsx';
import GemBuilder from './GemBuilder.jsx';



const themes = {
  dream: 'Hunter’s Dream',
  blood: 'Blood Moon',
  cathedral: 'Cathedral',
  midnight: 'Midnight',
};
const themeKey = 'bloodborne-editor-theme';

function readTheme() {
  try {
    const stored = localStorage.getItem(themeKey);
    if (Object.hasOwn(themes, stored)) return stored;
  } catch {
    // The picker still works when browser storage is unavailable.
  }
  return 'dream';
}



const base = import.meta.env.BASE_URL;

const asset = path => `${base}assets/${path}`;

const categories = {all:'All items',consumable:'Consumables',material:'Materials',rightHand:'Trick weapons',leftHand:'Firearms',armor:'Attire',key:'Key items',chalice:'Chalices'};

const filterIcons = {consumable:'consumables',material:'materials',rightHand:'right_hand',leftHand:'left_hand',armor:'armor',key:'key',chalice:'chalices'};

const origins = ['Milquetoast','Lone Survivor','Troubled Childhood','Violent Past','Professional','Military Veteran','Noble Scion','Cruel Fate','Waste of Skin'];

const voices = {0:'Young',1:'Mature',2:'Aged',41:'Simon',40:'Valtr',42:'Brador',17:'Annalise',24:'Imposter doctor',25:'Bigoted old man',26:'Lonely old woman',27:'Beggar',28:'Arianna',32:'Adella',34:'Alfred',35:'Eileen',33:'Djura',21:'Micolash'};

const titles = {Overview:'Stats',Inventory:'Inventory',Storage:'Storage',Upgrades:'Gems and runes',Bosses:'Bosses',Character:'Character',Altars:'Altars',Lamps:'Lamps',Shortcuts:'Shortcuts',WorldFlags:'World flags',Changes:'Changes'};

function Icon({name,size=20,...props}) {

  const paths={flag:'M5 21V3 M5 4h13l-3 4 3 4H5',altar:'M4 21h16 M6 17h12v4H6z M8 13h8v4H8z M12 3v10 M9 6h6',grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',bag:'M5 7h14l2 14H3L5 7z M8 7V5a4 4 0 0 1 8 0v2',box:'M3 7l9-4 9 4-9 4-9-4z M3 7v10l9 4 9-4V7 M12 11v10',gem:'M3 8l4-5h10l4 5-9 13L3 8z M3 8h18 M7 3l5 18 5-18',boss:'M5 3l14 18 M19 3L5 21 M3 15l6 6 M15 21l6-6 M4 4l4 1-3 3-1-4z M20 4l-4 1 3 3 1-4z',user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',history:'M3 11a9 9 0 1 1 2 7 M3 4v7h7 M12 7v5l3 2',upload:'M12 16V3 M7 8l5-5 5 5 M4 15v6h16v-6',download:'M12 3v13 M7 11l5 5 5-5 M4 17v4h16v-4',arrow:'M4 12h16 M14 6l6 6-6 6',check:'M5 12l4 4L19 6',shield:'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3z M8 12l3 3 5-6',search:'M10 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14 M15 15l6 6',plus:'M12 5v14 M5 12h14',close:'M6 6l12 12 M18 6L6 18',undo:'M9 4L3 10l6 6 M3 10h10a7 7 0 0 1 7 7',redo:'M15 4l6 6-6 6 M21 10H11a7 7 0 0 0-7 7',moon:'M20 14A9 9 0 0 1 10 4a9 9 0 1 0 10 10',file:'M6 2h8l5 5v15H5V2z M13 2v6h6 M8 13h8 M8 17h6',info:'M12 11v6 M12 7v1 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',pin:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0 M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0'};

  paths.lamp='M18 22c0-5-1-8-1-12V5c0-2-1.5-3-3.5-3 M11.5 3c-.8 0-1.3.7-1.4 1.5l-.5 1h2.6l-.5-1c-.1-.8-.5-1.5-1.2-1.5 M13 3c.8 0 1.3.7 1.4 1.5l.5 1h-2.6l.5-1c.1-.8.5-1.5 1.2-1.5 M11 5.5 9.5 9 M13.5 5.5 15 9 M10 9h4.5 M10.5 8h3.5 M9.8 10h4.9l-.5 2.3h-3.9l-.5-2.3z M12.2 10v2.3 M10.3 13h3.9 M10.8 13l1.4 1 1.4-1 M12.2 14v.8 M16.5 22h3';
  paths.bag='M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z M9 7V5h6v2 M7 7v13 M17 7v13';
  paths.box='M3 10V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v2 M3 10h18v10H3z M3 8h18 M7 4v16 M17 4v16 M10 10v3h4v-3';
  paths.altar='M5 21h14 M7 21V8a5 5 0 0 1 10 0v13 M9 20V8a3 3 0 0 1 6 0v12 M12 7v7 M10 10h4';
  paths.gem='M12 2l1.8 6 4.8-3-3 4.8 6 2.2-6 1.8 3 4.8-4.8-3-1.8 6-1.8-6-4.8 3 3-4.8-6-1.8 6-2.2-3-4.8 4.8 3L12 2z M12 8v8 M8 12h8';
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]||paths.grid}/></svg>;

}

function RuneImage({effectId, data, size = 35}) {
  const file = runeIconFile(effectId, data.upgrades);
  if (!file) return null;
  return <img className="upgrade-image" src={asset(`runes/${file}`)} width={size} height={size} alt="" title={data.upgrades.runeEffects[effectId].name} loading="lazy"/>;
}

function UpgradeImage({upgrade,data,size=35}) {
  if (upgrade?.kind === 2) {
    const effectId = upgrade.effects[0];
    return runeIconFile(effectId, data.upgrades)
      ? <RuneImage effectId={effectId} data={data} size={size}/>
      : <Icon name="moon" size={Math.min(size,40)}/>;
  }

  const visual=gemVisual(upgrade,data.upgrades);

  return visual?<img className="upgrade-image" src={asset(visual.image)} width={size} height={size} alt="" title={`${visual.name} · ${visual.description}`} loading="lazy" onError={event=>{const image=event.currentTarget;if(!image.dataset.fallback){image.dataset.fallback='true';image.src=asset(visual.fallback);}}}/>:<Icon name="gem" size={Math.min(size,40)}/>;

}

function upgradeName(upgrade,data) { return gemVisual(upgrade,data.upgrades)?.name || gemDisplayName(data.upgrades.gemEffects[upgrade?.effects[0]]?.name) || data.upgrades.runeEffects[upgrade?.effects[0]]?.name || 'Unknown upgrade'; }

function download(bytes,name) { const url=URL.createObjectURL(new Blob([bytes],{type:'application/octet-stream'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }

function Field({label,value,onCommit,max=0xffffffff,icon,help}) {

  const [draft,setDraft]=useState(String(value));const [error,setError]=useState('');

  useEffect(()=>{setDraft(String(value));setError('');},[value]);

  function commit(){try{const n=integer(draft,max);onCommit(n);setError('');}catch(e){setError(e.message);}}

  return <label className={`field ${error?'invalid':''}`}><span className="field-label">{icon&&<img src={asset(`stats/${icon}.png`)} alt=""/>}{label}</span><input aria-label={label} type="number" min="0" max={max} value={draft} style={String(value).length>6?{fontSize:'12px'}:undefined} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')e.target.blur();}}/>{(error||help)&&<small className={error?'error-text':''}>{error||help}</small>}</label>;

}

function Panel({title,kicker,children,action,className=''}) { return <section className={`panel ${className}`}><div className="panel-heading"><div>{kicker&&<span className="eyebrow">{kicker}</span>}<h3>{title}</h3></div>{action}</div>{children}</section>; }

function SelectField({label,value,options,onChange}) { return <label className="field"><span className="field-label">{label}</span><select aria-label={label} value={value} onChange={e=>onChange(Number(e.target.value))}>{!options.some(([v])=>Number(v)===Number(value))&&<option value={value}>Unknown ({value})</option>}{options.map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></label>; }

function Modal({title,children,onClose,confirmDraft=false}) {

  const ref=useRef(),draftChanged=useRef(false);useEffect(()=>{ref.current.showModal();const close=()=>onClose();ref.current.addEventListener('cancel',close);return()=>ref.current?.removeEventListener('cancel',close);},[]);

  return <dialog ref={ref} onInputCapture={()=>{if(confirmDraft)draftChanged.current=true;}} onClickCapture={e=>{if(confirmDraft&&e.target.closest('.picker-row, .gem-effect-options button, .gem-effect-current button'))draftChanged.current=true;}} onClick={e=>{if(e.target===ref.current&&(!confirmDraft||!draftChanged.current||window.confirm('Discard this gem draft?')))onClose();}}><div className="modal-head"><h3>{title}</h3><button className="icon-button" aria-label="Close dialog" onClick={onClose}><Icon name="close"/></button></div>{children}</dialog>;

}

const lampAreaOrder = ['Central Yharnam','Cathedral Ward','Upper Cathedral Ward','Old Yharnam','Hemwick Charnel Lane','Forbidden Woods','Byrgenwerth','Yahar’gul','Cainhurst','Abandoned Old Workshop','Lecture Building','Nightmare Frontier','Nightmare of Mensis','Hunter’s Nightmare','Research Hall','Fishing Hamlet'];

function LampCheckbox({label, lamps, editor, act, className = ''}) {
  const ref = useRef(null);
  const enabled = lamps.filter(lamp => editor.lampEnabled(lamp.eventFlag)).length;
  const all = enabled === lamps.length;
  useLayoutEffect(() => { if (ref.current) ref.current.indeterminate = enabled > 0 && !all; }, [enabled, all]);
  return <label className={`lamp-checkbox ${className}`}><input ref={ref} type="checkbox" checked={all} onChange={event => { const checked=event.target.checked; act(`${checked ? 'Unlock' : 'Lock'} ${label}`,()=>editor.setLamps(lamps.map(lamp=>lamp.eventFlag),checked)); }}/><span>{label}</span>{lamps.length>1&&<small>{enabled}/{lamps.length}</small>}</label>;
}

function LampSettings({lamps, editor, act}) {
  return <section className="lamp-settings" aria-label="Lamps"><div className="lamp-settings-intro"><p>Early travel to boss lamps may cause problems. The DLC headstone may need additional activation.</p></div><LampCheckbox label="All lamps" lamps={lamps} editor={editor} act={act} className="lamp-all"/><div className="lamp-area-grid">{lampAreaOrder.map(area=>{const entries=lamps.filter(lamp=>lamp.area===area);return entries.length?<section className="lamp-area" key={area}><LampCheckbox label={area} lamps={entries} editor={editor} act={act} className="lamp-area-toggle"/><div className="lamp-area-items">{entries.map(lamp=><LampCheckbox key={lamp.eventFlag} label={lamp.name} lamps={[lamp]} editor={editor} act={act}/>)}</div></section>:null;})}</div></section>;
}

function ShortcutCheckbox({label, shortcuts, editor, act, className = '', onSelect, global = false}) {
  const ref = useRef(null);
  const enabled = shortcuts.filter(shortcut => editor.shortcutEnabled(shortcut.eventFlag)).length;
  const all = global ? editor.allShortcutsEnabled() : enabled === shortcuts.length;
  useLayoutEffect(() => { if (ref.current) ref.current.indeterminate = enabled > 0 && !all; }, [enabled, all]);
  return <label className={`lamp-checkbox ${className}`}><input ref={ref} type="checkbox" checked={all} onFocus={onSelect} onChange={event => { const checked=event.target.checked; onSelect?.();act(`${checked ? 'Open' : 'Lock'} ${label}`,()=>global?editor.setAllShortcuts(checked):editor.setShortcuts(shortcuts.map(shortcut=>shortcut.eventFlag),checked)); }}/><span>{label}</span>{shortcuts.length>1&&<small>{enabled}/{shortcuts.length}</small>}</label>;
}

function ShortcutSettings({shortcuts, charts, editor, act}) {
  const [selected,setSelected]=useState(null);
  const maps=[...new Set(shortcuts.map(shortcut=>shortcut.map))];
  const [mapIndex,setMapIndex]=useState(()=>Math.max(0,maps.indexOf('m24_01_00_00')));
  const mapId=maps[mapIndex], entries=shortcuts.filter(shortcut=>shortcut.map===mapId), mapName=entries[0]?.area || mapId;
  function moveMap(delta){setSelected(null);setMapIndex(i=>(i+delta+maps.length)%maps.length);}
  return <section className="lamp-settings" aria-label="Shortcuts">
    <p className="panel-note">Five entries were tested individually. Other flags and object links are inferred; some can affect more than one object or progression. Global on also clears 11 auxiliary flags; global off restores those to the loaded save’s values. Seven temporary operations are not included. Use a backup.</p>
    <ShortcutCheckbox label="All listed shortcut flags" shortcuts={shortcuts} editor={editor} act={act} className="lamp-all" global/>
    <div className="shortcut-map-nav"><button type="button" className="button secondary" onClick={()=>moveMap(-1)}>Previous map</button><div><strong>{mapName}</strong><small>{mapId} · {mapIndex+1} / {maps.length}</small></div><button type="button" className="button secondary" onClick={()=>moveMap(1)}>Next map</button></div>
    <div className="shortcut-layout"><section className="lamp-area"><div className="lamp-area-toggle">{mapName} · {entries.length} entries</div><div className="lamp-area-items">{entries.map((shortcut,i)=><div key={shortcut.eventFlag} className={selected===shortcut.eventFlag?'shortcut-entry selected':'shortcut-entry'}><ShortcutCheckbox label={`${i+1}. ${shortcut.name}${shortcut.positions?.length ? '' : ' (no pos)'}`} shortcuts={[shortcut]} editor={editor} act={act} onSelect={()=>setSelected(shortcut.eventFlag)}/><small>Flag {shortcut.eventFlag}{shortcut.positions?.length>1?' · possible linked points':''}</small></div>)}</div></section><ShortcutMap mapId={mapId} mapName={mapName} maps={charts} shortcuts={entries} editor={editor} selected={selected} onSelect={setSelected}/></div>
  </section>;
}

export default function App(){
  const [theme, setTheme] = useState(readTheme);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(themeKey, theme);
    } catch {
      // Keep the choice for this session.
    }
  }, [theme]);
  const [informationOpen, setInformationOpen] = useState(false);

  const [data,setData]=useState(null),[loadError,setLoadError]=useState(''),[editor,setEditor]=useState(null),[page,setPage]=useState('Overview'),[revision,render]=useState(0),[busy,setBusy]=useState(false),[notice,setNotice]=useState(null),[demo,setDemo]=useState(false),[modal,setModal]=useState(null),[search,setSearch]=useState(''),[category,setCategory]=useState('all'),[selected,setSelected]=useState(null),[upgradeKind,setUpgradeKind]=useState(1),[upgradeLocation,setUpgradeLocation]=useState('all');

  useEffect(()=>{window.scrollTo(0,0);},[page,editor,informationOpen]);

  const fileInput=useRef(),appearanceInput=useRef(),noticeTimer=useRef();

  useEffect(()=>{Promise.all(['items','weapons','armors','bosses','upgrades','gem-sources','rune-templates','offsets','locations','lamps','shortcuts','shortcut-auxiliary','maps/manifest'].map(async n=>{const r=await fetch(`${base}data/${n}.json`);if(!r.ok)throw Error(`Could not load ${n}. Reload the page to retry.`);const value=await r.json();return [n,n==='upgrades'?normalizeGemEffectUnits(value):value];})).then(x=>setData(Object.fromEntries(x))).catch(e=>setLoadError(e.message));return()=>clearTimeout(noticeTimer.current);},[]);

  const notify=(text,error=false)=>{setNotice({text,error});clearTimeout(noticeTimer.current);noticeTimer.current=setTimeout(()=>setNotice(null),5500);};

  const update=()=>render(n=>n+1);

  function act(label,fn){try{if(editor.transaction(label,fn))update();return true;}catch(e){notify(e.message,true);return false;}}

  function navigate(p){setInformationOpen(false);setPage(p);setSearch('');setCategory('all');setSelected(null);}

  async function openFile(file,isDemo=false){if(!file||!data)return;setBusy(true);try{const bytes=new Uint8Array(await file.arrayBuffer());const next=new SaveEditor(bytes,data,file.name);setEditor(next);setDemo(isDemo);navigate('Overview');setModal(null);}catch(e){notify(e.message,true);}finally{setBusy(false);if(fileInput.current)fileInput.current.value='';}}

  async function example(){try{setBusy(true);const name='userdata0000';const r=await fetch(`${base}${name}`);if(!r.ok)throw Error('Example save unavailable.');await openFile(new File([await r.arrayBuffer()],name),true);}catch(e){notify(e.message,true);}finally{setBusy(false);}}

  function exportSave(){download(editor.bytes,editor.name);notify(demo?'Example save downloaded.':'Edited save downloaded.');}

  const changed=editor?.changedBytes||0;

  useEffect(()=>{const warn=e=>{if(changed){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[changed]);

  useEffect(()=>{const key=e=>{if(!editor||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?editor.redo():editor.undo();update();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[editor]);

  const pickFile=()=>{if(changed)setModal({type:'replace'});else fileInput.current.click();};

  const inventory=editor?.articles.filter(a=>a.location===(page==='Storage'?'storage':'inventory')||(page==='Inventory'&&a.location==='key'))||[];

  const filtered=inventory.filter(a=>(category==='all'||category===a.category)&&`${a.info.item_name} ${a.id}`.toLowerCase().includes(search.toLowerCase()));

  const current=selected===null?null:editor?.articles.find(a=>a.offset===selected);

  const upgrade=selected===null?null:editor?.upgrades.find(u=>u.offset===selected);

  const visibleUpgrades=editor?.upgrades.filter(u=>u.kind===upgradeKind&&(upgradeLocation==='all'||u.location===upgradeLocation)&&`${JSON.stringify(editor.effectInfo(u.effects[0]))} ${gemVisual(u,data.upgrades)?.name||''} ${gemVisual(u,data.upgrades)?.description||''}`.toLowerCase().includes(search.toLowerCase()))||[];

  function statsPanel(){return <Panel title="Attributes"><div className="attributes">{['Vitality','Endurance','Strength','Skill','Bloodtinge','Arcane'].map(n=><Field key={n} label={n} icon={n.toLowerCase()} value={editor.stats[n]} onCommit={v=>act(`Set ${n.toLowerCase()} to ${v}`,()=>editor.setStat(n,v))}/>)}</div><div className="panel-note">Changes apply when you leave a field.</div></Panel>;}

  return <div className="app-shell">

    <input ref={fileInput} type="file" className="sr-only" aria-label="Open decrypted character save" onChange={e=>openFile(e.target.files[0])}/>

    <input ref={appearanceInput} type="file" className="sr-only" aria-label="Import appearance" onChange={async e=>{const f=e.target.files[0];if(f){const b=new Uint8Array(await f.arrayBuffer());act('Import appearance',()=>editor.importAppearance(b));}e.target.value='';}}/>

    <div className="workspace">

    <header className="topbar"><div className="app-title">Bloodborne Save Editor{editor&&<span className="current-file">{editor.name}</span>}</div><div className="toolbar">
      <label className="theme-picker">
        <Icon name="moon" size={16}/>
        <span className="sr-only">Theme</span>
        <select value={theme} onChange={event => setTheme(event.target.value)}>
          {Object.entries(themes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      {editor&&<><button className="icon-button" aria-label="Undo" title="Undo (Ctrl+Z)" disabled={!editor.history.length} onClick={()=>{editor.undo();update();}}><Icon name="undo" size={17}/></button><button className="icon-button" aria-label="Redo" title="Redo (Ctrl+Shift+Z)" disabled={!editor.redoHistory.length} onClick={()=>{editor.redo();update();}}><Icon name="redo" size={17}/></button><div className="toolbar-divider"/></>}<button className="button secondary" disabled={!data||busy} onClick={pickFile}>Open save</button>{editor&&<button className="button primary" onClick={exportSave}>Download save</button>}</div></header>

    {editor && <nav className="section-tabs" aria-label="Editor sections">
      {Object.entries(titles).map(([value, label]) => {
        const active = !informationOpen && page === value;
        return <button key={value} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} onClick={() => navigate(value)}>
          <span className="section-icon"><Icon name={{Overview:'grid',Inventory:'bag',Storage:'box',Upgrades:'gem',Bosses:'boss',Character:'user',Altars:'altar',Lamps:'lamp',Shortcuts:'flag',WorldFlags:'flag',Changes:'history'}[value]} size={18}/></span>
          {label}{value === 'Changes' && editor.history.length > 0 && <span className="nav-count">{editor.history.length}</span>}
        </button>;
      })}
      <button className={informationOpen ? 'active' : ''} aria-current={informationOpen ? 'page' : undefined} onClick={() => setInformationOpen(true)}>
        <span className="section-icon"><Icon name="info" size={18}/></span>
        Information
      </button>
    </nav>}

    <main onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f){if(changed)setModal({type:'drop',file:f});else openFile(f);}}}>

    {informationOpen && <section className="information-page" aria-labelledby="information-title">
      <div className="page-heading"><h1 id="information-title">Information</h1></div>
      <div className="panel">
        <p>This browser editor is based on Noxde’s Bloodborne Save Editor and Chalice Editor. The dungeon catalog comes from Noxde’s dungeon list.</p>
        <p>Browser port, tool integration, lamps and shortcuts by <strong>Argagaes</strong>, who also hosts the editor.</p>
        <ul>
          <li><a href="https://github.com/Argagaes/bloodborne-save-editor-browser" target="_blank" rel="noopener noreferrer">Bloodborne Save Editor Browser on GitHub</a></li>
          <li><a href="https://github.com/Noxde/Bloodborne-save-editor" target="_blank" rel="noopener noreferrer">Noxde’s Bloodborne Save Editor on GitHub</a></li>
          <li><a href="https://gist.github.com/Noxde/a29f699f4175bf315d9bd4baeebefb66" target="_blank" rel="noopener noreferrer">Noxde’s dungeon catalog on GitHub Gist</a></li>
          <li><a href="https://github.com/Amanises-Yharnam-Together/BBSC-Yharnam-Together" target="_blank" rel="noopener noreferrer">Yharnam Together</a> — map renderer and map data</li>
        </ul>
        <p className="panel-note">Licensed under GPL-3.0.</p>
      </div>
    </section>}

    <div hidden={informationOpen}>
    {!editor?<section className="open-screen">

      <h1>Open a save</h1>

      <p>Open a decrypted Bloodborne character file to edit your hunter and chalice altars together.</p>

      <div className="dropzone"><div className="button-row"><button className="button primary" onClick={pickFile} disabled={!data||busy}>{busy?'Opening…':!data?'Loading…':'Choose file'}</button><button className="button secondary" disabled={!data||busy} onClick={example}>Use example save</button></div><p>Or drag and drop a file here.</p><code>userdata0000, userdata0001, …</code></div>

      <div className="format-notes"><p>Use a character file from shadPS4 or a decrypted PlayStation save. Encrypted save exports are not supported.</p><p>Files are edited locally in your browser. Download the edited file when finished; the original file is not overwritten.</p></div>

      {loadError&&<p role="alert" className="error-text">{loadError}</p>}

    </section>:<>

      {demo&&<div className="demo-banner"><span>Example save loaded.</span><button className="text-button" onClick={pickFile}>Open your save</button></div>}

      <div className="page-heading"><h1>{titles[page]}</h1><span className={`save-status ${changed?'pending':''}`}>{changed?`${changed.toLocaleString()} ${changed===1?'byte':'bytes'} changed`:'No changes'}</span></div>

      {page==='Overview'&&<>

        <div className="character-summary"><div><strong>{editor.username}</strong><span>{origins[editor.stats.Origin]||'Unknown origin'} · {editor.stats.Ng?`NG+${editor.stats.Ng}`:'NG'}</span></div><button className="button secondary" onClick={()=>navigate('Character')}>Edit character</button></div>

        <div className="overview-grid">{statsPanel()}<Panel title="General"><div className="attributes general-fields">{[['Level','Level'],['Echoes','Blood Echoes'],['Insight','Insight'],['Health','Health'],['Stamina','Stamina']].map(([key,label])=><Field key={key} label={label} icon={key.toLowerCase()} value={editor.stats[key]} onCommit={v=>act(`Set ${label} to ${v}`,()=>editor.setStat(key,v))}/>)}</div></Panel></div>

        <div className="file-bar"><Icon name="file"/><div><strong>{editor.name}</strong><span>{(editor.bytes.length/1024).toFixed(1)} KB · Decrypted character save</span></div><button className="text-button" onClick={()=>download(editor.original,`${editor.name}.bak`)}><Icon name="download" size={15}/>Download original backup</button></div>

      </>}

      {(page==='Inventory'||page==='Storage')&&<div className="inventory-layout"><section className="panel inventory-panel"><div className="inventory-tools"><div className="search-input"><Icon name="search" size={18}/><input aria-label="Search inventory" placeholder="Search by item name or ID…" value={search} onChange={e=>setSearch(e.target.value)}/></div><button className="button primary" onClick={()=>setModal({type:'add'})}><Icon name="plus" size={16}/>Add item</button></div><div className="filter-tabs">{Object.entries(categories).map(([key,label])=><button className={category===key?'selected':''} key={key} onClick={()=>setCategory(key)}>{filterIcons[key]&&<img src={asset(`filters/${filterIcons[key]}.png`)} alt=""/>}{label}</button>)}</div><div className="list-summary">{filtered.length} {filtered.length===1?'item':'items'}<span>Quantity</span></div><div className="item-list">{filtered.slice(0,250).map(a=><button key={a.offset} className={`item-row ${selected===a.offset?'selected':''}`} onClick={()=>setSelected(a.offset)}><div className="item-image">{a.info.item_img?<img src={asset(`itemImages/${a.info.item_img}`)} alt="" loading="lazy"/>:<Icon name="bag"/>}</div><div><strong>{a.info.item_name}{a.family==='weapon'&&a.level>0?` +${a.level}`:''}</strong><small>{categories[a.category]} · #{a.id}</small></div><span className="item-amount">{a.amount}</span></button>)}{!filtered.length&&<div className="empty-inline"><h3>No items found</h3><p>Try another search or add an item to this inventory.</p></div>}{filtered.length>250&&<p className="panel-note">Showing 250 results. Refine your search to see more.</p>}</div></section><div className="detail-column">{current?<Panel title={current.info.item_name} key={`${selected}-${revision}`}><div className="detail-art">{current.info.item_img&&<img src={asset(`itemImages/${current.info.item_img}`)} alt={current.info.item_name}/>}</div><p className="item-description">{current.info.item_desc}</p>{current.family==='item'&&current.category!=='key'&&<Field label="Quantity" value={current.amount} onCommit={v=>act(`Change ${current.info.item_name} quantity to ${v}`,()=>editor.quantity(current,v))}/>}<button className="button secondary full" onClick={()=>setModal({type:'transform',article:current})}>Transform item <Icon name="arrow" size={16}/></button>{current.family==='weapon'&&<Field label="Weapon upgrade level" max={10} value={current.level} onCommit={v=>act(`Upgrade ${current.info.item_name} to +${v}`,()=>editor.weaponLevel(current,v))}/ >}{current.slots.length>0&&<div className="slot-list"><span className="eyebrow">Gem slots</span>{current.slots.map((slot,i)=><div className="slot" key={slot.offset}><SelectField label={`Slot ${i+1}`} value={slot.shape} options={Object.entries(SHAPES)} onChange={v=>act(`Change slot ${i+1} shape`,()=>editor.slotShape(slot,v))}/>{slot.gem?<><div className="equipped-gem"><div className="item-image"><UpgradeImage upgrade={editor.upgrades.find(u=>u.id===slot.gem)} data={data}/></div><div><small>{upgradeName(editor.upgrades.find(u=>u.id===slot.gem),data)}</small>{gemVisual(editor.upgrades.find(u=>u.id===slot.gem),data.upgrades)&&<small className="gem-meta">{gemVisual(editor.upgrades.find(u=>u.id===slot.gem),data.upgrades).description}</small>}</div></div><button className="text-button" onClick={()=>act('Unequip blood gem',()=>editor.unequip(slot,current.location==='storage'?'storage':'inventory'))}>Unequip gem</button></>:<button className="text-button" disabled={slot.shape===0x80000000} onClick={()=>setModal({type:'equip',slot,location:current.location})}>Equip gem <Icon name="plus" size={13}/></button>}</div>)}</div>}</Panel>:<div className="selection-placeholder"><h3>No item selected</h3><p>Select an item to edit.</p></div>}</div></div>}

      {page==='Upgrades'&&<div className="inventory-layout"><section className="panel"><div className="inventory-tools"><div className="segmented"><button className={upgradeKind===1?'selected':''} onClick={()=>{setUpgradeKind(1);setSelected(null);}}>Blood gems</button><button className={upgradeKind===2?'selected':''} onClick={()=>{setUpgradeKind(2);setSelected(null);}}>Caryll runes</button></div><button className="button primary" onClick={()=>setModal({type:'addUpgrade',kind:upgradeKind})}><Icon name="plus" size={16}/>Add {upgradeKind===1?'gem':'rune'}</button><select aria-label="Upgrade location" value={upgradeLocation} onChange={e=>setUpgradeLocation(e.target.value)}>{['all','inventory','storage','equipped'].map(l=><option key={l} value={l}>{l==='all'?'All locations':l}</option>)}</select></div><div className="search-input inset"><Icon name="search" size={18}/><input aria-label="Search upgrades" placeholder="Search upgrades or effects…" value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="item-list">{visibleUpgrades.map(u=><button key={u.offset} className={`item-row ${selected===u.offset?'selected':''}`} onClick={()=>setSelected(u.offset)}><div className="item-image gem-icon"><UpgradeImage upgrade={u} data={data}/></div><div><strong>{upgradeName(u,data)}</strong><small>{editor.effectInfo(u.effects[0]).effect} · {u.location}</small>{gemVisual(u,data.upgrades)&&<small className="gem-meta">{gemVisual(u,data.upgrades).description}</small>}</div><Icon name="arrow" size={16}/></button>)}{!visibleUpgrades.length&&<div className="empty-inline"><h3>No upgrades found</h3><p>Try another location, upgrade type, or search.</p></div>}</div></section><div className="detail-column">{upgrade?<Panel title={upgradeName(upgrade,data)} kicker={upgrade.location} key={`${selected}-${revision}`}><div className="upgrade-art"><UpgradeImage upgrade={upgrade} data={data} size={80}/>{gemVisual(upgrade,data.upgrades)&&<span className="gem-meta">{gemVisual(upgrade,data.upgrades).description}</span>}</div><SelectField label={upgrade.kind===1?'Gem shape':'Rune type'} value={upgrade.shape} options={upgrade.kind===1?Object.entries(SHAPES).filter(([v])=>Number(v)!==0x80000000):[[1,'Standard'],[2,'Oath']]} onChange={v=>act('Change upgrade shape',()=>editor.setShape(upgrade,v))}/><div className="effect-list">{upgrade.effects.map((id,i)=><div className="effect" key={i}><span className="eyebrow">Effect {i+1}</span><p>{editor.effectInfo(id).effect}</p><button className="text-button" onClick={()=>setModal({type:'effect',upgrade,index:i})}>Change effect <Icon name="arrow" size={14}/></button></div>)}</div></Panel>:<div className="selection-placeholder"><h3>No upgrade selected</h3><p>Select a gem or rune to edit.</p></div>}</div></div>}

      {page==='Bosses'&&<><div className="section-toolbar"><div className="search-input"><Icon name="search" size={18}/><input aria-label="Search bosses" placeholder="Find a boss…" value={search} onChange={e=>setSearch(e.target.value)}/></div><span className="quiet">{data.bosses.filter(b=>editor.bossDead(b)).length} / {data.bosses.length} defeated</span></div><div className="boss-grid">{data.bosses.filter(b=>b.name.toLowerCase().includes(search.toLowerCase())).map((b,i)=><div className="boss-card" key={b.name}><span className="boss-number">{String(i+1).padStart(2,'0')}</span><div><h3>{b.name}</h3><span className={editor.bossDead(b)?'dead-text':'alive-text'}>{editor.bossDead(b)?'Defeated':'Alive'}</span></div><select aria-label={`${b.name} state`} value={editor.bossDead(b)?'dead':'alive'} onChange={e=>act(`${e.target.value==='dead'?'Defeat':'Revive'} ${b.name}`,()=>editor.setBoss(b,e.target.value==='dead'))}><option value="alive">Alive</option><option value="dead">Defeated</option></select></div>)}</div></>}

      {page==='Character'&&<div className="character-grid"><Panel title="Identity"><form onSubmit={e=>{e.preventDefault();const v=new FormData(e.target).get('hunterName');act('Change hunter name',()=>editor.setName(v));}}><label className="field"><span className="field-label">Hunter name</span><div className="input-action"><input key={editor.username} name="hunterName" aria-label="Hunter name" defaultValue={editor.username} maxLength={16} required/><button className="button secondary" type="submit">Apply</button></div></label></form><div className="form-grid"><SelectField label="Gender" value={editor.stats.Gender} options={[[0,'Female'],[1,'Male']]} onChange={v=>act('Change gender',()=>editor.setStat('Gender',v))}/><SelectField label="Origin" value={editor.stats.Origin} options={origins.map((o,i)=>[i,o])} onChange={v=>act('Change origin',()=>editor.setStat('Origin',v))}/><SelectField label="Voice" value={editor.stats.Voice} options={Object.entries(voices)} onChange={v=>act('Change voice',()=>editor.setStat('Voice',v))}/><SelectField label="Journey" value={editor.stats.Ng} options={Array.from({length:8},(_,i)=>[i,i?`New Game +${i}`:'New Game'])} onChange={v=>act('Change journey',()=>editor.setStat('Ng',v))}/><Field label="Level" value={editor.stats.Level} onCommit={v=>act(`Set level to ${v}`,()=>editor.setStat('Level',v))}/><Field label="Playtime (milliseconds)" value={editor.u32(8)} onCommit={v=>act('Change playtime',()=>editor.put(8,v))}/></div></Panel><Panel title="Appearance"><p className="muted">Import or export a 235-byte appearance file.</p><div className="button-row"><button className="button secondary" onClick={()=>download(editor.appearance(),`${editor.username}.face`)}><Icon name="download" size={16}/>Export face</button><button className="button secondary" onClick={()=>appearanceInput.current.click()}><Icon name="upload" size={16}/>Import face</button></div></Panel><Panel title="Position"><label className="field"><span className="field-label">Teleport to a lantern</span><select aria-label="Teleport to a lantern" defaultValue="" onChange={e=>{const p=data.locations[Number(e.target.value)];act(`Teleport to ${p.name}`,()=>editor.teleport(p));e.target.value='';}}><option value="" disabled>Choose a destination…</option>{data.locations.map((p,i)=><option key={i} value={i}>{p.name}</option>)}</select></label>{editor.coordinates()?<form key={revision} onSubmit={e=>{e.preventDefault();const f=new FormData(e.target);act('Change hunter coordinates',()=>editor.setCoordinates(['x','y','z'].map(n=>f.get(n))));}}><div className="coordinate-grid">{editor.coordinates().map((v,i)=><label className="field" key={i}><span className="field-label">{'XYZ'[i]}</span><input name={'xyz'[i]} aria-label={`Coordinate ${'XYZ'[i]}`} type="number" step="any" defaultValue={v.toFixed(3)} required/></label>)}</div><button className="button secondary" type="submit">Apply coordinates</button></form>:<p>Coordinates unavailable for this save.</p>}</Panel></div>}

      <Altars editor={editor} hidden={page!=='Altars'} act={act} notify={notify} Icon={Icon} Panel={Panel}/>

      {page==='Lamps'&&<Panel title="Lamps">
        <LampSettings lamps={data.lamps} editor={editor} act={act}/>
      </Panel>}

      {page==='Shortcuts'&&<Panel title="Shortcuts">
        <ShortcutSettings shortcuts={data.shortcuts} charts={data['maps/manifest']} editor={editor} act={act}/>
      </Panel>}

      {page==='WorldFlags'&&<Panel title="World settings">
        <div className="world-action">
          <div><strong>Restore Maria's dialogue</strong><p>Enable dialogue before the encounter.</p></div>
          <button className="button secondary" onClick={()=>act("Restore Maria's dialogue",()=>editor.worldFlag('maria'))}>Restore</button>
        </div>
        <div className="world-action">
          <div><strong>Doll's lullaby</strong><p>Restore the lullaby from version 1.0.</p></div>
          <button className="button secondary" onClick={()=>act("Enable Doll's lullaby",()=>editor.worldFlag('lullaby'))}>Enable</button>
        </div>
        <div className="world-action">
          <div><strong>Blood-addled hunter</strong><p>Enable encounters with Hunter rune cooperators.</p></div>
          <button className="button secondary" onClick={()=>act('Enable blood-addled state',()=>editor.worldFlag('bloodAddled'))}>Enable</button>
        </div>
        <div className="world-action">
          <div><strong>Multiplayer after bosses</strong><p>Re-enable multiplayer in areas where the boss has been defeated.</p></div>
          <button className="button secondary" onClick={()=>act('Enable multiplayer after bosses',()=>editor.worldFlag('multiplayer'))}>Enable</button>
        </div>
        <div className="world-action">
          <div><strong>Isz glitch repair</strong><p>Repair the Isz Chalice glitch in this save.</p></div>
          <button className="button secondary" onClick={()=>{
            const previousEdit = editor.history.at(-1);
            if (act('Repair Isz glitch', () => editor.fixIsz())) {
              notify(editor.history.at(-1) === previousEdit ? 'No Isz repair needed.' : 'Isz repair applied.');
            }
          }}>Apply</button>
        </div>
      </Panel>}

      {page==='Changes'&&<Panel title="Edit history" kicker={`${changed.toLocaleString()} bytes differ from the original`} action={<button className="button secondary" disabled={!changed} onClick={()=>setModal({type:'reset'})}>Reset all changes</button>}><div className="history-list">{[...editor.history].reverse().map((h,i)=><div className="history-row" key={i}><span className="history-dot"/><div><strong>{h.label}</strong><small>Change {editor.history.length-i}</small></div><Icon name="check" size={17}/></div>)}{!editor.history.length&&<div className="empty-inline"><h3>No changes</h3></div>}</div><div className="panel-note">Up to 40 undo steps are kept in memory. Download your edited save to keep your work.</div></Panel>}

    </>}
    </div>

    {!editor && <footer><button className="text-button" onClick={() => setInformationOpen(open => !open)}>{informationOpen ? 'Back to editor' : 'Information'}</button></footer>}

    </main></div>

    {notice&&<div className={`toast ${notice.error?'error':''}`} role={notice.error?'alert':'status'}><Icon name={notice.error?'info':'check'} size={18}/>{notice.text}<button className="icon-button" aria-label="Dismiss notification" onClick={()=>setNotice(null)}><Icon name="close" size={16}/></button></div>}

    {modal&&<Modal confirmDraft={modal.type==='addUpgrade'&&modal.kind===1} title={{add:'Add item',transform:'Transform item',effect:'Choose an effect',addUpgrade:modal.kind===1?'Add a blood gem':'Add a Caryll rune',equip:'Equip a blood gem',replace:'Open another save?',drop:'Open another save?',reset:'Reset all changes?'}[modal.type]} onClose={()=>setModal(null)}>{modal.type==='addUpgrade'&&modal.kind===1?<GemBuilder data={data} onAdd={template=>{if(act('Add blood gem',()=>editor.addUpgrade(template,upgradeLocation==='storage'?'storage':'inventory')))setModal(null);}}/>:['add','transform','effect','equip','addUpgrade'].includes(modal.type)?<Picker modal={modal} data={data} editor={editor} onApply={(value,quantity)=>{const m=modal;let ok;if(m.type==='add')ok=act(`Add ${value.info.item_name}`,()=>editor.addItem(value.id,quantity,page==='Storage'?'storage':'inventory',value.family));if(m.type==='transform')ok=act(`Transform into ${value.info.item_name}`,()=>editor.transform(m.article,value.id));if(m.type==='effect')ok=act(`Change upgrade effect ${m.index+1}`,()=>editor.setEffect(m.upgrade,m.index,value.id));if(m.type==='equip')ok=act('Equip blood gem',()=>editor.equip(m.slot,value));if(m.type==='addUpgrade')ok=act(`Add ${value.info.item_name}`,()=>editor.addUpgrade(value.template,upgradeLocation==='storage'?'storage':'inventory'));if(ok)setModal(null);}}/>:<><p className="muted">{modal.type==='reset'?'This restores the original file and clears this session’s edit history.':'Download your current edits before replacing this save if you want to keep them.'}</p><div className="button-row modal-actions"><button className="button secondary" onClick={()=>setModal(null)}>Cancel</button>{modal.type!=='reset'&&<button className="button secondary" onClick={exportSave}>Download current save</button>}<button className="button primary" onClick={()=>{if(modal.type==='reset'){setEditor(new SaveEditor(editor.original,data,editor.name));setSelected(null);update();}else if(modal.type==='drop')openFile(modal.file);else fileInput.current.click();setModal(null);}}>{modal.type==='reset'?'Reset changes':'Continue'}</button></div></>}</Modal>}

  </div>;

}

function Picker({modal,data,editor,onApply}){

  const [query,setQuery]=useState(''),[chosen,setChosen]=useState(null),[quantity,setQuantity]=useState('1'),[filter,setFilter]=useState('all'),[newShape,setNewShape]=useState(1);

  let options=[];

  if(modal.type==='effect')options=[{id:0xffffffff,info:{item_name:'No effect',item_desc:'Clear this effect slot'}},...Object.entries({...data.upgrades.gemEffects,...data.upgrades.runeEffects}).map(([id,v])=>({id:Number(id),info:{item_name:v.name,item_desc:v.effect}}))];

  else if(modal.type==='addUpgrade') {
    options=data['rune-templates'].map(t=>{const template={kind:2,source:t.source,shape:t.shape,effects:t.effects},info=data.upgrades.runeEffects[t.id];return {id:t.id,template,info:{item_name:info.name,item_desc:`${info.effect} · ${t.shape===2?'Oath':'Memory'} · Effect ${t.id}`}};});
  }
  else if(modal.type==='equip')options=editor.upgrades.filter(u=>u.kind===1&&u.location===(modal.location==='storage'?'storage':'inventory')&&(u.shape===63||u.shape===modal.slot.shape)).map(u=>({...u,info:{item_name:upgradeName(u,data),item_desc:`${editor.effectInfo(u.effects[0]).effect}${gemVisual(u,data.upgrades)?' · '+gemVisual(u,data.upgrades).description:''}`}}));

  else {for(const [category,items] of Object.entries(data.items))for(const [id,info]of Object.entries(items))options.push({id:Number(id),category,info,family:'item'});for(const[category,items]of Object.entries(data.weapons))for(const[id,info]of Object.entries(items))options.push({id:Number(id),category,info,family:'weapon'});for(const[id,info]of Object.entries(data.armors))options.push({id:Number(id),category:'armor',info,family:'armor'});if(modal.type==='transform')options=options.filter(o=>o.family===modal.article.family);}

  const filtered=options.filter(o=>(filter==='all'||o.category===filter)&&`${o.info.item_name} ${o.info.item_desc} ${o.id}`.toLowerCase().includes(query.toLowerCase()));

  return <><div className="picker-search"><div className="search-input"><Icon name="search" size={17}/><input autoFocus aria-label="Search catalog" placeholder="Search the catalog…" value={query} onChange={e=>setQuery(e.target.value)}/></div>{['add','transform'].includes(modal.type)&&<select aria-label="Catalog category" value={filter} onChange={e=>setFilter(e.target.value)}>{Object.entries(categories).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>}{modal.type==='addUpgrade'&&modal.kind===1&&<select aria-label="New gem shape" value={newShape} onChange={e=>setNewShape(Number(e.target.value))}>{Object.entries(SHAPES).filter(([v])=>Number(v)!==0x80000000).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select>}</div>{modal.type==='addUpgrade'&&modal.kind===1&&<p className="panel-note">Choose a primary effect and shape; additional effects can be edited after adding. Save templates keep their original shape. Fixed-effect sources are used where available; other effects use a standard source. Combinations are not checked against natural drops.</p>}<div className="picker-results">{filtered.slice(0,100).map((o,i)=><button className={`picker-row ${chosen===o.id||chosen===o.offset?'selected':''}`} key={o.offset??o.id??i} onClick={()=>setChosen(modal.type==='equip'?o.offset:o.id)}>{modal.type==='equip'?<span className="item-image"><UpgradeImage upgrade={o} data={data}/></span>:(modal.type==='effect'||modal.type==='addUpgrade')?<RuneImage effectId={o.id} data={data} size={32}/>:o.info.item_img&&<img src={asset(`itemImages/${o.info.item_img}`)} alt="" loading="lazy"/>}<span><strong>{o.info.item_name}</strong><small>{o.info.item_desc}</small></span>{(chosen===o.id||chosen===o.offset)&&<Icon name="check" size={17}/>}</button>)}{!filtered.length&&<div className="empty-inline"><p>{modal.type==='equip'?'No compatible loose gems in this inventory.':'No matches. Try another search.'}</p></div>}</div><div className="picker-footer"><span className="quiet">{filtered.length>100?'First 100 of ':''}{filtered.length.toLocaleString()} results</span>{modal.type==='add'&&<label className="quantity-inline">Quantity<input aria-label="New item quantity" type="number" min="1" max="4294967295" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>}<button className="button primary" disabled={chosen===null} onClick={()=>{const value=options.find(o=>(modal.type==='equip'?o.offset:o.id)===chosen);if(value)onApply(value,quantity);}}> {modal.type==='add'?'Add item':modal.type==='addUpgrade'?`Add ${modal.kind===1?'gem':'rune'}`:modal.type==='equip'?'Equip gem':'Apply change'}<Icon name="check" size={16}/></button></div></>;

}

const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root'));

if (import.meta.hot) import.meta.hot.data.root = root;

root.render(<App/>);
