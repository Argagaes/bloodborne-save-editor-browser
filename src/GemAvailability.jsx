import React from 'react';
import {gemAvailability, glyphEvidence} from './gem-availability.js';

export default function GemAvailability({primary,shape,extra,effects}) {
  const assessment=gemAvailability(primary,shape,extra,effects), evidence=glyphEvidence(primary,effects);
  return <section className="gem-pool-reference" aria-live="polite"><p className="panel-note"><strong>{assessment.label}</strong> · {assessment.detail}</p>
    {evidence&&<details><summary>Glyph research for {evidence.section}</summary><p className="panel-note">These are community-reported farming examples, including edited dungeons. They are related to this effect family; they do not necessarily match this gem's shape, secondary effects or curse.</p><ul>{evidence.records.map((record,i)=><li key={i}>{record.description}{record.edited?' · edited gem pool or dungeon':''}</li>)}</ul></details>}
  </section>;
}
