import {catalog,type CatalogProduct} from '../data/catalog';

export type InventoryRecord={productId:string;warehouseId:'demo';warehouseName:string;physical:number;reserved:number;available:number;updatedAt:string};
export type InventoryView=InventoryRecord&{product:CatalogProduct;status:'Còn hàng'|'Sắp hết'|'Hết hàng'};
export const LOW_STOCK_THRESHOLD=5;
const KEY='ktht.inventory.v1';
const hash=(value:string)=>[...value].reduce((sum,char)=>(sum*31+char.charCodeAt(0))>>>0,7);
const seed=(id:string):InventoryRecord=>{const value=hash(id)%17;const physical=value===0?0:value===1?3:8+(hash(id)%53);const reserved=physical?hash(id)%Math.min(4,physical+1):0;return {productId:id,warehouseId:'demo',warehouseName:'Kho trung tâm',physical,reserved,available:Math.max(0,physical-reserved),updatedAt:'2026-11-03T00:00:00.000Z'}};
const read=():InventoryRecord[]=>{try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(saved)?saved:[]}catch{return []}};
export const getInventory=():InventoryView[]=>{const saved=read();const ids=new Set(saved.map(item=>item.productId));const added=catalog.filter(product=>!ids.has(product.id)).map(product=>seed(product.id));const records=(added.length?[...saved,...added]:saved).map(record=>/kho\s+(demo|mô phỏng)/iu.test(record.warehouseName)?{...record,warehouseName:'Kho trung tâm'}:record);if(added.length||records.some((record,index)=>record!==saved[index]))localStorage.setItem(KEY,JSON.stringify(records));return records.flatMap(record=>{const product=catalog.find(item=>item.id===record.productId);if(!product)return [];const available=Math.max(0,record.physical-record.reserved);const status=available===0?'Hết hàng':available<=LOW_STOCK_THRESHOLD?'Sắp hết':'Còn hàng';return [{...record,available,product,status}]})};
const normalized=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const searchInventory=(query:string)=>{const terms=normalized(query).split(/[^a-z0-9]+/).filter(term=>term.length>1);const data=getInventory();return terms.length?data.filter(item=>terms.every(term=>normalized(`${item.product.name} ${item.product.id} ${item.product.packageSize}`).includes(term))):data};
