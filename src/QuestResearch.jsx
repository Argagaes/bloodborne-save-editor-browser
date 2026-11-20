import React, {useState} from 'react';
import {quests} from './quest-data.js';
import {inferredFlagGroupOffset} from './flag-group-layout.js';
import {eileenCharacterCandidate, setEileenCharacterCandidate} from './eileen-research.js';
import {flagAddress, inferQuestFlagGroups, questFlags, questStateRanges, readQuestFlag, writeQuestFlag} from './quest-flags.js';
import eventIndex from './npc-event-index.json';
import characterCandidates from './npc-character-candidates.json';
import npcEffects from './npc-speffects.json';
import {npcInternalNames,internalNameSource} from './npc-internal-names.js';
import {characterCandidate, writeCharacterCandidate} from './npc-character-state.js';

export default function QuestResearch({editor, act, revision}) {
  const [search, setSearch] = useState('');
  const [offsets, setOffsets] = useState({});
  const [customFlag, setCustomFlag] = useState('');
  const inferred = inferQuestFlagGroups(editor.data);
  function groupBase(id) {
    const group = Math.floor(id / 1000);
    if (Object.hasOwn(offsets, group)) {
      const value = offsets[group].trim();
      return /^\d+$/.test(value) ? Number(value) : null;
    }
    return Object.hasOwn(inferred,group) ? inferred[group] : inferredFlagGroupOffset(group);
  }
  function control({id, note}) {
    const base = groupBase(id);
    let checked = false, address = null;
    if (base !== null) try { address = flagAddress(editor,id,base); checked = readQuestFlag(editor,id,base); } catch {}
    const writes = eventIndex.flags[id] || [];
    return <div key={id}><label className="quest-flag">
      <input type="checkbox" disabled={!address} checked={checked} onChange={event=>act(`Set NPC flag ${id} ${event.target.checked ? 'on' : 'off'}`,()=>writeQuestFlag(editor,id,base,event.target.checked))}/>
      <span><strong>{id}</strong> · {note}<small>{address ? `Save offset +${address.offset-editor.flagOffset}, mask 0x${address.mask.toString(16).padStart(2,'0')} · ${Object.hasOwn(offsets, Math.floor(id/1000)) ? 'manual mapping' : 'inferred mapping'}` : `Set group ${Math.floor(id/1000)} offset below to enable`}</small></span>
    </label>{writes.length>0&&<details className="quest-script-refs"><summary>Script write sites ({writes.length})</summary><ul>{writes.map((site,i)=>{const checks=eventIndex.checks?.[site.checksKey];return <li key={i}>{site.map} · event {site.event} · instruction {site.instruction} · {site.action}{site.caller != null && ` · called by ${site.caller}, slot ${site.slot}`}{!!checks?.flags?.length&&<div>Flags checked somewhere in event: {checks.flags.map(([flag,state])=>`${flag} ${state?'on':'off'}`).join(', ')}</div>}{!!checks?.characters?.length&&<div>Characters checked somewhere in event: {checks.characters.map(([id,state])=>`${id} ${state?'dead':'alive'}`).join(', ')}</div>}</li>;})}</ul><small>Installed scripts: literal writes and parameters resolved from same-file calls. Checks may belong to different branches, not necessarily the selected write. Unresolved calls, common-event calls and dialogue are not indexed.</small></details>}</div>;
  }
  let eileenCharacter=null, eileenCharacterError='';
  try { eileenCharacter=eileenCharacterCandidate(editor); } catch (error) { eileenCharacterError=error.message; }
  function controlsFor(quest) {
    const flags = questFlags[quest.name];
    if (!flags) return <p className="panel-note">{quest.name === 'Blood Minister' ? 'Opening-cutscene character. No persistent NPC quest or revival flag has been established in the inspected map events; the clinic window character is Iosefka, not the minister.' : 'No supported flag association found in the inspected scripts.'}</p>;
    const candidates=characterCandidates.filter(candidate=>candidate.npc===quest.name);
    const sections = [...new Set(flags.map(flag=>flag.section || 'Related flags'))];
    const stateRange = questStateRanges[quest.name];
    let active = [];
    if (stateRange && groupBase(stateRange[0]) !== null) {
      try { active = flags.filter(flag=>!flag.marker && flag.id>=stateRange[0] && flag.id<=stateRange[1] && readQuestFlag(editor,flag.id,groupBase(flag.id))); } catch {}
    }
    return <div className="quest-flag-sections">
      {!!npcInternalNames[quest.name]?.length&&<details className="quest-entry"><summary><strong>Internal NPC names</strong></summary><p>Japanese names and English translations from the <a href={internalNameSource} target="_blank" rel="noopener noreferrer">datamined internal names reference</a>. These are NPC data IDs, not save flags; variants can use different IDs.</p>{npcInternalNames[quest.name].map(entry=><div key={entry.id}><strong>{entry.official} · NPC data ID {entry.id}</strong><p>{entry.jp} · {entry.translation}{entry.note&&` · ${entry.note}`}</p></div>)}</details>}
      {!!npcEffects[quest.name]?.length&&<details className="quest-entry"><summary><strong>NPC parameter effects (reference)</strong></summary><p>Transcribed from NPCs SpEffects.xlsx. IDs are NPC parameter IDs, not save flags or editable gems. Values describe game-data variants and have not been independently tested in game.</p>{npcEffects[quest.name].map((entry,i)=><div key={i}><strong>{entry.name} · {entry.status} · {entry.location}</strong><small> Parameter {entry.id} · {entry.sheet}</small><p>{entry.values.map(x=>`${x.label}: ${x.value}`).join(' · ')}</p></div>)}</details>}
      {candidates.length>0&&<details className="quest-entry"><summary><strong>Candidate character-state bits ({candidates.length})</strong></summary><p>These positions are inferred from the installed vanilla map character lists and the observed Eileen bit. They may represent temporary state for the loaded map; their meaning and ordering for other characters are unknown. A matching character count does not prove the layout matches. Each switch changes only one bit; use a backup and investigate on a disposable save.</p>{candidates.map(candidate=>{let address=null,error='';try{address=characterCandidate(editor,candidate);}catch(e){error=e.message;}return <label className="quest-flag" key={`${candidate.map}-${candidate.entity}`}><input type="checkbox" disabled={!address} checked={address?.enabled || false} onChange={event=>act(`Set candidate character bit ${candidate.entity}`,()=>writeCharacterCandidate(editor,candidate,event.target.checked))}/><span><strong>{candidate.label}</strong> · {candidate.map} · entity {candidate.entity}<small>{address ? `Candidate index ${candidate.index} / ${candidate.count} · byte 0x${address.offset.toString(16).toUpperCase()} · mask 0x${address.mask.toString(16).padStart(2,'0')} · meaning unknown` : `Unavailable: ${error}`}</small></span></label>;})}</details>}
      {stateRange && <p>The state range {stateRange[0]}–{stateRange[1]} is associated with this NPC from script evidence. Many individual meanings remain unknown. The game often clears the range before setting another state; these checkboxes change one bit at a time.{active.length>1 && ` Multiple state flags are currently on (${active.map(flag=>flag.id).join(', ')}).`}</p>}
      {sections.map(section=><div key={section}><h4>{section}</h4>{quest.name==='Eileen the Crow' && section==='First encounter death research' && <label className="quest-flag"><input type="checkbox" disabled={!eileenCharacter} checked={eileenCharacter?.enabled || false} onChange={event=>act(`Set Eileen character-state bit ${event.target.checked?'on':'off'}`,()=>setEileenCharacterCandidate(editor,event.target.checked))}/><span><strong>Central Yharnam character-state bit</strong> · Observed after death while Central Yharnam was loaded; this appears to be temporary map character state, not a permanent quest flag.<small>{eileenCharacter ? `Save byte 0x${eileenCharacter.offset.toString(16).toUpperCase()} · mask 0x10 · 0x3ED8E in the supplied captures; address may vary` : `Unavailable: ${eileenCharacterError}`}</small></span></label>}{flags.filter(flag=>(flag.section || 'Related flags') === section).map(control)}</div>)}
    </div>;
  }
  const filtered = quests.filter(quest => `${quest.name} ${quest.area} ${quest.route} ${quest.flags || ''} ${JSON.stringify(questFlags[quest.name] || [])} ${JSON.stringify(npcInternalNames[quest.name] || [])}`.toLowerCase().includes(search.toLowerCase()));
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
      <p>Group addresses are inferred from the flag-pool layout and can still be wrong. Unsupported or conflicting groups have no address. Enter the byte offset of the start of that 1,000-flag group relative to the editor’s flag base (username + 68545). Leave blank to disable the group. Do not enter an absolute file offset.</p>
      {calibrationGroups.map(group=><label className="field quest-calibration" key={group}><span className="field-label">Group {group} ({group*1000}–{group*1000+999}) {inferred[group] != null ? `· inferred +${inferred[group]}` : '· unknown'}</span><input type="number" min="0" step="1" placeholder={inferred[group] != null ? `Inferred: ${inferred[group]}` : 'Relative group offset'} value={offsets[group] ?? ''} onChange={event=>{const value=event.target.value;setOffsets(previous=>({...previous,[group]:value}));}}/><button type="button" className="text-button" onClick={()=>setOffsets(previous=>{const next={...previous};delete next[group];return next;})}>Use default</button></label>)}
      <label className="field"><span className="field-label">Custom event flag ID</span><input type="number" min="0" step="1" value={customFlag} onChange={event=>setCustomFlag(event.target.value)} placeholder="Event flag ID"/></label>
      {Number.isSafeInteger(numericFlag) && numericFlag >= 0 && control({id:numericFlag,note:'Custom flag'})}
    </details>
    <p className="panel-note">Sources: <a href="https://www.bloodborne-wiki.com/p/npcs.html" target="_blank" rel="noopener noreferrer">NPC index</a>, <a href="https://game-checklists.com/bloodborne/all-questlines/" target="_blank" rel="noopener noreferrer">quest checklist</a>, <a href="https://github.com/Grimrukh/soulstruct-vanilla/blob/main/bloodborne/events/m24_01_00_00.evs.py" target="_blank" rel="noopener noreferrer">vanilla events</a>, and <a href="https://github.com/Amanises-Yharnam-Together/BBSC-Yharnam-Together/blob/main/docs/HANDOFF.md" target="_blank" rel="noopener noreferrer">Yharnam Together research</a>. Details can contain spoilers.</p>
  </section>;
}
