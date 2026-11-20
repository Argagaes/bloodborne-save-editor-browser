export function registerExperimentalEquipment(data) {
 const research={};
 for(const item of data['experimental-equipment']||[]) {
  if(!item.present) continue;
  const info={item_name:item.name,item_desc:'Experimental equipment record. Inventory and in-game behavior untested.',item_img:'',experimental:true};
  if(item.family==='weapon'&&!Object.values(data.weapons).some(group=>Object.hasOwn(group,item.id))) research[item.id]=info;
  if(item.family==='armor'&&!Object.hasOwn(data.armors,item.id)) data.armors[item.id]=info;
 }
 data.weapons.research=research;
 return data;
}
