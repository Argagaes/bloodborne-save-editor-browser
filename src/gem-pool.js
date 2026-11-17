export function gemPool(entries,categories,kind) {
  const rows=entries.filter(e=>e.kind===kind).map(e=>({...e,weight:e.weights.reduce((sum,[category,base])=>sum+base*Math.pow(100,categories.filter(x=>x===category).length),0)}));
  const total=rows.reduce((sum,row)=>sum+row.weight,0);
  return rows.map(row=>({...row,chance:total?row.weight/total*100:0})).sort((a,b)=>b.chance-a.chance);
}
