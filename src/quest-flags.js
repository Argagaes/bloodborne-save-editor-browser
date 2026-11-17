import { inferredFlagGroupOffset } from './flag-group-layout.js';

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

export function inferQuestFlagGroups(data) {
  const groups = {1:1002, 6:4127, 9:6002, 50001:1252, ...inferFlagGroups([...(data.shortcuts || []), ...(data['shortcut-auxiliary'] || []), ...(data.lamps || [])])};
  // Same map request groups used by the lamp relighting controls.
  for (const lamp of data.lamps || []) {
    const map = Math.floor(lamp.eventFlag / 10000) % 1000;
    const group = 70000 + map * 10;
    const base = lamp.offset - Math.floor((lamp.eventFlag % 1000) / 8) - 92000;
    if (Number.isSafeInteger(base) && base >= 0) {
      if (!Object.hasOwn(groups, group)) groups[group] = base;
      else if (groups[group] !== base) groups[group] = null;
    }
  }
  // Infer all known NPC groups using the pool layout; retain anchored conflicts as unavailable.
  for(const flag of Object.values(questFlags).flat()) {
    const group=Math.floor(flag.id/1000), offset=inferredFlagGroupOffset(group);
    if(offset===null)continue;
    if(!Object.hasOwn(groups,group))groups[group]=offset;
    else if(groups[group]!==offset)groups[group]=null;
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
  'Simon':[1710,1729], 'Brador':[1730,1749],
  'Gehrman':[1020,1039], 'Master Willem':[1060,1079], 'Adeline':[1750,1769], 'Skeptical Man':[1160,1179],
  'Lonely Old Woman':[1180,1199], 'Afflicted Beggar':[1200,1219],
  'Djura':[1320,1325],
  'Young Girl and Older Sister':[1260,1279], 'Annalise, Queen of the Vilebloods':[1040,1059],
  'Oedon Chapel Dweller':[1100,1119], 'Patches the Spider':[1420,1439],
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
    ...[12410803,12410804,12410805,12410806,12410807,12410809,12410810,12410811].map(id=>({id,section:'Map event flags',note:({12410803:'Henryk death transition to 1366',12410804:'Henryk death transition to 1367',12410805:'Eileen death handler',12410806:'Eileen hostility handler',12410807:'Attack-response event completion; on after hostility in the supplied saves',12410809:'Henryk spawn checks',12410810:'Henryk death handler',12410811:'Eileen joins Henryk fight'})[id] + ' · event completion flag'})),
    {id:72410543,section:'First encounter death research',note:'On after Eileen was killed in the supplied first-encounter saves; likely dialogue state, exact function unverified'},
    {id:72410544,section:'First encounter death research',note:'On after hostility in the supplied saves; the Central Yharnam hostility event checks this signal'},
    {id:9382,section:'First encounter death research',note:'Changed on at death in the supplied saves; meaning and causal relationship to Eileen are unknown'},
    {id:50001900,section:'Badge pickup research',note:'Crow Hunter Badge item-lot pickup flag: on after collecting the badge in the supplied saves; common event 9910 can also set or clear it'},
    {id:6643,section:'Badge pickup research',note:'On after collecting the badge in the supplied saves; common event 9910 uses it to control item-lot flags'},
    {id:9074,section:'Rewards',note:'Bold Hunter’s Mark gift request'}, {id:9075,section:'Rewards',note:'Rune gift request'},
    ...[[6744,'Shake Off Cape'],[6751,'Shhh!'],[6754,'Approval'],[6750,'Wait']].map(([id,note])=>({id,section:'Gesture flags',note:`${note}; gesture ownership flag`})),
  ],
  'Alfred': [{id:50001820,section:'NPC item-lot research',note:'Item lot 34040 for Alfred parameter 6150 in Cainhurst; first listed reward is a rune. Other events may affect this pickup flag.'},{id:50001800,section:'NPC item-lot research',note:'Item lot 34030 for NPC parameter 6151; first listed reward is Fire Paper. Pickup state is separate from quest progress.'},...candidateStates(1340,1359,{1340:'Initial Cathedral Ward placement; becomes 1344 if 9801 is on',1341:'First Ward placement, hostile',1342:'First Ward placement, dead / treasure',1343:'Ward corpse and treasure after Cainhurst branch (1351 and 72500359)',1344:'Later Ward placement, friendly',1345:'Later Ward placement, hostile',1346:'Later Ward placement, dead / treasure',1347:'Later Ward placement after talk signal 72400465',1350:'Cainhurst death-related state',1351:'Cainhurst-related state checked by common event 9770'}),{id:9072,section:'Rewards',note:'Gift request'},{id:9073,section:'Rewards',note:'Gift request'}],
  'Arianna': [{id:50001200,section:'NPC item-lot research',note:'Item lot 28010 for NPC parameter 6110; first listed reward is attire. This does not establish every reward branch.'},...candidateStates(1220,1239,{1220:'Initial state; 9802 changes it to 1234',1223:'Set by 1233 on Cathedral Ward load',1224:'Chapel state; enabled from 1232',1225:'Blood moon transition from 1224 (9802)',1226:'From 1225 when 9464 is on',1228:'From 1226 when 9461 is on; chapel object state changes',1230:'Set alongside Adella 1306 under cross-NPC conditions',1231:'Set by survivor-related event 12400629',1234:'Blood moon reached while initial state 1220 was active'}), ...[72400480,72400489,72400498,72400499].map(id=>({id,section:'Talk and gifts',note:'Arianna talk or gift flag; mapping may need calibration'}))],
  'Adella': [{id:50001610,section:'NPC item-lot research',note:'Item lot 32030 for NPC parameter 6140; first listed reward is a rune. Pickup state is separate from quest progress.'},...candidateStates(1300,1319,{1300:'Initial state',1303:'NPC death state, except when 1308 was active',1304:'Chapel placement, set from 1313',1305:'From 1304 after talk signal 72400394',1306:'Chapel cross-NPC branch; 1230 also set',1307:'From 1304/1305 when 9802 is on',1308:'From 1306 when 9802 is on; hostile encounter',1312:'Set by survivor-related event 12400629',1317:'NPC death from hostile state 1308'}), ...[72400380,72400383,72400384,72400390,72400392,72400393,72400394,72400398].map(id=>({id,section:'Talk and gifts',note:'Adella talk or gift flag; mapping may need calibration'}))],
  'Gilbert': [...candidateStates(1240,1259,{1240:'Initial state',1241:'From 1240 when 9800, 9801 or 9802 is on',1242:'From 1241 when 9801 or 9802 is on',1243:'From 1242 with talk signal 72410504, or when 9802 is on',1244:'Repeated attacks on window entity can set this state',1245:'Character 2410781 dead; treasure dropped',1246:'From 1243 when 9802 is on; character 2410781 enabled'}),{id:12410761,section:'Map events',note:'Character death handler; event completion flag'},{id:9066,section:'Rewards',note:'Flamesprayer gift request'}],
  'Iosefka and the Impostor': [{id:50000805,section:'NPC item-lot research',note:'Item lot 24075 for NPC parameter 6071; first listed reward is One Third of Umbilical Cord. Alternative impostor state; conditions unverified.'},{id:50000800,section:'NPC item-lot research',note:'Item lot 24070 for NPC parameter 6070; first listed reward is a rune. Alternative impostor states can use different lots.'},...candidateStates(1120,1139,{1120:'Initial state; 9401 changes it to 1121',1121:'Clinic window character enabled',1122:'From 1121 after talk signal 72410305',1123:'From 1121/1122 after hostility signal 72410309; window character hidden',1124:'9800 hides the window character and clears 1120–1124'}),...range(1140,1159).map(id=>({id,section:'Impostor candidate states',note:'Impostor dialogue t241314 checks 1140–1149; the full range and individual states need verification'})),...range(72410300,72410311).map(id=>({id,section:'Clinic talk and gifts',note:({72410305:'Iosefka move signal',72410309:'Hostility signal',72410310:'Blood vial gift request'})[id] || 'Talk or gift flag; mapping may need calibration'}))],
  'Valtr, Master of the League': [{id:1790,section:'Death and dialogue',note:'Death-related flag'},{id:1800,section:'Death and dialogue',note:'Talk condition'},...range(6810,6812).map(id=>({id,section:'League',note:'League rank'})),{id:6813,section:'League',note:'League joined'},{id:6814,section:'League',note:'League talk flag'},...[[72700321,'Impurity rune request'],[72700322,'League Staff request'],[72700330,'Helm death / gift request']].map(([id,note])=>({id,section:'Rewards',note}))],
  'Simon': [
    {id:1720,section:'DLC progression',note:'Initial state used by the three DLC maps'},
    {id:1721,section:'DLC progression',note:'Hunter’s Nightmare event moves 1720 to 1721 under dialogue and world conditions'},
    {id:1722,section:'DLC progression',note:'Research Hall transition; checks 73400403 and 13500100'},
    {id:1723,section:'DLC progression',note:'Later Research Hall / Fishing Hamlet state; multiple routes can set it'},
    {id:1713,section:'DLC progression',note:'Fishing Hamlet event changes 1723 to 1713 after signal 73600501'},
    ...range(1710,1712).map(id=>({id,section:'Death-related flags',note:({1710:'Hunter’s Nightmare first Simon death event',1711:'Hunter’s Nightmare second Simon death event',1712:'Research Hall Simon death event'})[id]})),
    ...range(1714,1719).map(id=>({id,section:'Other state flags',note:'State-range flag; meaning unconfirmed'})),
    {id:1724,section:'Other state flags',note:'State-range flag; meaning unconfirmed'},
    ...range(1725,1727).map(id=>({id,section:'Hostility branches',note:({1725:'Hunter’s Nightmare first Simon hostile state',1726:'Hunter’s Nightmare second Simon hostile state',1727:'Research Hall Simon hostile state'})[id]})),
    ...range(1728,1729).map(id=>({id,section:'Other state flags',note:'State-range flag; meaning unconfirmed'})),
    ...[[73400430,'Hunter’s Nightmare bowblade request'],[73400431,'Hunter’s Nightmare bowblade request'],[73500630,'Research Hall bowblade request'],[73600530,'Fishing Hamlet bowblade request']].map(([id,note])=>({id,section:'Bowblade requests',note}))],
  'Gehrman': [...candidateStates(1020,1039,{1020:'Initial state; 9403 advances it to 1021',1021:'Hunter’s Dream placement enabled',1022:'After dialogue signal 72100121 and leaving the Dream; 9800 can advance it to 1023',1023:'Hunter’s Dream placement enabled',1024:'After dialogue signal 72100123 and leaving the Dream; 12301800 or 9801 advances it to 1025',1025:'Hunter’s Dream placement enabled',1026:'After dialogue signal 72100125 and leaving the Dream; hidden / random placement branch',1027:'After 9802, dialogue signal 72100128 and leaving the Dream; random placement branch',1028:'Late placement, set when 9462 is enabled',1029:'Final encounter state set when 12101802 is enabled',1030:'Set after Gehrman’s boss defeat flag 12101800'}),{id:12101800,section:'Boss event',note:'Gehrman defeat flag; boss progression, not a revival preset'}],
  'Skeptical Man': [{id:50000900,section:'NPC item-lot research',note:'Item lot 25000 for NPC parameter 6080; first listed reward is Pungent Blood Cocktail. Branch behavior is unverified.'},...candidateStates(1160,1179,{1160:'Initial state; 9802 may move it to 1170',1161:'Death state after character 2400765 dies',1163:'Set from 1169 on Cathedral Ward load',1164:'Chapel placement; set from 1168',1165:'Chapel placement after 9802',1166:'Survivor death branch set by event 12400629',1167:'Chapel character placement branch',1168:'Transitions to 1164 on Cathedral Ward load',1169:'Transitions to 1163 on Cathedral Ward load',1170:'Late branch from 1160 when 9802 is enabled'})],
  'Lonely Old Woman': [{id:50001000,section:'NPC item-lot research',note:'Item lot 26040 for NPC parameter 6090; first listed reward is Sedative. Branch behavior is unverified.'},...candidateStates(1180,1199,{1180:'Initial state',1181:'Chapel placement; set when 1193 is enabled',1183:'Death of character 2400730',1184:'Chapel placement branch',1185:'From 1181 when 9801 is enabled',1186:'From 1185 when 9467 is enabled',1187:'From 1186 when 72400900 is enabled',1188:'Later branch after 72400919',1189:'From 1188 when 72400350 is enabled',1191:'Survivor death branch set by event 12400629',1193:'On Cathedral Ward load transitions to 1181'})],
  'Afflicted Beggar': [{id:50001100,section:'NPC item-lot research',note:'Item lot 27070 for NPC parameter 6100; first listed reward is a rune. Shared or alternative lot behavior is unverified.'},...candidateStates(1200,1219,{1200:'Initial state',1205:'Chapel human placement branch',1206:'Chapel human placement branch',1207:'Chapel human placement branch',1208:'Survivor-related branch checked by event 12400629',1210:'Death state for the chapel human and beast characters'})],
  'Brador': [...candidateStates(1730,1749,{1730:'Cell character 3500901 death state; event 13500900 slot 2 clears the range and sets this flag'})],
  'Doll': [{id:12100122,note:'Small Hair Ornament condition (may be recalculated)'},{id:72100112,note:'Tear Stone gift request'},{id:6700,note:'Level-up in use (temporary)'}],
  'Annalise, Queen of the Vilebloods': [...candidateStates(1040,1059,{1040:'Initial state; checked by Annalise dialogue',1041:'State checked by Annalise dialogue',1042:'Set by Cainhurst event 12500010'}),{id:9042,section:'Rewards',note:'Covenant rune gift request'},{id:9043,section:'Rewards',note:'Queenly Flesh award request'}],
  'Djura': [{id:50001700,section:'NPC item-lot research',note:'Item lot 33010 for NPC parameter 6300; first listed reward is Powder Keg Hunter Badge. Pickup state may be rewritten by other events.'},...candidateStates(1320,1325,{1320:'Friendly team state; approaching a region can change it to 1321',1321:'Enemy team state after entering region 2302710',1322:'Enemy team state after entering specified regions',1323:'Hostile branch after attacks or other conditions',1324:'Death state; character disabled and treasure dropped',1325:'Friendly state after talk signal 72300305'}),{id:12300704,section:'Map events',note:'Djura death handler; event completion flag'},{id:9071,section:'Rewards',note:'Powder Keg Hunter Badge gift request'},{id:6757,section:'Gesture flags',note:'Brush off Dust; gesture ownership flag'}],
  'Oedon Chapel Dweller': [...candidateStates(1100,1119,{1100:'Initial state',1106:'Death state set by event 12400706',1108:'Special death / survivor branch'}),{id:6753,section:'Gesture flags',note:'Triumph; gesture ownership flag'}],
  'Patches the Spider': [...candidateStates(1420,1439,{1420:'Initial state',1423:'Common event 9780 changes 1422 to 1423 under additional conditions'}),{id:6756,section:'Gesture flags',note:'Beg for Life; gesture ownership flag'},{id:9077,section:'Rewards',note:'Nightmare Frontier rune gift request'}],
  'Young Girl and Older Sister': [...candidateStates(1260,1279,{1260:'Initial state; time or dialogue conditions can move it on',1261:'From 1260 when 12411802 and dialogue signal 72410413 are on',1263:'From 1260–1262 when 9801 is on',1264:'Set by dialogue signal 72410403; map load changes it to 1267',1265:'Set by dialogue signal 72410404; map load changes it to 1267',1266:'Map load changes it to 1268',1267:'Later window state; can change to 1271 when 9802 is on',1268:'Clinic-related survivor state checked by impostor dialogue',1269:'Later state from 1263 or 1270 with additional conditions',1270:'From 1260 when 9801 is on',1271:'From 1267 when 9802 is on',1272:'Set by dialogue signal 72410421; map load changes it to 1273',1273:'Enables an object and treasure at the window'}),{id:9067,section:'Rewards',note:'Tiny Music Box gift request'}],
  'Adeline': [{id:50002270,section:'NPC item-lot research',note:'Item lot 43040 for NPC parameter 402290; first listed reward is Brain Fluid. Human/head branches may differ.'},{id:50002250,section:'NPC item-lot research',note:'Item lot 43030 for NPC parameter 402300; first listed reward is a key. Human/head branches may differ.'},...candidateStates(1750,1769,{1750:'Death branch; Research Hall disables the human and head characters',1751:'Head character branch with treasure handling',1752:'Alternative human placement branch',1760:'Initial state when the range is empty; human character',1761:'Dialogue signal 73500301 advances 1760 to this state',1762:'Dialogue signal 73500309 advances 1761 to this state; head character placement'}), ...[[73500320,'Blood of Adeline request'],[73500321,'Balcony Key request'],[73500322,'Milkweed rune request']].map(([id,note])=>({id,section:'Rewards',note}))],
  'Master Willem': [{id:50000400,section:'NPC item-lot research',note:'Item lot 20000 for NPC parameter 513000; first listed reward is a rune. Event 9910 may rewrite this flag.'},...candidateStates(1060,1079,{1060:'Initial state',1061:'Death state; 13200120 disables character 3200100 and drops treasure'}),{id:73200300,section:'Dialogue',note:'Interaction request consumed by event 13200121; triggers animation 7010 and can award insight'}],
  'Yamamura the Wanderer': [{id:13501900,section:'Cell encounter',note:'Death-handler completion flag (slot 0); hides cell character 3500930 on reload. Clearing it alone is not a tested revival preset'}],
  'Fishing Hamlet Priest': [{id:73600300,note:'Accursed Brew gift request'}],
  'Ludwig (head)': [{id:73400424,note:'Holy Moonlight Sword gift request'}],
};
