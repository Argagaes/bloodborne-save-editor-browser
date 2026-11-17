export function registerExperimentalItems(data) {
  const research={};
  for(const item of data['experimental-items']) {
    if(!item.present || Object.values(data.items).some(items=>Object.hasOwn(items,item.id))) continue;
    research[item.id]={item_name:item.name,item_desc:`Experimental ${item.classification} record. In-game behavior untested.`,item_img:'',experimental:true};
  }
  data.items.research=research;
  return data;
}
