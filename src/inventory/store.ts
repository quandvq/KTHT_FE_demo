import { inventory } from '../workflow/store';
export const LOW_STOCK_THRESHOLD=5;
export const getInventory=inventory;
export type InventoryView=ReturnType<typeof inventory>[number];
export type InventoryRecord=Omit<InventoryView,'product'|'status'>;
const normalized=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const searchInventory=(query:string)=>{const terms=normalized(query).split(/[^a-z0-9]+/).filter(term=>term.length>1);return getInventory().filter(item=>terms.every(term=>normalized(item.product.name+' '+item.productId).includes(term)))};
