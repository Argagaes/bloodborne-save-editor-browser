import { inferQuestFlagGroups, questFlags, readQuestFlag } from './quest-flags.js';

// Match the named controls and the raw candidate ranges in NPC quest research.
export function compareQuestFlags(current, other, data) {
  const flags = new Map();
  for (const [npc, entries] of Object.entries(questFlags)) for (const entry of entries) {
    const item=flags.get(entry.id) || {id:entry.id, descriptions:[]};
    const description=`${npc} · ${entry.section || 'Related flags'} · ${entry.note}`;
    if (!item.descriptions.includes(description)) item.descriptions.push(description);
    flags.set(entry.id,item);
  }
  for (const [start,end] of [[1000,1459],[1700,1819]]) for(let id=start;id<=end;id++) {
    if (!flags.has(id)) flags.set(id,{id,descriptions:['Unassigned candidate NPC state bit; meaning unknown']});
  }
  const leftGroups=inferQuestFlagGroups(current.data || data), rightGroups=inferQuestFlagGroups(other.data || data);
  const rows=[]; let unavailable=0, compared=0;
  for(const flag of [...flags.values()].sort((a,b)=>a.id-b.id)) {
    const leftBase=leftGroups[Math.floor(flag.id/1000)], rightBase=rightGroups[Math.floor(flag.id/1000)];
    if(leftBase==null || rightBase==null){unavailable++;continue;}
    try {
      const left=readQuestFlag(current,flag.id,leftBase), right=readQuestFlag(other,flag.id,rightBase);
      compared++;
      if(left!==right) rows.push({label:`Flag ${flag.id} · ${flag.descriptions.join(' | ')}`,left:left?'On':'Off',right:right?'On':'Off'});
    } catch {unavailable++;}
  }
  return {rows,unavailable,compared};
}
