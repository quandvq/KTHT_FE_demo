import { catalog } from '../data/catalog';
import { getInventory } from '../inventory/store';
import { createdKey, rangeKeys, dataAsOfKey, type ReportOrder } from './analytics';

export type DemandRow={productId:string;name:string;unit:string;daily:number;forecast7:number;history:number[];available:number;incoming:number;reorder:number;observedDays:number;total:number;recent:number;previous:number;daysOfCover:number};
export type DemandForecast={from:string;to:string;forecastFrom:string;observedDays:number;complete:boolean;rows:DemandRow[];ranked:DemandRow[];note:string};
const ceil=(n:number)=>Math.ceil(Math.max(0,n));
const plusDays=(key:string,n:number)=>{const d=new Date(`${key}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
export function demandForecast(orders:ReportOrder[],options:{leadDays:number;reviewDays:number;safetyStock:number}={leadDays:7,reviewDays:7,safetyStock:3}):DemandForecast{
 const asOf=dataAsOfKey(orders),to=asOf,from=plusDays(to,-27),dates=rangeKeys(from,to),totals=new Map<string,Map<string,number>>();
 for(const order of orders){if(order.status==='Đã hủy')continue;const key=createdKey(order);if(!key||key<from||key>to)continue;for(const line of order.lines||[]){const day=totals.get(line.product.id)||new Map<string,number>();day.set(key,(day.get(key)||0)+Math.max(0,line.qty||0));totals.set(line.product.id,day)}}
 const inventory=new Map(getInventory().map(row=>[row.productId,row]));
 const rows=[...totals.entries()].map(([id,byDay])=>{const product=catalog.find(p=>p.id===id);if(!product)return undefined;const history=dates.map(day=>byDay.get(day)||0),total=history.reduce((a,b)=>a+b,0),last7=history.slice(-7),prior21=history.slice(-28,-7),recent=last7.reduce((a,b)=>a+b,0),previous=prior21.reduce((a,b)=>a+b,0),rAvg=recent/Math.max(1,last7.length),pAvg=prior21.length?previous/prior21.length:rAvg,daily=history.length>=7?.6*rAvg+.4*pAvg:rAvg,available=inventory.get(id)?.available||0,incoming=0,reorder=ceil(daily*(options.leadDays+options.reviewDays)+options.safetyStock-available-incoming);return {productId:id,name:product.name,unit:product.saleUnit||'đơn vị',daily,forecast7:daily*7,history,available,incoming,reorder,observedDays:dates.length,total,recent,previous,daysOfCover:daily?available/daily:Infinity}}).filter((r):r is DemandRow=>Boolean(r)).sort((a,b)=>b.forecast7-a.forecast7||b.total-a.total);
 return {from,to,forecastFrom:plusDays(to,1),observedDays:dates.length,complete:true,rows,ranked:rows.filter(r=>r.total>0).slice(0,10),note:''};
}
