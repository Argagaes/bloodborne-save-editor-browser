import React, { useState } from 'react';
import { ACTIVE_FLAGS, formatHexRecord, parseHexRecord } from './chalice-engine.mjs';

export default function ChaliceBuilder({altar, template, act, editor, notify, onClose}) {
  const [record,setRecord]=useState(()=>formatHexRecord(template?.bytes || altar.bytes));
  const [flagsMode,setFlagsMode]=useState('preserve');
  const [flags,setFlags]=useState(()=>formatHexRecord(altar.flags));
  const [error,setError]=useState('');
  function apply() {
    try {
      const bytes=parseHexRecord(record);
      const chosenFlags=flagsMode==='preserve'?altar.flags:flagsMode==='active'?ACTIVE_FLAGS:parseHexRecord(flags);
      if(act(`Altar ${altar.slot}: custom dungeon`,()=>editor.replaceAltar(altar.slot,{bytes,flags:chosenFlags}))) {
        notify(`Custom dungeon assigned to altar ${altar.slot}.`); onClose();
      }
      setError('');
    } catch(e) { setError(e.message); }
  }
  return <section className="panel chalice-builder" aria-label="Custom chalice builder">
    <div className="catalog-heading"><div><h2>Custom chalice builder</h2><p className="muted">Altar {altar.slot} · {template?`Starting from ${template.glyph}`:'Starting from the current altar'}</p></div><button type="button" className="button secondary" onClick={onClose}>Close builder</button></div>
    <p>Edit or paste all 124 bytes in order, as two-digit hexadecimal values separated by spaces or newlines. Byte offsets begin at 00. Values are not validated as a playable dungeon.</p>
    <p className="muted">The research identifies byte 00 as the map marker, 01 as area/depth, and 02–03 as layout seed. Later bytes include server identity, feature and rite data; preserve unknown bytes unless you intend to change them.</p>
    <label className="field"><span className="field-label">Dungeon record · 124 bytes</span><textarea className="chalice-hex" aria-label="Dungeon record hex bytes" spellCheck="false" value={record} onChange={e=>setRecord(e.target.value)}/></label>
    <label className="field"><span className="field-label">Altar activation and progress flags</span><select value={flagsMode} onChange={e=>setFlagsMode(e.target.value)}><option value="preserve">Preserve current altar flags</option><option value="active">Set standard activation flags (resets progress)</option><option value="custom">Edit all 124 flag bytes</option></select></label>
    {flagsMode==='custom'&&<label className="field"><span className="field-label">Activation and progress flags · 124 bytes</span><textarea className="chalice-hex" aria-label="Altar flag hex bytes" spellCheck="false" value={flags} onChange={e=>setFlags(e.target.value)}/></label>}
    <p className="catalog-warning">Custom layouts, edited rites or unknown flags may crash the game or make an altar unusable. Keep a backup. Preserving flags on an empty altar may leave it inactive.</p>
    <p className="muted"><a href="https://docs.google.com/spreadsheets/d/1zFIzhnXHhYomlR-tFJcyk3cPywf1snqkDH900j6rtAI/edit?gid=935899711#gid=935899711" target="_blank" rel="noopener noreferrer">Tomb Prospectors hex research</a> · <a href="https://docs.google.com/spreadsheets/d/1nrXYpOyUj7k9ff0vdtF0F-7xDK5XNF-tD0ivY7gelbs/edit?gid=0#gid=0" target="_blank" rel="noopener noreferrer">Test chalice notes</a></p>
    {error&&<p className="error-text" role="alert">{error}</p>}<button type="button" className="button primary" onClick={apply}>Assign custom dungeon to altar {altar.slot}</button>
  </section>;
}
