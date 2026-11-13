import React, {useState} from 'react';
import {quests} from './quest-data.js';
import {flagAddress, inferFlagGroups, questFlags, questStateRanges, readQuestFlag, writeQuestFlag} from './quest-flags.js';
import eventIndex from './npc-event-index.json';

export default function QuestResearch({editor, act, revision}) {
  const [search, setSearch] = useState('');
  const [offsets, setOffsets] = useState({});
  const [customFlag, setCustomFlag] = useState('');
  const inferred = {1:1002, ...inferFlagGroups([...(editor.data.shortcuts || []), ...(editor.data['shortcut-auxiliary'] || []), ...(editor.data.lamps || [])])};
  function groupBase(id) {
    const group = Math.floor(id / 1000);
    if (Object.hasOwn(offsets, group)) {
      const value = offsets[group].trim();
      return /^\d+$/.test(value) ? Number(value) : null;
    }
    return inferred[group] ?? null;
  }
  function control({id, note}) {
    const base = groupBase(id);
    let checked = false, address = null;
    if (base !== null) try { address = flagAddress(editor,id,base); checked = readQuestFlag(editor,id,base); } catch {}
    const writes = eventIndex.flags[id] || [];
    return <div key={id}><label className="quest-flag">
      <input type="checkbox" disabled={!address} checked={checked} onChange={event=>act(`Set NPC flag ${id} ${event.target.checked ? 'on' : 'off'}`,()=>writeQuestFlag(editor,id,base,event.target.checked))}/>
      <span><strong>{id}</strong> · {note}<small>{address ? `Save offset +${address.offset-editor.flagOffset}, mask 0x${address.mask.toString(16).padStart(2,'0')} · ${Object.hasOwn(offsets, Math.floor(id/1000)) ? 'manual mapping' : 'inferred mapping'}` : `Set group ${Math.floor(id/1000)} offset below to enable`}</small></span>
    </label>{writes.length>0&&<details className="quest-script-refs"><summary>Script write sites ({writes.length})</summary><ul>{writes.map((site,i)=><li key={i}>{site.map} · event {site.event} · instruction {site.instruction} · {site.action}</li>)}</ul><small>Literal writes in installed scripts; parameterized events and dialogue scripts are not indexed. A write site does not describe its conditions.</small></details>}</div>;
  }
  function controlsFor(quest) {
    const flags = questFlags[quest.name];
    if (!flags) return <p className="panel-note">Quest flag mapping not researched yet.</p>;
    const sections = [...new Set(flags.map(flag=>flag.section || 'Related flags'))];
    const stateRange = questStateRanges[quest.name];
    let active = [];
    if (stateRange && groupBase(stateRange[0]) !== null) {
      try { active = flags.filter(flag=>!flag.marker && flag.id>=stateRange[0] && flag.id<=stateRange[1] && readQuestFlag(editor,flag.id,groupBase(flag.id))); } catch {}
    }
    return <div className="quest-flag-sections">
      {stateRange && <p>The state range {stateRange[0]}–{stateRange[1]} is associated with this NPC from script evidence. Many individual meanings remain unknown. The game often clears the range before setting another state; these checkboxes change one bit at a time.{active.length>1 && ` Multiple state flags are currently on (${active.map(flag=>flag.id).join(', ')}).`}</p>}
      {sections.map(section=><div key={section}><h4>{section}</h4>{flags.filter(flag=>(flag.section || 'Related flags') === section).map(control)}</div>)}
    </div>;
  }
  const filtered = quests.filter(quest => `${quest.name} ${quest.area} ${quest.route} ${quest.flags || ''} ${JSON.stringify(questFlags[quest.name] || [])}`.toLowerCase().includes(search.toLowerCase()));
  const numericFlag = /^\d+$/.test(customFlag.trim()) ? Number(customFlag) : null;
  const calibrationGroups = [...new Set([1, ...Object.values(questFlags).flat().map(flag=>Math.floor(flag.id/1000)), ...(numericFlag !== null ? [Math.floor(numericFlag/1000)] : [])])].sort((a,b)=>a-b);
  return <section className="panel quest-research">
    <div className="panel-heading"><div><span className="eyebrow">Experimental</span><h3>NPC quests and encounters</h3></div></div>
    <p>Superuser controls: these are individual event bits, not tested quest or revival presets. Inferred and manually supplied addresses may be wrong; back up your save and test on a disposable copy. The game may overwrite flags on load.</p>
    <p>Flags are grouped by event order where known; branches are alternatives, not a checklist. Group 1’s offset is inferred from the game’s initial quest states across several saves and has not yet been tested by changing NPCs in game.</p>
    <p>NPC routes interact with bosses, world time, other characters and rewards. This list includes base game and The Old Hunters; follow the linked guides for branches and details.</p>
    <label className="field"><span className="field-label">Search quests</span><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Name, area or flag…"/></label>
    <div className="quest-list">{filtered.map(quest=><details key={quest.name} className="quest-entry"><summary><strong>{quest.name}</strong><span>{quest.area}{quest.dlc ? ' · DLC' : ''}</span></summary><p>{quest.route}</p>{quest.rewards&&<p><strong>Rewards:</strong> {quest.rewards}</p>}{quest.flags&&<p><strong>Script research:</strong> {quest.flags}</p>}{controlsFor(quest)}</details>)}{!filtered.length&&<p>No matching NPCs.</p>}</div>
    <details className="quest-entry"><summary><strong>All candidate global state ranges</strong></summary>
      <p>Ranges 1000–1459 are initialized in the common event script; 1700–1819 include additional NPC-related flags. Some describe world or NPC state; unassigned ranges and their order are not identified. Each checkbox changes one bit.</p>
      {[...Array.from({length:14},(_,i)=>[1000+i*20,1019+i*20]),[1280,1289],[1290,1299],...Array.from({length:8},(_,i)=>[1300+i*20,1319+i*20]),[1700,1719],[1720,1739],[1740,1759],[1760,1779],[1780,1799],[1800,1819]].map(([start,end])=><details key={start} className="quest-entry"><summary><strong>{start}–{end}</strong><span>{Object.entries(questStateRanges).filter(([,range])=>range[0]===start).map(([name])=>name).join(', ') || 'Unassigned'}</span></summary>{Array.from({length:end-start+1},(_,i)=>control({id:start+i,note:'Raw state bit; meaning may be unknown'}))}</details>)}
    </details>
    <details className="quest-entry"><summary><strong>Flag group calibration and custom flag</strong></summary>
      <p>Unknown groups have no verified save address. Enter the byte offset of the start of that 1,000-flag group relative to the editor’s flag base (username + 68545). Leave blank to disable the group. Do not enter an absolute file offset.</p>
      {calibrationGroups.map(group=><label className="field quest-calibration" key={group}><span className="field-label">Group {group} ({group*1000}–{group*1000+999}) {inferred[group] != null ? `· inferred +${inferred[group]}` : '· unknown'}</span><input type="number" min="0" step="1" placeholder={inferred[group] != null ? `Inferred: ${inferred[group]}` : 'Relative group offset'} value={offsets[group] ?? ''} onChange={event=>{const value=event.target.value;setOffsets(previous=>({...previous,[group]:value}));}}/><button type="button" className="text-button" onClick={()=>setOffsets(previous=>{const next={...previous};delete next[group];return next;})}>Use default</button></label>)}
      <label className="field"><span className="field-label">Custom event flag ID</span><input type="number" min="0" step="1" value={customFlag} onChange={event=>setCustomFlag(event.target.value)} placeholder="Event flag ID"/></label>
      {Number.isSafeInteger(numericFlag) && numericFlag >= 0 && control({id:numericFlag,note:'Custom flag'})}
    </details>
    <p className="panel-note">Sources: <a href="https://www.bloodborne-wiki.com/p/npcs.html" target="_blank" rel="noopener noreferrer">NPC index</a>, <a href="https://game-checklists.com/bloodborne/all-questlines/" target="_blank" rel="noopener noreferrer">quest checklist</a>, <a href="https://github.com/Grimrukh/soulstruct-vanilla/blob/main/bloodborne/events/m24_01_00_00.evs.py" target="_blank" rel="noopener noreferrer">vanilla events</a>, and <a href="https://github.com/Amanises-Yharnam-Together/BBSC-Yharnam-Together/blob/main/docs/HANDOFF.md" target="_blank" rel="noopener noreferrer">Yharnam Together research</a>. Details can contain spoilers.</p>
  </section>;
}
