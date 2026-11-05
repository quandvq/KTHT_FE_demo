import {catalog} from '../data/catalog';
import {getInventory} from '../inventory/store';
import {createdKey,rangeKeys,todayKey} from './analytics';

type ForecastLine={product:{id:string;name:string;saleUnit?:string};qty:number};
type ForecastOrder={id:string;createdAt?:string;date?:string;status:string;lines:ForecastLine[]};
export type DemandRow={productId:string;name:string;unit:string;daily:number;forecast7:number;history:number[];available:number;incoming:number;reorder:number;observedDays:number;total:number};
export type DemandForecast={from:string;to:string;forecastFrom:string;observedDays:number;complete:boolean;rows:DemandRow[];ranked:DemandRow[];note:string};
const ceil=(value:number)=>Math.ceil(Math.max(0,value));
export const demandForecast=(orders:ForecastOrder[],options:{leadDays:number;reviewDays:number;safetyStock:number}={leadDays:7,reviewDays:7,safetyStock:3}):DemandForecast=>{
  const today=todayKey(),yesterday=new Date(`${today}T00:00:00Z`);yesterday.setUTCDate(yesterday.getUTCDate()-1);const to=yesterday.toISOString().slice(0,10),forecastFrom=today;
  const keys=orders.map(order=>createdKey(order)).filter((key):key is string=>Boolean(key)&&key!<=to).sort();
  const coverageStart=keys[0];const fromDate=new Date(`${to}T00:00:00Z`);fromDate.setUTCDate(fromDate.getUTCDate()-27);const defaultFrom=fromDate.toISOString().slice(0,10);const from=coverageStart&&coverageStart>defaultFrom?coverageStart:defaultFrom;
  const dates=coverageStart?rangeKeys(from,to):[];const observedDays=dates.length;const complete=observedDays===28;const totals=new Map<string,Map<string,number>>();
  for(const order of orders){if(order.status==='Đã hủy')continue;const key=createdKey(order);if(!key||key<from||key>to)continue;for(const line of order.lines||[]){const daily=totals.get(line.product.id)||new Map<string,number>();daily.set(key,(daily.get(key)||0)+Math.max(0,line.qty||0));totals.set(line.product.id,daily)}}
  const inventory=new Map(getInventory().map(record=>[record.productId,record]));const rows=[...totals.entries()].map(([productId,byDay])=>{const product=catalog.find(item=>item.id===productId);if(!product)return undefined;const history=dates.map(key=>byDay.get(key)??0);const total=history.reduce((sum,value)=>sum+(value||0),0),daily=observedDays?total/observedDays:0,forecast7=daily*7,stock=inventory.get(productId);const available=stock?.available??0,incoming=0;const reorder=ceil(daily*(options.leadDays+options.reviewDays)+options.safetyStock-available-incoming);return {productId,name:product.name,unit:product.saleUnit||'đơn vị',daily,forecast7,history,available,incoming,reorder,observedDays,total}}).filter((row):row is DemandRow=>Boolean(row)).sort((a,b)=>b.forecast7-a.forecast7||b.total-a.total);
  const note=!observedDays?'Chưa đủ dữ liệu: chưa có ngày bán hàng hoàn chỉnh.':observedDays<7?'Dự báo tham khảo — dữ liệu còn ít.':!complete?'Dự báo tham khảo — chưa đủ 28 ngày lịch có dữ liệu đầy đủ.':'Dữ liệu đơn hàng được giả định đầy đủ từ ngày ghi nhận sớm nhất.';
  return {from:observedDays?from:'',to:observedDays?to:'',forecastFrom,observedDays,complete,rows,ranked:rows.filter(row=>row.total>0).slice(0,5),note};
};
