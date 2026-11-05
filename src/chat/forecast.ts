import type { Role } from "../auth";
import { demandForecast } from "../reports/forecast-v2";
import { aggregateReports, type ReportOrder } from "../reports/analytics";

type Reply={agent:"Vận hành TMĐT"|"Phân tích & Báo cáo";text:string;link?:{to:string;label:string}};
const money=(n:number)=>new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND",maximumFractionDigits:0}).format(n);
const normal=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").toLowerCase();
const isForecastRole=(role?:Role)=>Boolean(role&&role!=="CUSTOMER");
const canReplenish=(role?:Role)=>["WAREHOUSE_LOGISTICS","WAREHOUSE_STAFF","ECOM_MANAGER","MANAGER","ADMIN"].includes(role||"");
const has=(q:string,...terms:string[])=>terms.some(term=>q.includes(term));

/** One source of truth for staff-chat forecasts and the forecast screen. */
export function forecastChat(text:string,role:Role|undefined,orders:ReportOrder[]):Reply[]|undefined{
 const q=normal(text);
 const asksForecast=has(q,"du bao","ban nhieu","ban chay","7 ngay toi","14 ngay toi","nhu cau");
 const asksStock=has(q,"nen nhap","nhap them","sap het","het hang","can nhap","ton kho");
 const asksOctober=has(q,"thang 10","thang muoi"),asksNovember=has(q,"thang 11","thang muoi mot");
 if(!asksForecast&&!asksStock&&!asksOctober&&!asksNovember)return undefined;
 if(!isForecastRole(role))return [{agent:asksStock?"Vận hành TMĐT":"Phân tích & Báo cáo",text:"Dữ liệu dự báo, tồn kho và doanh thu là báo cáo nội bộ; tài khoản khách hàng không thể truy cập."}];
 if(asksOctober||asksNovember){
   const range=asksOctober?{from:"2026-10-01",to:"2026-10-31"}:{from:"2026-11-01",to:"2026-11-06"};
   const data=aggregateReports(orders,range.from,range.to);
   return [{agent:"Phân tích & Báo cáo",text:`${asksOctober?"Tháng 10/2026":"01–06/11/2026"}: ${data.periodOrders} đơn đặt, doanh số ${money(data.periodSales)}, doanh thu đã thu ${money(data.periodRevenue)}, hoàn tiền ${money(data.periodRefunds)}, doanh thu thuần ${money(data.periodNetRevenue)}.`,link:{to:"/admin/reports",label:"Xem báo cáo"}}];
 }
 const data=demandForecast(orders,{leadDays:7,reviewDays:7,safetyStock:3});
 const top=data.ranked.slice(0,5);
 if(asksStock){
   if(!canReplenish(role))return [{agent:"Vận hành TMĐT",text:"Bạn có quyền xem báo cáo tổng hợp nhưng không có quyền xem tồn và đề xuất nhập hàng chi tiết.",link:{to:"/admin/reports",label:"Mở báo cáo chỉ đọc"}}];
   const urgent=data.rows.filter(row=>row.reorder>0).sort((a,b)=>b.reorder-a.reorder).slice(0,5);
   const detail=urgent.length?urgent.map(row=>`${row.name}: đề xuất ${row.reorder} ${row.unit} (tồn ${row.available}, dự báo ${Math.ceil(row.forecast7)} ${row.unit}/7 ngày)`).join("; "):"Chưa có SKU cần nhập thêm.";
   return [{agent:"Vận hành TMĐT",text:`Kỳ quan sát ${data.from}–${data.to}. ${detail}. Gợi ý không tự gửi hoặc tăng tồn kho.`,link:{to:"/admin/reports/forecast",label:"Xem đề xuất nhập hàng"}}];
 }
 return [{agent:"Phân tích & Báo cáo",text:`Dự báo 7 ngày tới (${data.from}–${data.to}): ${top.map((row,index)=>`${index+1}. ${row.name} — ${Math.ceil(row.forecast7)} ${row.unit}`).join("; ")||"chưa đủ dữ liệu"}.`,link:{to:"/admin/reports/forecast",label:"Xem biểu đồ dự báo"}}];
}
