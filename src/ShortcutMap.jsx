import React, { useEffect, useRef, useState } from 'react';
import { mapPoint } from './bbmap.js';

export default function ShortcutMap({mapId, mapName, maps, shortcuts, editor, selected, onSelect}) {
  const [zoom,setZoom]=useState(1), viewport=useRef(null);
  const chart=maps[mapId];
  useEffect(()=>{setZoom(1);if(viewport.current)viewport.current.scrollTo({left:0,top:0});},[mapId]);
  useEffect(()=>{
    if(!chart||!viewport.current||!selected)return;
    const shortcut=shortcuts.find(item=>item.eventFlag===selected),position=shortcut?.positions?.[0];if(!position)return;
    const point=mapPoint(chart,position),el=viewport.current,scale=el.clientWidth*zoom/chart.width;
    el.scrollTo({left:point.x*scale-el.clientWidth/2,top:point.y*scale-el.clientHeight/2,behavior:'smooth'});
  },[chart,selected,zoom,shortcuts]);
  const markers=chart?shortcuts.flatMap((shortcut,i)=>(shortcut.positions||[]).map((position,n)=>({...shortcut,...mapPoint(chart,position),index:i+1,point:n}))):[];
  const current=shortcuts.find(s=>s.eventFlag===selected);
  return <section className="shortcut-map" aria-label="Shortcut map">
    <div className="shortcut-map-header"><div><h3>{mapName} map</h3><p>Map generated from the game’s area files.</p></div></div>
    {!chart&&<p className="shortcut-map-hint">No bundled map is available for this area.</p>}
    {chart&&<><div className="shortcut-map-tools"><span>{current ? `${current.name} · ${editor.shortcutEnabled(current.eventFlag)?'On':'Off'}` : 'Select an entry or map marker'}</span><button type="button" className="button secondary" onClick={()=>setZoom(z=>Math.max(1,z/1.4))} disabled={zoom<=1} aria-label="Zoom out">−</button><span>{Math.round(zoom*100)}%</span><button type="button" className="button secondary" onClick={()=>setZoom(z=>Math.min(4,z*1.4))} disabled={zoom>=4} aria-label="Zoom in">+</button></div><div className="shortcut-map-viewport" ref={viewport}>
      <svg key={mapId} className="shortcut-map-svg" viewBox={`0 0 ${chart.width} ${chart.height}`} style={{width:`${zoom*100}%`}} role="group" aria-label={`${mapName} shortcut locations`}>
        <image key={chart.image} href={`${import.meta.env.BASE_URL}${chart.image}`} x="0" y="0" width={chart.width} height={chart.height}/>
        {markers.map(shortcut=><g key={`${shortcut.eventFlag}-${shortcut.point}`} className={`shortcut-map-marker ${selected===shortcut.eventFlag?'selected':''} ${(shortcut.positions?.length||0)>1?'linked':''} ${editor.shortcutEnabled(shortcut.eventFlag)?'open':'locked'}`} role="button" tabIndex="0" aria-label={`${shortcut.name}: ${editor.shortcutEnabled(shortcut.eventFlag)?'on':'off'}`} onClick={()=>onSelect(shortcut.eventFlag)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(shortcut.eventFlag);}}}><title>{shortcut.name}{shortcut.positions.length>1?' (possible linked points)':''}</title><circle cx={shortcut.x} cy={shortcut.y} r="29"/><text x={shortcut.x} y={shortcut.y} textAnchor="middle" dominantBaseline="central">{shortcut.index}</text></g>)}
      </svg>
    </div><p className="shortcut-map-hint">Purple outlines group possible locations for one checkbox; selecting it highlights them together. Points can overlap on different floors. Fill color reflects the edited save’s flag.</p></>}
  </section>;
}
