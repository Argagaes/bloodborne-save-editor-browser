export function registerExperimentalEffects(data) {
  for (const group of data['experimental-effects']) {
    const effects=group.kind==='gem'?data.upgrades.gemEffects:data.upgrades.runeEffects;
    for (const item of group.ids) {
      const previous=effects[item.id];
      if (!previous || group.label==='HP recovery after boss defeat (Forlorn)') effects[item.id]={name:`Experimental ${group.kind}`,effect:`${group.label} · ID ${item.id}`,rating:item.rank || 0,level:0,note:'Experimental effect; in-game behavior unverified.',experimental:true};
    }
  }
  return data;
}
