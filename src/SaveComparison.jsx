import React, { useState } from 'react';
import { SaveEditor } from './save-engine.js';
import { compareSaves } from './save-comparison.js';
import { compareQuestFlags } from './quest-comparison.js';

export default function SaveComparison({editor, data, revision}) {
  const [other, setOther] = useState(null);
  const [error, setError] = useState('');
  async function open(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      setOther(new SaveEditor(bytes, data, file.name));
      setError('');
    } catch (e) { setError(`Could not open ${file.name}: ${e.message}`); }
  }
  const groups = other ? compareSaves(editor, other, data) : [];
  const questSummary = other ? compareQuestFlags(editor, other, data) : null;
  return <section className="panel" aria-label="Save comparison">
    <div className="panel-heading"><div><span className="eyebrow">Experimental</span><h3>Save comparison</h3></div></div>
    <p className="panel-note">Compare the current save, including pending edits, with another decrypted character save. Comparison is read-only. NPC quest and related flag addresses and descriptions are inferred; a changed bit does not by itself establish an NPC state. Equipment details, gems, runes, chalices and unlisted flags are not compared.</p>
    <label className="button secondary">Choose comparison save<input className="sr-only" type="file" aria-label="Choose comparison save" onChange={open}/></label>
    {error && <p className="error-text" role="alert">{error}</p>}
    {other && <><p className="panel-note">NPC research: {questSummary.compared} flag IDs compared; {questSummary.unavailable} unavailable because their inferred group address is unknown, conflicting, or outside a save. Manual mappings from NPC quests are not applied here.</p><p><strong>Current:</strong> {editor.name} ({editor.username}) · <strong>Comparison:</strong> {other.name} ({other.username})</p>
      {!groups.length ? <p>No differences found in the compared fields.</p> : groups.map(group => <section key={group.title}><h3>{group.title} ({group.rows.length})</h3><div className="comparison-table-wrap"><table className="comparison-table"><thead><tr><th scope="col">Field</th><th scope="col">Current</th><th scope="col">Comparison</th></tr></thead><tbody>{group.rows.map((entry, i) => <tr key={i}><th scope="row">{entry.label}</th><td>{entry.left}</td><td>{entry.right}</td></tr>)}</tbody></table></div></section>)}
    </>}
  </section>;
}
