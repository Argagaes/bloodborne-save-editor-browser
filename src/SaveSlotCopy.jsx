import React, {useState} from 'react';
import {copySaveSlot, readSaveSlots, sourceSlot} from './save-slots.js';

function download(bytes, name) {
  const url = URL.createObjectURL(new Blob([bytes], {type:'application/octet-stream'}));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function SaveSlotCopy({editor, revision}) {
  const [system,setSystem]=useState(null), [target,setTarget]=useState(''), [error,setError]=useState('');
  let source, slots, result, validationError='';
  try {
    source=sourceSlot(editor.name);
    if(system) {
      slots=readSaveSlots(system);
      if(target!=='') {
        const originalFace=editor.original.findIndex((_,i,a)=>i>=0xf000&&a[i]===70&&a[i+1]===65&&a[i+2]===67&&a[i+3]===69);
        const nameOffset=originalFace-34497;
        if(nameOffset<0) throw Error('Could not locate the original character name.');
        result=copySaveSlot(system,source,Number(target),editor.original.slice(nameOffset+1,nameOffset+33));
      }
    }
  } catch(e) { validationError=e.message; }
  async function open(event) {
    const file=event.target.files?.[0]; event.target.value='';
    if(!file) return;
    try { const bytes=new Uint8Array(await file.arrayBuffer()); readSaveSlots(bytes); setSystem(bytes); setTarget(''); setError(''); }
    catch(e) {setSystem(null);setError(e.message);}
  }
  const filename=target===''?'':`userdata${String(target).padStart(4,'0')}`;
  return <section className="panel"><h3>Copy character to another save slot</h3>
    <p className="panel-note">Experimental: copies this character and its menu entry to an empty slot. Tested against save-file comparisons, not yet verified in game. Back up the entire save folder and close the game first.</p>
    <p>Source: <strong>{editor.name}</strong>{source!==undefined&&` · slot ${source}`}</p>
    <label className="field"><span className="field-label">System file from the same save folder</span><input type="file" aria-label="Open userdata0010 system file" onChange={open}/></label>
    {slots&&<label className="field"><span className="field-label">Destination</span><select value={target} onChange={e=>{setTarget(e.target.value);setError('');}}><option value="">Choose an empty slot…</option>{slots.map(s=><option key={s.slot} value={s.slot} disabled={s.occupied}>Slot {s.slot} · {s.occupied?`occupied${s.name?` (${s.name})`:''}`:'empty'}</option>)}</select></label>}
    {(error||validationError)&&<p className="error-text" role="alert">{error||validationError}</p>}
    {result&&<><p className="panel-note">Download all four files and place them together in your save folder. The menu summary may show the source character’s old details until the game updates it. Existing destination slots cannot be overwritten.</p><div className="button-row"><button className="button primary" onClick={()=>download(editor.bytes,filename)}>Download {filename}</button><button className="button secondary" onClick={()=>download(editor.bytes,`backup${String(target).padStart(4,'0')}`)}>Download backup{String(target).padStart(4,'0')}</button><button className="button secondary" onClick={()=>download(result,'userdata0010')}>Download userdata0010</button><button className="button secondary" onClick={()=>download(result,'backup0010')}>Download backup0010</button></div></>}
  </section>;
}
