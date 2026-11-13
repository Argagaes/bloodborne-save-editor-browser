// Group offsets are relative to SaveEditor.flagOffset. A group covers 1,000 flags.
export function inferFlagGroups(entries) {
  const groups = {};
  for (const {eventFlag, offset, mask} of entries) {
    const group = Math.floor(eventFlag / 1000);
    const bit = eventFlag % 1000;
    if (mask !== (0x80 >> (bit % 8))) continue;
    const base = offset - Math.floor(bit / 8);
    if (groups[group] === undefined) groups[group] = base;
    else if (groups[group] !== base) groups[group] = null;
  }
  return groups;
}

export function flagAddress(editor, flag, base) {
  if (!Number.isSafeInteger(flag) || flag < 0 || !Number.isSafeInteger(base) || base < 0) throw Error('Enter a valid flag and group offset.');
  const offset = editor.flagOffset + base + Math.floor((flag % 1000) / 8);
  if (offset < editor.flagOffset || offset >= editor.lced || offset >= editor.bytes.length) throw Error('Flag address is outside the character flag area.');
  return {offset, mask: 0x80 >> (flag % 8)};
}

export function readQuestFlag(editor, flag, base) {
  const {offset, mask} = flagAddress(editor, flag, base);
  return !!(editor.bytes[offset] & mask);
}

export function writeQuestFlag(editor, flag, base, enabled) {
  const {offset, mask} = flagAddress(editor, flag, base);
  editor.put(offset, enabled ? editor.bytes[offset] | mask : editor.bytes[offset] & ~mask, 1);
}

const range = (start, end) => Array.from({length:end-start+1}, (_, i)=>start+i);
export const questStateRanges = {
  'Eileen the Crow':[1360,1379], 'Alfred':[1340,1359],
  'Arianna':[1220,1239], 'Adella':[1300,1319],
  'Gilbert':[1240,1259], 'Iosefka and the Impostor':[1120,1139],
};
const candidateStates = (start, end, notes = {}) => range(start,end).map(id=>({id,section:'Candidate quest states',note:notes[id] || 'State in associated range; exact meaning unconfirmed'}));
export const questFlags = {
  'Eileen the Crow': [
    {id:1360,section:'Early encounters',note:'Initial state; Central Yharnam first encounter'},
    {id:1361,section:'Early encounters',note:'First encounter progressed (after dialogue signal 72410540)'},
    {id:1362,section:'Early encounters',note:'Cathedral Ward reached from state 1360'},
    {id:1363,section:'Early encounters',note:'Cathedral Ward reached from state 1361'},
    {id:1364,section:'Tomb of Oedon',note:'Tomb encounter state; transition into it not yet identified'},
    {id:1365,section:'Tomb of Oedon',note:'Eileen joins Henryk fight from state 1363 or 1364'},
    {id:1366,section:'Tomb of Oedon',note:'Henryk defeated while state 1363 was active'},
    {id:1367,section:'Tomb of Oedon',note:'Henryk defeated while state 1364 or 1365 was active'},
    {id:1373,section:'Grand Cathedral branches',note:'Before blood moon: 1373 changes to 1370 when 9802 is set'},
    {id:1374,section:'Grand Cathedral branches',note:'Before blood moon: 1374 changes to 1372 when 9802 is set'},
    {id:1370,section:'Grand Cathedral branches',note:'Blood moon branch: Grand Cathedral encounter'},
    {id:1371,section:'Grand Cathedral branches',note:'Grand Cathedral opponent defeated from state 1370'},
    {id:1372,section:'Grand Cathedral branches',note:'Blood moon alternate branch; hostile NPC at Grand Cathedral'},
    {id:1375,section:'Grand Cathedral branches',note:'Late quest state; exact transition unconfirmed'},
    {id:1368,section:'Death and hostility branches',note:'Eileen death state'},
    {id:1369,section:'Death and hostility branches',note:'Eileen hostile state'},
    {id:1376,section:'Other state flags',note:'Additional death marker: Cathedral Ward event 12400650 can set it together with 1368',marker:true},
    ...range(1377,1379).map(id=>({id,section:'Other state flags',note:'Unclassified in the state range'})),
    ...range(1700,1705).map(id=>({id,section:'Death / hostility location',note:({1700:'Early Central Yharnam encounter',1701:'Cathedral Ward earlier state',1702:'Tomb of Oedon fight location',1703:'Tomb of Oedon alternate location',1704:'Grand Cathedral 1370/1371 branch',1705:'Grand Cathedral 1372 branch'})[id]})),
    ...[12410803,12410804,12410805,12410806,12410809,12410810,12410811].map(id=>({id,section:'Map event flags',note:({12410803:'Henryk death transition to 1366',12410804:'Henryk death transition to 1367',12410805:'Eileen death handler',12410806:'Eileen hostility handler',12410809:'Henryk spawn checks',12410810:'Henryk death handler',12410811:'Eileen joins Henryk fight'})[id] + ' · event completion flag'})),
    {id:9074,section:'Rewards',note:'Bold Hunter’s Mark gift request'}, {id:9075,section:'Rewards',note:'Rune gift request'},
  ],
  'Alfred': [...candidateStates(1340,1359,{1340:'Initial Cathedral Ward placement; becomes 1344 if 9801 is on',1341:'First Ward placement, hostile',1342:'First Ward placement, dead / treasure',1343:'Ward corpse and treasure after Cainhurst branch (1351 and 72500359)',1344:'Later Ward placement, friendly',1345:'Later Ward placement, hostile',1346:'Later Ward placement, dead / treasure',1347:'Later Ward placement after talk signal 72400465',1350:'Cainhurst death-related state',1351:'Cainhurst-related state checked by common event 9770'}),{id:9072,section:'Rewards',note:'Gift request'},{id:9073,section:'Rewards',note:'Gift request'}],
  'Arianna': [...candidateStates(1220,1239,{1220:'Initial state; 9802 changes it to 1234',1223:'Set by 1233 on Cathedral Ward load',1224:'Chapel state; enabled from 1232',1225:'Blood moon transition from 1224 (9802)',1226:'From 1225 when 9464 is on',1228:'From 1226 when 9461 is on; chapel object state changes',1230:'Set alongside Adella 1306 under cross-NPC conditions',1231:'Set by survivor-related event 12400629',1234:'Blood moon reached while initial state 1220 was active'}), ...[72400480,72400489,72400498,72400499].map(id=>({id,section:'Talk and gifts',note:'Arianna talk or gift flag; mapping may need calibration'}))],
  'Adella': [...candidateStates(1300,1319,{1300:'Initial state',1303:'NPC death state, except when 1308 was active',1304:'Chapel placement, set from 1313',1305:'From 1304 after talk signal 72400394',1306:'Chapel cross-NPC branch; 1230 also set',1307:'From 1304/1305 when 9802 is on',1308:'From 1306 when 9802 is on; hostile encounter',1312:'Set by survivor-related event 12400629',1317:'NPC death from hostile state 1308'}), ...[72400380,72400383,72400384,72400390,72400392,72400393,72400394,72400398].map(id=>({id,section:'Talk and gifts',note:'Adella talk or gift flag; mapping may need calibration'}))],
  'Gilbert': [...candidateStates(1240,1259,{1240:'Initial state',1241:'From 1240 when 9800, 9801 or 9802 is on',1242:'From 1241 when 9801 or 9802 is on',1243:'From 1242 with talk signal 72410504, or when 9802 is on',1244:'Repeated attacks on window entity can set this state',1245:'Character 2410781 dead; treasure dropped',1246:'From 1243 when 9802 is on; character 2410781 enabled'}),{id:12410761,section:'Map events',note:'Character death handler; event completion flag'},{id:9066,section:'Rewards',note:'Flamesprayer gift request'}],
  'Iosefka and the Impostor': [...candidateStates(1120,1139,{1120:'Initial state; 9401 changes it to 1121',1121:'Clinic window character enabled',1122:'From 1121 after talk signal 72410305',1123:'From 1121/1122 after hostility signal 72410309; window character hidden',1124:'9800 hides the window character and clears 1120–1124'}),...range(72410300,72410311).map(id=>({id,section:'Clinic talk and gifts',note:({72410305:'Iosefka move signal',72410309:'Hostility signal',72410310:'Blood vial gift request'})[id] || 'Talk or gift flag; mapping may need calibration'}))],
  'Valtr, Master of the League': [{id:1790,section:'Death and dialogue',note:'Death-related flag'},{id:1800,section:'Death and dialogue',note:'Talk condition'},...range(6810,6812).map(id=>({id,section:'League',note:'League rank'})),{id:6813,section:'League',note:'League joined'},{id:6814,section:'League',note:'League talk flag'},...[[72700321,'Impurity rune request'],[72700322,'League Staff request'],[72700330,'Helm death / gift request']].map(([id,note])=>({id,section:'Rewards',note}))],
  'Simon': [...range(1710,1713).map(id=>({id,section:'Death-related flags',note:'Death-related flag; location dependent'})),...[[73400430,'Hunter’s Nightmare bowblade request'],[73400431,'Hunter’s Nightmare bowblade request'],[73500630,'Research Hall bowblade request'],[73600530,'Fishing Hamlet bowblade request']].map(([id,note])=>({id,section:'Bowblade requests',note}))],
  'Doll': [{id:12100122,note:'Small Hair Ornament condition (may be recalculated)'},{id:72100112,note:'Tear Stone gift request'},{id:6700,note:'Level-up in use (temporary)'}],
  'Annalise, Queen of the Vilebloods': [{id:9042,note:'Covenant rune gift request'},{id:9043,note:'Queenly Flesh award request'}],
  'Djura': [{id:9071,note:'Powder Keg Hunter Badge gift request'}],
  'Young Girl and Older Sister': [{id:9067,note:'Tiny Music Box gift request'}],
  'Adeline': [[73500320,'Blood of Adeline request'],[73500321,'Balcony Key request'],[73500322,'Milkweed rune request']].map(([id,note])=>({id,note})),
  'Fishing Hamlet Priest': [{id:73600300,note:'Accursed Brew gift request'}],
  'Ludwig (head)': [{id:73400424,note:'Holy Moonlight Sword gift request'}],
};
