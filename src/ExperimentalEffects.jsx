import React, {useState} from 'react';
import { SHAPES } from './save-engine.js';

export default function ExperimentalEffects({data, editor, act, notify}) {
  const [kind,setKind]=useState('gem');
  const [researchPage,setResearchPage]=useState('identified');
  const groups=data['experimental-effects'].filter(g=>g.kind===kind && (researchPage==='inferred' ? g.inferred : !g.inferred));
  const hasInferred=data['experimental-effects'].some(g=>g.kind===kind && g.inferred);
  const [groupIndex,setGroupIndex]=useState(0), [choice,setChoice]=useState(''), [shape,setShape]=useState(1);
  const group=groups[groupIndex], selected=group.ids.find(x=>String(x.id)===choice);
  function add() {
    if (!selected) return;
    const reference=data['rune-templates'].find(t=>t.id===group.reference);
    const template=group.kind==='gem'
      ? {kind:1,source:0x80016094,shape:Number(shape),effects:[selected.id,0xffffffff,0xffffffff,0xffffffff,0xffffffff,0xffffffff]}
      : reference && {kind:2,source:reference.source,shape:reference.shape,effects:[selected.id,0xffffffff,0xffffffff,0xffffffff,0xffffffff,0xffffffff]};
    if (!template) {notify('No base rune template is available.',true);return;}
    if (act(`Add experimental ${group.kind}: ${selected.id}`,()=>editor.addUpgrade(template,'inventory'))) notify(`Added experimental ${group.kind} to inventory.`);
  }
  return <section className="panel"><div className="panel-heading"><div><span className="eyebrow">Experimental</span><h3>Cut gem and rune effects</h3></div></div>
    <div className="cut-navigation"><div className="cut-nav-group"><span className="cut-nav-label">Upgrade type</span><div className="segmented cut-type-tabs" aria-label="Upgrade type"><button type="button" className={kind==='gem'?'selected':''} aria-pressed={kind==='gem'} onClick={()=>{setKind('gem');setResearchPage('identified');setGroupIndex(0);setChoice('');}}>Blood gems</button><button type="button" className={kind==='rune'?'selected':''} aria-pressed={kind==='rune'} onClick={()=>{setKind('rune');setResearchPage('identified');setGroupIndex(0);setChoice('');}}>Caryll runes</button></div></div>
    <div className="cut-nav-group cut-nav-secondary"><span className="cut-nav-label">Research status</span><div className="segmented cut-status-tabs" aria-label="Cut effect research pages"><button type="button" className={researchPage==='identified'?'selected':''} aria-pressed={researchPage==='identified'} onClick={()=>{setResearchPage('identified');setGroupIndex(0);setChoice('');}}>Identified effects</button><button type="button" disabled={!hasInferred} className={researchPage==='inferred'?'selected':''} aria-pressed={researchPage==='inferred'} onClick={()=>{setResearchPage('inferred');setGroupIndex(0);setChoice('');}}>Inferred candidates</button></div></div></div>
    {group.inferred&&<p className="catalog-warning"><strong>Inferred candidate.</strong> {group.evidence} These are research leads, not confirmed matches to the requested effects.</p>}
    <p className="panel-note">These effect IDs exist in the installed 1.09 game parameters. Their names and behavior may be missing, unfinished, or different in game. Records use a standard gem or related rune template; successful loading, display and behavior have not been verified. Keep a backup.</p>
    <label className="field"><span className="field-label">Effect family</span><select value={groupIndex} onChange={e=>{setGroupIndex(Number(e.target.value));setChoice('');}}>{groups.map((g,i)=><option key={g.label} value={i}>{g.label} ({g.kind})</option>)}</select></label>
    <label className="field"><span className="field-label">Effect ID</span><select value={choice} onChange={e=>setChoice(e.target.value)}><option value="">Choose an effect…</option>{group.ids.map(x=><option key={x.id} value={x.id}>{x.id}{x.rank?` · rank ${x.rank} · cost tier ${Math.floor(x.id/100)%10}`:''} · spEffect {x.spEffect}{x.observation?` · parameter ${x.observation}`:''}</option>)}</select></label>
    {group.kind==='gem'&&<label className="field"><span className="field-label">Gem shape</span><select value={shape} onChange={e=>setShape(e.target.value)}>{Object.entries(SHAPES).filter(([id])=>Number(id)!==0x80000000).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>}
    {group.label==='Weapon sound silencing'&&<p>Community report: firing behind enemies may not alert them. Not independently tested.</p>}
    {group.label==='HP change on attack (unknown behavior)'&&<p>Effect 157620 points to spEffect 57620, which references 58620. Its actual effect on targets is unverified. Community research describes this family as purple; appearance with this editor’s template is not verified.</p>}
    {group.label.includes('after boss defeat')&&<p>Community research describes a temporary effect following a boss defeat. Multiplayer triggering and behavior are unverified.</p>}
    {selected?.id===160620&&<p>Game data sets maximum HP to 43.75% (a 56.25% reduction).</p>}{selected?.id===161620&&<p>Game data sets maximum stamina to 62.5% (a 37.5% reduction).</p>}<button className="button primary" disabled={!selected} onClick={add}>Add to inventory</button>
    <details><summary>Effects still being researched</summary><p>Attack up when another player defeats a boss; visceral attacks cure status effects; vial effect up; mana recovery; and the reported stamina reduction when spending stamina have not been matched to a specific verified effect here. Purple gem appearance alone does not identify an effect. The existing Hunter oath rune has stamina recovery and the Radiance oath rune boosts vial healing; these are available in the normal rune picker but are not confirmed matches for the cut effects. Inferred stamina-recovery candidates are listed separately.</p></details>
    <p className="panel-note"><a href="https://www.bloodborne-wiki.com/2017/12/data-mining.html" target="_blank" rel="noopener noreferrer">Community gem research</a> · <a href="https://www.bloodborne-wiki.com/2018/01/datamined-caryll-rune-effects.html" target="_blank" rel="noopener noreferrer">Datamined rune effects</a></p>
  </section>;
}
