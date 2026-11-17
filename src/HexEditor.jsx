import React, {useMemo,useRef,useState} from 'react';
import {hexOffset,parseHexBytes,staticSaveMap,writeHexBytes} from './hex-editor.js';
import './hex-editor.css';
const ROW=16, ROW_HEIGHT=30, VIEW_ROWS=42, MAX_SCROLL_HEIGHT=8000000;
const hex=value=>value.toString(16).toUpperCase().padStart(2,'0');
export default function HexEditor({editor,data,act,revision}) {
  const viewport=useRef(null);
  const [scrollTop,setScrollTop]=useState(0), [selected,setSelected]=useState(0), [fieldId,setFieldId]=useState(''), [jump,setJump]=useState(''), [draft,setDraft]=useState(''), [error,setError]=useState('');
  const map=useMemo(()=>staticSaveMap(editor,data),[editor,data,revision]);
  const field=map.fields.find(f=>`${f.section}:${f.name}`===fieldId);
  const contextRegion=field && map.regions.find(r=>field.start>=r.start && field.start+field.length<=r.start+r.length);
  const rowCount=Math.ceil(editor.bytes.length/ROW);
  const scale=Math.min(1,MAX_SCROLL_HEIGHT/(rowCount*ROW_HEIGHT));
  const firstRow=Math.max(0,Math.min(Math.max(0,rowCount-VIEW_ROWS),Math.floor(scrollTop/(ROW_HEIGHT*scale))-8));
  const lastRow=Math.min(rowCount,firstRow+VIEW_ROWS);
  const topSpace=Math.round(firstRow*ROW_HEIGHT*scale);
  const bottomSpace=Math.max(0,Math.round((rowCount-lastRow)*ROW_HEIGHT*scale));
  const selectedFields=map.fields.filter(f=>selected>=f.start&&selected<f.start+f.length);
  const selectedRegions=map.regions.filter(r=>selected>=r.start&&selected<r.start+r.length);
  function selectByte(offset,scroll=false) {setSelected(offset);setDraft(hex(editor.bytes[offset]));setError('');if(scroll && viewport.current){const top=Math.floor(offset/ROW)*ROW_HEIGHT*scale;viewport.current.scrollTop=top;setScrollTop(viewport.current.scrollTop);}}
  function chooseField(value) {setFieldId(value);const f=map.fields.find(x=>`${x.section}:${x.name}`===value);if(f)selectByte(f.start,true);}
  function jumpTo(e) {e.preventDefault();const text=jump.trim();if(!/^(?:0x[0-9a-f]+|[0-9]+)$/i.test(text)){setError('Enter a decimal offset or hexadecimal offset beginning with 0x.');return;}const n=Number(text);if(!Number.isSafeInteger(n)||n<0||n>=editor.bytes.length){setError('Offset is outside this save.');return;}selectByte(n,true);}
  function apply(e) {e.preventDefault();try {const bytes=parseHexBytes(draft);if(selected+bytes.length>editor.bytes.length)throw Error('The byte range is outside the save.');if(act(`Edit ${bytes.length} byte${bytes.length===1?'':'s'} at ${hexOffset(selected)}`,()=>writeHexBytes(editor,selected,bytes)))setError('');}catch(err){setError(err.message);}}
  const lines=[];for(let row=firstRow;row<lastRow;row++)lines.push(row*ROW);
  return <section className="panel hex-editor"><div className="panel-heading"><div><span className="eyebrow">Experimental</span><h3>Save byte editor</h3></div></div>
    <p className="hex-intro">Browse the whole save and edit bytes in hexadecimal. Addresses and labels are recalculated from the current save. Unknown bytes are still editable. Raw changes can corrupt a save; keep a backup. Changes that prevent the editor from reading its required layout are rejected.</p>
    <div className="hex-controls"><label className="field"><span className="field-label">Find a known field</span><select value={fieldId} onChange={e=>chooseField(e.target.value)}><option value="">Choose a field…</option>{[...new Set(map.fields.map(f=>f.section))].map(section=><optgroup key={section} label={section}>{map.fields.filter(f=>f.section===section).map(f=><option key={`${f.section}:${f.name}`} value={`${f.section}:${f.name}`}>{f.name} · {hexOffset(f.start)}</option>)}</optgroup>)}</select></label>
    <label className="field"><span className="field-label">Browse a known region</span><select value="" onChange={e=>{const r=map.regions[Number(e.target.value)];if(r){setFieldId('');selectByte(r.start,true);}}}><option value="">Choose a region…</option>{map.regions.map((r,i)=><option key={r.name} value={i}>{r.name} · {hexOffset(r.start)}</option>)}</select></label>
    <form onSubmit={jumpTo} className="hex-jump"><label className="field"><span className="field-label">Go to offset</span><input value={jump} onChange={e=>setJump(e.target.value)} placeholder="0x000000 or decimal"/></label></form></div>
    <div className="hex-description">{field?<><strong>Highlighted: {field.name}</strong> · {hexOffset(field.start)}–{hexOffset(field.start+field.length-1)} · {field.detail}{contextRegion&&<> · Shaded region: {contextRegion.name}</>}</>:<span>Select a field to highlight its bytes. Click any byte to edit it.</span>}</div>
    <p className="hex-scroll-hint">Scroll through the save · {editor.bytes.length.toLocaleString()} bytes</p>
    <div className="hex-table-wrap" ref={viewport} onScroll={e=>setScrollTop(e.currentTarget.scrollTop)} tabIndex={0} aria-label="Scrollable save bytes"><table className="hex-table"><thead><tr><th scope="col">Offset</th>{Array.from({length:ROW},(_,i)=><th key={i} scope="col">{hex(i)}</th>)}<th scope="col">ASCII</th></tr></thead><tbody>{topSpace>0&&<tr className="hex-spacer" aria-hidden="true"><td colSpan={18} style={{height:topSpace}}/></tr>}{lines.map(row=><tr className="hex-data-row" key={row}><th scope="row">{hexOffset(row)}</th>{Array.from({length:ROW},(_,i)=>{const offset=row+i;if(offset>=editor.bytes.length)return <td key={i}/>;const highlighted=field&&offset>=field.start&&offset<field.start+field.length;const context=contextRegion&&offset>=contextRegion.start&&offset<contextRegion.start+contextRegion.length;return <td key={i}><button type="button" className={`hex-byte ${context?'in-region':''} ${highlighted?'highlighted':''} ${offset===selected?'selected':''}`} aria-label={`Byte ${hexOffset(offset)}: ${hex(editor.bytes[offset])}`} aria-pressed={offset===selected} onClick={()=>selectByte(offset)}>{hex(editor.bytes[offset])}</button></td>;})}<td className="hex-ascii">{Array.from(editor.bytes.slice(row,Math.min(row+ROW,editor.bytes.length)),b=>b>=32&&b<=126?String.fromCharCode(b):'.').join('')}</td></tr>)}{bottomSpace>0&&<tr className="hex-spacer" aria-hidden="true"><td colSpan={18} style={{height:bottomSpace}}/></tr>}</tbody></table></div>
    <div className="hex-detail"><strong>Selected byte: {hexOffset(selected)} · {hex(editor.bytes[selected])}</strong>{selectedFields.length>0&&<p>Known field: {selectedFields.map(f=>`${f.name} (${f.detail})`).join('; ')}</p>}{selectedRegions.length>0?<p>Region: {selectedRegions.map(r=>r.name).join(' / ')}. {selectedRegions.map(r=>r.detail).join(' ')}</p>:<p>No region identified for this byte.</p>}</div>
    <form className="hex-edit" onSubmit={apply}><label className="field"><span className="field-label">Write bytes starting at {hexOffset(selected)}</span><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="e.g. 01 FF 00" spellCheck="false"/><small>Two hex digits per byte; separate multiple bytes with spaces. This overwrites bytes without changing file size.</small></label><button type="submit" className="button primary">Apply bytes</button></form>{error&&<p role="alert" className="error-text">{error}</p>}
  </section>;
}
